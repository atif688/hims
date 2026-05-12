import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { WorkbenchClient } from './workbench-client';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function WorkbenchPage({
  searchParams,
}: {
  searchParams: { appointmentId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'DOCTOR' && user.role !== 'SUPER_ADMIN') redirect('/dashboard');

  const doctorId = user.doctorProfile?.id;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const queue = await prisma.appointment.findMany({
    where: {
      ...(doctorId ? { doctorId } : {}),
      scheduledAt: { gte: startOfDay, lt: endOfDay },
      status: { in: ['CHECKED_IN', 'IN_CONSULTATION', 'SCHEDULED'] },
    },
    orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
    include: { patient: true },
  });

  const selectedId = searchParams.appointmentId ?? queue[0]?.id;
  const selected = selectedId
    ? await prisma.appointment.findUnique({
        where: { id: selectedId },
        include: {
          patient: { include: { allergies: true, history: { orderBy: { createdAt: 'desc' }, take: 5 } } },
          doctor: { include: { user: true } },
          examination: true,
          prescription: { include: { items: true } },
          labOrders: { include: { items: { include: { test: true } } } },
        },
      })
    : null;

  const labTests = await prisma.labTest.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  const medications = await prisma.medication.findMany({ orderBy: { name: 'asc' }, take: 200 });

  return (
    <>
      <PageHeader
        title="Doctor Workbench"
        subtitle={`${queue.length} patient${queue.length === 1 ? '' : 's'} in your queue today`}
      />

      <div className="grid lg:grid-cols-[300px_1fr] gap-4">
        <aside className="card p-3 h-fit lg:max-h-[80vh] lg:overflow-auto">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted px-2 py-1">Queue</div>
          {queue.length === 0 ? (
            <div className="px-2 py-3 text-sm text-ink-subtle">No patients in queue.</div>
          ) : (
            <ul className="space-y-1">
              {queue.map((a) => {
                const active = a.id === selectedId;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/workbench?appointmentId=${a.id}`}
                      className={
                        'block rounded-md px-3 py-2 ' +
                        (active ? 'bg-brand-50 dark:bg-brand-950' : 'hover:bg-surface-muted')
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono">#{a.tokenNo}</span>
                        <StatusBadge kind="appointment" value={a.status} />
                      </div>
                      <div className="text-sm font-medium mt-1">{a.patient.fullName}</div>
                      <div className="text-xs text-ink-subtle">{formatDate(a.scheduledAt, true)}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section>
          {!selected ? (
            <div className="card p-10 text-center text-ink-subtle">
              Select a patient from the queue.
            </div>
          ) : (
            <WorkbenchClient
              appointment={{
                id: selected.id,
                patientId: selected.patientId,
                doctorId: selected.doctorId,
              }}
              patient={{
                id: selected.patient.id,
                name: selected.patient.fullName,
                mrn: selected.patient.mrn,
                phone: selected.patient.phone,
                allergies: selected.patient.allergies.map((a) => ({
                  substance: a.substance,
                  severity: a.severity,
                })),
              }}
              existing={{
                examination: selected.examination,
                prescription: selected.prescription,
                labOrders: selected.labOrders,
              }}
              labTests={labTests.map((t) => ({
                id: t.id,
                code: t.code,
                name: t.name,
                kind: t.kind,
                price: Number(t.price),
              }))}
              medications={medications.map((m) => ({
                id: m.id,
                name: m.name,
                generic: m.genericName,
                strength: m.strength,
                price: Number(m.unitPrice),
                stock: m.stockQty,
              }))}
            />
          )}
        </section>
      </div>
    </>
  );
}
