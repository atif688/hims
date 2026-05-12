export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole, requireSession } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { logAudit } from '@/lib/audit';

const Item = z.object({
  medicationId: z.string().optional().nullable(),
  drugName: z.string().min(1),
  dose: z.string(),
  frequency: z.string(),
  route: z.string().optional().nullable(),
  durationDays: z.coerce.number().optional().nullable(),
  instructions: z.string().optional().nullable(),
  quantity: z.coerce.number().min(1).default(1),
});

const Body = z.object({
  appointmentId: z.string(),
  advice: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  items: z.array(Item).min(1),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSession();
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined;
    const items = await prisma.prescription.findMany({
      where: { status: status as never },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        items: true,
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

    const appt = await prisma.appointment.findUnique({ where: { id: d.appointmentId } });
    if (!appt) return err('Appointment not found', 404);

    // Allergy alert
    const allergies = await prisma.allergy.findMany({ where: { patientId: appt.patientId } });
    const alerts: string[] = [];
    for (const item of d.items) {
      for (const a of allergies) {
        if (a.kind.toLowerCase() === 'drug' && item.drugName.toLowerCase().includes(a.substance.toLowerCase())) {
          alerts.push(`Allergy alert: ${item.drugName} matches '${a.substance}' (${a.severity})`);
        }
      }
    }

    const rx = await prisma.prescription.upsert({
      where: { appointmentId: d.appointmentId },
      create: {
        appointmentId: d.appointmentId,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        advice: d.advice ?? null,
        followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
        items: {
          create: d.items.map((i) => ({
            medicationId: i.medicationId || null,
            drugName: i.drugName,
            dose: i.dose,
            frequency: i.frequency,
            route: i.route || null,
            durationDays: i.durationDays || null,
            instructions: i.instructions || null,
            quantity: i.quantity,
          })),
        },
      },
      update: {
        advice: d.advice ?? null,
        followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
        status: 'PRESCRIBED',
        items: {
          deleteMany: {},
          create: d.items.map((i) => ({
            medicationId: i.medicationId || null,
            drugName: i.drugName,
            dose: i.dose,
            frequency: i.frequency,
            route: i.route || null,
            durationDays: i.durationDays || null,
            instructions: i.instructions || null,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await logAudit({
      userId: session.sub,
      action: 'UPSERT',
      entity: 'prescription',
      entityId: rx.id,
      after: rx,
    });

    return ok({ prescription: rx, alerts });
  });
}
