import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PortalAppointments() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.patientProfile) redirect('/portal/records');

  const items = await prisma.appointment.findMany({
    where: { patientId: user.patientProfile.id },
    orderBy: { scheduledAt: 'desc' },
    include: { doctor: { include: { user: true, department: true } } },
  });

  return (
    <>
      <PageHeader title="My appointments" subtitle="View your appointments and tokens." />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">Token</th>
              <th className="table-th">Doctor</th>
              <th className="table-th">Department</th>
              <th className="table-th">When</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="table-td text-center py-10 text-ink-subtle">No appointments.</td></tr>
            ) : (
              items.map((a) => (
                <tr key={a.id}>
                  <td className="table-td font-medium">#{a.tokenNo}</td>
                  <td className="table-td">Dr. {a.doctor.user.fullName}</td>
                  <td className="table-td">{a.doctor.department?.name ?? a.doctor.specialty}</td>
                  <td className="table-td">{formatDate(a.scheduledAt, true)}</td>
                  <td className="table-td"><StatusBadge kind="appointment" value={a.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
