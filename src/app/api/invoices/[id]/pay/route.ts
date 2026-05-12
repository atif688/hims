export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { logAudit } from '@/lib/audit';

const Body = z.object({
  amount: z.coerce.number().min(0.01),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'WALLET', 'INSURANCE']),
  reference: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requireRole('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN');
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) return err('Invalid payload');

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { payments: true },
    });
    if (!invoice) return err('Not found', 404);

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: parsed.data.amount,
        method: parsed.data.method,
        reference: parsed.data.reference || null,
        receivedBy: session.sub,
      },
    });

    const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0) + parsed.data.amount;
    const total = Number(invoice.total);
    const status = paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : invoice.status;

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid: paid, status },
    });

    await logAudit({
      userId: session.sub,
      action: 'PAYMENT',
      entity: 'invoice',
      entityId: invoice.id,
      after: { payment, status },
    });

    return ok({ invoice: updated, payment });
  });
}
