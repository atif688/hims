import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';
import { CalendarPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: '', label: 'All' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'CHECKED_IN', label: 'Checked in' },
  { key: 'IN_CONSULTATION', label: 'In consult' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status;
  const items = await prisma.appointment.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { scheduledAt: 'desc' },
    take: 100,
    include: { patient: true, doctor: { include: { user: true, department: true } } },
  });

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle={`${items.length} appointment${items.length === 1 ? '' : 's'}${status ? ` · ${status.replace(/_/g, ' ')}` : ''}`}
        actions={
          <Link href="/appointments/new" className="btn-primary">
            <CalendarPlus className="w-4 h-4" /> New appointment
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1 mb-4 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key || 'all'}
            href={t.key ? `/appointments?status=${t.key}` : '/appointments'}
            className={
              (status === t.key || (!status && !t.key))
                ? 'px-3 py-2 text-sm font-medium border-b-2 border-brand-600 text-brand-700'
                : 'px-3 py-2 text-sm text-ink-muted hover:text-ink'
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">Token</th>
              <th className="table-th">Visit #</th>
              <th className="table-th">Patient</th>
              <th className="table-th">Doctor / Dept</th>
              <th className="table-th">Scheduled</th>
              <th className="table-th">Status</th>
              <th className="table-th">Priority</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-td text-center py-10 text-ink-subtle">No appointments.</td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="hover:bg-surface-muted/40">
                  <td className="table-td font-medium">#{a.tokenNo}</td>
                  <td className="table-td font-mono text-xs">{a.visitNo}</td>
                  <td className="table-td">
                    <Link href={`/patients/${a.patientId}`} className="hover:underline">{a.patient.fullName}</Link>
                    <div className="text-xs text-ink-subtle">{a.patient.mrn} · {a.patient.phone}</div>
                  </td>
                  <td className="table-td">
                    Dr. {a.doctor.user.fullName}
                    <div className="text-xs text-ink-subtle">{a.doctor.department?.name ?? a.doctor.specialty}</div>
                  </td>
                  <td className="table-td">{formatDate(a.scheduledAt, true)}</td>
                  <td className="table-td"><StatusBadge kind="appointment" value={a.status} /></td>
                  <td className="table-td">
                    <span className={a.priority === 'EMERGENCY' ? 'badge-rose' : a.priority === 'URGENT' ? 'badge-amber' : 'badge-slate'}>
                      {a.priority}
                    </span>
                  </td>
                  <td className="table-td text-right">
                    <Link href={`/appointments/${a.id}`} className="text-brand-700 hover:underline">Open</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
