export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { generateVisitNo } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const Create = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  scheduledAt: z.string(),
  reason: z.string().optional().nullable(),
  priority: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).optional(),
  source: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSession();
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const doctorId = url.searchParams.get('doctorId') ?? undefined;
    const patientId = url.searchParams.get('patientId') ?? undefined;
    const dateFrom = url.searchParams.get('from');
    const dateTo = url.searchParams.get('to');
    const take = Math.min(Number(url.searchParams.get('take') || 50), 200);

    const items = await prisma.appointment.findMany({
      where: {
        status: status as never,
        doctorId,
        patientId,
        scheduledAt: dateFrom || dateTo
          ? {
              gte: dateFrom ? new Date(dateFrom) : undefined,
              lte: dateTo ? new Date(dateTo) : undefined,
            }
          : undefined,
      },
      orderBy: { scheduledAt: 'asc' },
      take,
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });
    return ok(items);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const session = await requireSession();
    const body = await req.json();
    const parsed = Create.safeParse(body);
    if (!parsed.success) return err('Invalid payload');
    const d = parsed.data;

    const sameDay = new Date(d.scheduledAt);
    sameDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(sameDay);
    nextDay.setDate(nextDay.getDate() + 1);

    const todayCount = await prisma.appointment.count({
      where: {
        doctorId: d.doctorId,
        scheduledAt: { gte: sameDay, lt: nextDay },
      },
    });

    const visitNo = generateVisitNo();
    const appt = await prisma.appointment.create({
      data: {
        visitNo,
        tokenNo: todayCount + 1,
        patientId: d.patientId,
        doctorId: d.doctorId,
        scheduledAt: new Date(d.scheduledAt),
        reason: d.reason ?? null,
        priority: d.priority ?? 'ROUTINE',
        source: d.source ?? 'WALK_IN',
        notes: d.notes ?? null,
      },
      include: { patient: true, doctor: { include: { user: true } } },
    });

    await logAudit({
      userId: session.sub,
      action: 'CREATE',
      entity: 'appointment',
      entityId: appt.id,
      after: appt,
    });
    return ok(appt, { status: 201 });
  });
}
