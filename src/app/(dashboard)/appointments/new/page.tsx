import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { AppointmentForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: { patientId?: string };
}) {
  const [doctors, patient] = await Promise.all([
    prisma.doctor.findMany({
      include: { user: true, department: true },
      orderBy: { user: { fullName: 'asc' } },
    }),
    searchParams.patientId
      ? prisma.patient.findUnique({ where: { id: searchParams.patientId } })
      : null,
  ]);

  return (
    <>
      <PageHeader
        title="New appointment"
        subtitle={patient ? `Patient: ${patient.fullName} (${patient.mrn})` : 'Walk-in or scheduled booking'}
        actions={<Link href="/appointments" className="btn-secondary">Cancel</Link>}
      />
      <AppointmentForm
        doctors={doctors.map((d) => ({
          id: d.id,
          name: d.user.fullName,
          specialty: d.department?.name ?? d.specialty,
          fee: Number(d.consultFee),
        }))}
        preselectPatient={patient ? { id: patient.id, name: patient.fullName, mrn: patient.mrn } : null}
      />
    </>
  );
}
