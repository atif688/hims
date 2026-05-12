export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole, requireSession } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { generateInvoiceNo } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const Item = z.object({
  kind: z.enum(['CONSULT', 'PROCEDURE', 'LAB', 'PHARMACY', 'RADIOLOGY']),
  description: z.string(),
  qty: z.coerce.number().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  refId: z.string().optional().nullable(),
});

const Body = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional().nullable(),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(Item).min(1),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSession();
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const items = await prisma.invoice.findMany({
      where: { status: status as never },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { patient: true, items: true, payments: true },
    });
    return ok(items);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const session = await requireRole('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN');
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) return err('Invalid payload');
    const d = parsed.data;

    let subtotal = 0;
    const items = d.items.map((i) => {
      const lineTotal = i.qty * i.unitPrice - (i.discount || 0);
      subtotal += lineTotal;
      return { ...i, total: lineTotal };
    });
    const discount = d.discount ?? 0;
    const tax = d.tax ?? 0;
    const total = Math.max(0, subtotal - discount + tax);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: generateInvoiceNo(),
        patientId: d.patientId,
        appointmentId: d.appointmentId || null,
        status: 'ISSUED',
        subtotal,
        discount,
        tax,
        total,
        notes: d.notes || null,
        issuedAt: new Date(),
        items: {
          create: items.map((i) => ({
            kind: i.kind,
            description: i.description,
            qty: i.qty,
            unitPrice: i.unitPrice,
            discount: i.discount || 0,
            total: i.total,
            refId: i.refId || null,
          })),
        },
      },
      include: { items: true, patient: true },
    });

    await logAudit({
      userId: session.sub,
      action: 'CREATE',
      entity: 'invoice',
      entityId: invoice.id,
      after: invoice,
    });
    return ok(invoice, { status: 201 });
  });
}
