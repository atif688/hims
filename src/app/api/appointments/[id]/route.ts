export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { logAudit } from '@/lib/audit';
import type { AppointmentStatus } from '@prisma/client';

const STATUS_FIELDS: Record<AppointmentStatus, Partial<Record<string, Date>>> = {
  SCHEDULED: {},
  CHECKED_IN: { checkedInAt: new Date() },
  IN_CONSULTATION: { startedAt: new Date() },
  COMPLETED: { completedAt: new Date() },
  CANCELLED: {},
  NO_SHOW: {},
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireSession();
    const appt = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: { include: { allergies: true } },
        doctor: { include: { user: true, department: true } },
        examination: true,
        prescription: { include: { items: true } },
        labOrders: { include: { items: { include: { test: true } } } },
      },
    });
    if (!appt) return err('Not found', 404);
    return ok(appt);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requireSession();
    const body = await req.json();
    const existing = await prisma.appointment.findUnique({ where: { id: params.id } });
    if (!existing) return err('Not found', 404);

    const data: Record<string, unknown> = {};
    if (body.status) {
      data.status = body.status;
      const stamps = STATUS_FIELDS[body.status as AppointmentStatus] || {};
      // re-evaluate now() at PATCH time
      if ('checkedInAt' in stamps) data.checkedInAt = new Date();
      if ('startedAt' in stamps) data.startedAt = new Date();
      if ('completedAt' in stamps) data.completedAt = new Date();
    }
    if (body.scheduledAt) data.scheduledAt = new Date(body.scheduledAt);
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.reason !== undefined) data.reason = body.reason;
    if (body.priority) data.priority = body.priority;

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data,
      include: { patient: true, doctor: { include: { user: true } } },
    });

    await logAudit({
      userId: session.sub,
      action: 'UPDATE',
      entity: 'appointment',
      entityId: updated.id,
      before: existing,
      after: updated,
    });

    return ok(updated);
  });
}
