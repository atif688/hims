export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole, requireSession } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { generateOrderNo } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const Body = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentId: z.string().optional().nullable(),
  priority: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).optional(),
  clinicalNotes: z.string().optional().nullable(),
  testIds: z.array(z.string()).min(1),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSession();
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const kind = url.searchParams.get('kind') ?? undefined;

    const items = await prisma.labOrder.findMany({
      where: {
        status: status as never,
        ...(kind ? { items: { some: { test: { kind: kind as never } } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        items: { include: { test: true } },
      },
    });
    return ok(items);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const session = await requireRole('DOCTOR', 'SUPER_ADMIN');
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) return err('Invalid payload');
    const d = parsed.data;

    const tests = await prisma.labTest.findMany({ where: { id: { in: d.testIds } } });
    if (tests.length === 0) return err('No tests selected');

    const orderNo = generateOrderNo(tests.some((t) => t.kind === 'RADIOLOGY') ? 'RAD' : 'LAB');
    const order = await prisma.labOrder.create({
      data: {
        orderNo,
        patientId: d.patientId,
        doctorId: d.doctorId,
        appointmentId: d.appointmentId || null,
        priority: d.priority ?? 'ROUTINE',
        clinicalNotes: d.clinicalNotes || null,
        items: {
          create: tests.map((t) => ({
            testId: t.id,
            refRange: t.refRange || null,
            resultUnits: t.units || null,
          })),
        },
      },
      include: { items: { include: { test: true } } },
    });

    await logAudit({
      userId: session.sub,
      action: 'CREATE',
      entity: 'labOrder',
      entityId: order.id,
      after: order,
    });

    return ok(order, { status: 201 });
  });
}
