export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { logAudit } from '@/lib/audit';

const Body = z.object({
  items: z.array(z.object({ id: z.string(), dispensedQty: z.coerce.number().min(0) })),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requireRole('PHARMACIST', 'SUPER_ADMIN');
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) return err('Invalid payload');

    const rx = await prisma.prescription.findUnique({
      where: { id: params.id },
      include: { items: { include: { medication: true } } },
    });
    if (!rx) return err('Prescription not found', 404);

    let fullyDispensed = true;
    await prisma.$transaction(async (tx) => {
      for (const update of parsed.data.items) {
        const item = rx.items.find((i) => i.id === update.id);
        if (!item) continue;
        const newQty = Math.min(update.dispensedQty, item.quantity);
        if (newQty < item.quantity) fullyDispensed = false;

        await tx.prescriptionItem.update({
          where: { id: item.id },
          data: { dispensedQty: newQty },
        });

        if (item.medicationId) {
          await tx.medication.update({
            where: { id: item.medicationId },
            data: { stockQty: { decrement: newQty } },
          });
        }
      }

      await tx.prescription.update({
        where: { id: rx.id },
        data: {
          status: fullyDispensed ? 'DISPENSED' : 'PARTIALLY_DISPENSED',
          dispensedAt: fullyDispensed ? new Date() : undefined,
        },
      });
    });

    await logAudit({
      userId: session.sub,
      action: 'DISPENSE',
      entity: 'prescription',
      entityId: rx.id,
    });

    return ok({ status: fullyDispensed ? 'DISPENSED' : 'PARTIALLY_DISPENSED' });
  });
}
