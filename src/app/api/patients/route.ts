export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok, err } from '@/lib/api';
import { generateMRN } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

const Create = z.object({
  fullName: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dob: z.string(),
  phone: z.string().min(5),
  cnic: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  altPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  emergencyRel: z.string().optional().nullable(),
  category: z.enum(['NEW', 'REPEAT', 'CORPORATE', 'GOVT_SCHEME', 'EMERGENCY', 'REFERRED']).optional(),
});

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSession();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const take = Math.min(Number(url.searchParams.get('take') || 25), 100);
    const skip = Number(url.searchParams.get('skip') || 0);

    const where = q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' as const } },
            { mrn: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
            { cnic: { contains: q } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        take,
        skip,
        orderBy: { registeredAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return ok({ items, total });
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const session = await requireSession();
    const body = await req.json();
    const parsed = Create.safeParse(body);
    if (!parsed.success) return err('Invalid payload: ' + parsed.error.message);

    const d = parsed.data;
    // duplicate detection: same CNIC or same phone+name
    if (d.cnic) {
      const dupe = await prisma.patient.findUnique({ where: { cnic: d.cnic } });
      if (dupe) return err('Patient with this CNIC already exists', 409, { patientId: dupe.id });
    }

    const mrn = generateMRN();
    const patient = await prisma.patient.create({
      data: {
        mrn,
        qrCode: mrn,
        fullName: d.fullName,
        gender: d.gender,
        dob: new Date(d.dob),
        phone: d.phone,
        cnic: d.cnic || null,
        bloodGroup: d.bloodGroup || null,
        maritalStatus: d.maritalStatus || null,
        nationality: d.nationality || 'Pakistani',
        occupation: d.occupation || null,
        education: d.education || null,
        email: d.email || null,
        altPhone: d.altPhone || null,
        address: d.address || null,
        city: d.city || null,
        emergencyName: d.emergencyName || null,
        emergencyPhone: d.emergencyPhone || null,
        emergencyRel: d.emergencyRel || null,
        category: d.category || 'NEW',
      },
    });

    await logAudit({
      userId: session.sub,
      action: 'CREATE',
      entity: 'patient',
      entityId: patient.id,
      after: patient,
    });

    return ok(patient, { status: 201 });
  });
}
