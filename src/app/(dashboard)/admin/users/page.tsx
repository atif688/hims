import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { ROLE_LABEL, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { department: true, doctorProfile: true },
  });
  return (
    <>
      <PageHeader title="Users & roles" subtitle={`${users.length} active accounts`} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th">Role</th>
              <th className="table-th">Department</th>
              <th className="table-th">Status</th>
              <th className="table-th">Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="table-td font-medium">{u.fullName}</td>
                <td className="table-td">{u.email}</td>
                <td className="table-td"><span className="badge-blue">{ROLE_LABEL[u.role]}</span></td>
                <td className="table-td">{u.department?.name ?? u.doctorProfile?.specialty ?? '—'}</td>
                <td className="table-td">
                  <span className={u.active ? 'badge-green' : 'badge-rose'}>{u.active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="table-td">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
