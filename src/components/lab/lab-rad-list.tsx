import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';

export async function LabRadList({
  kind,
  title,
  status,
  basePath,
}: {
  kind: 'LABORATORY' | 'RADIOLOGY';
  title: string;
  status?: string;
  basePath: string;
}) {
  const orders = await prisma.labOrder.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      items: { some: { test: { kind } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      patient: true,
      doctor: { include: { user: true } },
      items: { include: { test: true } },
    },
  });

  return (
    <>
      <PageHeader title={title} subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'}`} />
      <div className="flex gap-1 mb-3 border-b border-line">
        {['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'RESULT_READY', 'REPORTED'].map((s) => (
          <Link
            key={s}
            href={`${basePath}?status=${s}`}
            className={
              s === status
                ? 'px-3 py-2 text-sm font-medium border-b-2 border-brand-600 text-brand-700'
                : 'px-3 py-2 text-sm text-ink-muted hover:text-ink'
            }
          >
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">Order #</th>
              <th className="table-th">Patient</th>
              <th className="table-th">Doctor</th>
              <th className="table-th">Tests</th>
              <th className="table-th">Created</th>
              <th className="table-th">Status</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="table-td text-center py-10 text-ink-subtle">No orders.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td className="table-td font-mono text-xs">{o.orderNo}</td>
                  <td className="table-td">
                    <Link href={`/patients/${o.patientId}`} className="hover:underline">{o.patient.fullName}</Link>
                    <div className="text-xs text-ink-subtle">{o.patient.mrn}</div>
                  </td>
                  <td className="table-td">Dr. {o.doctor.user.fullName}</td>
                  <td className="table-td">{o.items.map((i) => i.test.name).join(', ')}</td>
                  <td className="table-td">{formatDate(o.createdAt, true)}</td>
                  <td className="table-td"><StatusBadge kind="lab" value={o.status} /></td>
                  <td className="table-td text-right">
                    <Link href={`/lab/${o.id}`} className="text-brand-700 hover:underline">Open</Link>
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
