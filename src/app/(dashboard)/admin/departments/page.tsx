import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
  const depts = await prisma.department.findMany({
    include: { doctors: { include: { user: true } } },
    orderBy: { name: 'asc' },
  });
  return (
    <>
      <PageHeader title="Departments" subtitle={`${depts.length} departments`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {depts.map((d) => (
          <div key={d.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{d.name}</div>
                <div className="text-xs text-ink-subtle font-mono">{d.code}</div>
              </div>
              <span className="badge-blue">{d.doctors.length} doctors</span>
            </div>
            {d.about && <p className="mt-2 text-sm text-ink-muted">{d.about}</p>}
            <ul className="mt-3 text-sm space-y-1">
              {d.doctors.map((doc) => (
                <li key={doc.id}>Dr. {doc.user.fullName} — <span className="text-ink-subtle">{doc.specialty}</span></li>
              ))}
              {d.doctors.length === 0 && <li className="text-ink-subtle">No doctors assigned.</li>}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
