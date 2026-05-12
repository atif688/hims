export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { calcBMI } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const Upsert = z.object({
  appointmentId: z.string(),
  bpSystolic: z.coerce.number().optional().nullable(),
  bpDiastolic: z.coerce.number().optional().nullable(),
  pulse: z.coerce.number().optional().nullable(),
  tempC: z.coerce.number().optional().nullable(),
  respRate: z.coerce.number().optional().nullable(),
  spo2: z.coerce.number().optional().nullable(),
  heightCm: z.coerce.number().optional().nullable(),
  weightKg: z.coerce.number().optional().nullable(),
  chiefComplaint: z.string().optional().nullable(),
  hopi: z.string().optional().nullable(),
  systemicExam: z.string().optional().nullable(),
  generalExam: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  icdCodes: z.string().optional().nullable(),
  painScore: z.coerce.number().min(0).max(10).optional().nullable(),
  gcsScore: z.coerce.number().min(3).max(15).optional().nullable(),
  clinicalImpression: z.string().optional().nullable(),
  sign: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const session = await requireRole('DOCTOR', 'NURSE', 'SUPER_ADMIN');
    const body = await req.json();
    const parsed = Upsert.safeParse(body);
    if (!parsed.success) return err('Invalid payload');
    const d = parsed.data;

    const appt = await prisma.appointment.findUnique({
      where: { id: d.appointmentId },
      include: { doctor: true },
    });
    if (!appt) return err('Appointment not found', 404);

    const bmi = calcBMI(d.weightKg ?? undefined, d.heightCm ?? undefined);

    const exam = await prisma.examination.upsert({
      where: { appointmentId: d.appointmentId },
      create: {
        appointmentId: d.appointmentId,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        bpSystolic: d.bpSystolic ?? undefined,
        bpDiastolic: d.bpDiastolic ?? undefined,
        pulse: d.pulse ?? undefined,
        tempC: d.tempC ?? undefined,
        respRate: d.respRate ?? undefined,
        spo2: d.spo2 ?? undefined,
        heightCm: d.heightCm ?? undefined,
        weightKg: d.weightKg ?? undefined,
        bmi: bmi ?? undefined,
        chiefComplaint: d.chiefComplaint ?? undefined,
        hopi: d.hopi ?? undefined,
        systemicExam: d.systemicExam ?? undefined,
        generalExam: d.generalExam ?? undefined,
        diagnosis: d.diagnosis ?? undefined,
        icdCodes: d.icdCodes ?? undefined,
        painScore: d.painScore ?? undefined,
        gcsScore: d.gcsScore ?? undefined,
        clinicalImpression: d.clinicalImpression ?? undefined,
        signedAt: d.sign ? new Date() : undefined,
        signedBy: d.sign ? session.sub : undefined,
      },
      update: {
        bpSystolic: d.bpSystolic ?? undefined,
        bpDiastolic: d.bpDiastolic ?? undefined,
        pulse: d.pulse ?? undefined,
        tempC: d.tempC ?? undefined,
        respRate: d.respRate ?? undefined,
        spo2: d.spo2 ?? undefined,
        heightCm: d.heightCm ?? undefined,
        weightKg: d.weightKg ?? undefined,
        bmi: bmi ?? undefined,
        chiefComplaint: d.chiefComplaint ?? undefined,
        hopi: d.hopi ?? undefined,
        systemicExam: d.systemicExam ?? undefined,
        generalExam: d.generalExam ?? undefined,
        diagnosis: d.diagnosis ?? undefined,
        icdCodes: d.icdCodes ?? undefined,
        painScore: d.painScore ?? undefined,
        gcsScore: d.gcsScore ?? undefined,
        clinicalImpression: d.clinicalImpression ?? undefined,
        signedAt: d.sign ? new Date() : undefined,
        signedBy: d.sign ? session.sub : undefined,
      },
    });

    await logAudit({
      userId: session.sub,
      action: 'UPSERT',
      entity: 'examination',
      entityId: exam.id,
      after: exam,
    });

    return ok(exam);
  });
}
