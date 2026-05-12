export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { logAudit } from '@/lib/audit';

const Body = z.object({
  status: z.enum(['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'RESULT_READY', 'REPORTED', 'CANCELLED']).optional(),
  results: z
    .array(
      z.object({
        id: z.string(),
        resultValue: z.string().optional().nullable(),
        flag: z.string().optional().nullable(),
        remarks: z.string().optional().nullable(),
      }),
    )
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requireRole('LAB_STAFF', 'RADIOLOGY_STAFF', 'DOCTOR', 'SUPER_ADMIN');
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) return err('Invalid payload');
    const d = parsed.data;

    const order = await prisma.labOrder.findUnique({ where: { id: params.id } });
    if (!order) return err('Not found', 404);

    await prisma.$transaction(async (tx) => {
      if (d.results) {
        for (const r of d.results) {
          await tx.labOrderItem.update({
            where: { id: r.id },
            data: {
              resultValue: r.resultValue ?? undefined,
              flag: r.flag ?? undefined,
              remarks: r.remarks ?? undefined,
              reportedAt: new Date(),
            },
          });
        }
      }
      const updates: Record<string, unknown> = {};
      if (d.status) {
        updates.status = d.status;
        if (d.status === 'SAMPLE_COLLECTED') updates.collectedAt = new Date();
        if (d.status === 'RESULT_READY') updates.resultedAt = new Date();
        if (d.status === 'REPORTED') updates.reportedAt = new Date();
      }
      if (Object.keys(updates).length) {
        await tx.labOrder.update({ where: { id: order.id }, data: updates });
      }
    });

    await logAudit({
      userId: session.sub,
      action: 'UPDATE',
      entity: 'labOrder',
      entityId: order.id,
      after: { status: d.status, hasResults: !!d.results },
    });

    const updated = await prisma.labOrder.findUnique({
      where: { id: order.id },
      include: { items: { include: { test: true } }, patient: true, doctor: { include: { user: true } } },
    });
    return ok(updated);
  });
}
