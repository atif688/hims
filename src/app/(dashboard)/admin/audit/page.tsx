import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: true },
  });
  return (
    <>
      <PageHeader title="Audit log" subtitle={`Last ${logs.length} events`} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">When</th>
              <th className="table-th">User</th>
              <th className="table-th">Action</th>
              <th className="table-th">Entity</th>
              <th className="table-th">Record</th>
              <th className="table-th">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="table-td">{formatDate(l.createdAt, true)}</td>
                <td className="table-td">{l.user?.fullName ?? <span className="text-ink-subtle">system</span>}</td>
                <td className="table-td"><span className="badge-slate">{l.action}</span></td>
                <td className="table-td">{l.entity}</td>
                <td className="table-td font-mono text-xs">{l.entityId ?? '—'}</td>
                <td className="table-td font-mono text-xs">{l.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
