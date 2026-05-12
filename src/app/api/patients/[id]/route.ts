export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { logAudit } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireSession();
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        insurances: true,
        allergies: true,
        history: { orderBy: { createdAt: 'desc' } },
        familyHistory: true,
        vaccinations: { orderBy: { givenAt: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 20,
          include: { doctor: { include: { user: true } } },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: true, doctor: { include: { user: true } } },
        },
        labOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: { include: { test: true } } },
        },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!patient) return err('Not found', 404);
    return ok(patient);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requireSession();
    const body = await req.json();
    const existing = await prisma.patient.findUnique({ where: { id: params.id } });
    if (!existing) return err('Not found', 404);

    const updated = await prisma.patient.update({
      where: { id: params.id },
      data: {
        fullName: body.fullName ?? existing.fullName,
        phone: body.phone ?? existing.phone,
        altPhone: body.altPhone ?? existing.altPhone,
        email: body.email ?? existing.email,
        bloodGroup: body.bloodGroup ?? existing.bloodGroup,
        maritalStatus: body.maritalStatus ?? existing.maritalStatus,
        occupation: body.occupation ?? existing.occupation,
        education: body.education ?? existing.education,
        address: body.address ?? existing.address,
        city: body.city ?? existing.city,
        emergencyName: body.emergencyName ?? existing.emergencyName,
        emergencyPhone: body.emergencyPhone ?? existing.emergencyPhone,
        emergencyRel: body.emergencyRel ?? existing.emergencyRel,
        category: body.category ?? existing.category,
      },
    });

    await logAudit({
      userId: session.sub,
      action: 'UPDATE',
      entity: 'patient',
      entityId: updated.id,
      before: existing,
      after: updated,
    });

    return ok(updated);
  });
}
