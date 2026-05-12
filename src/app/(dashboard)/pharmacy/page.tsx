import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PharmacyPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? 'PRESCRIBED';
  const [pending, lowStock] = await Promise.all([
    prisma.prescription.findMany({
      where: { status: status as never },
      orderBy: { createdAt: 'desc' },
      include: { patient: true, doctor: { include: { user: true } }, items: true },
      take: 50,
    }),
    prisma.medication.findMany({
      where: { stockQty: { lte: 20 } },
      orderBy: { stockQty: 'asc' },
      take: 8,
    }),
  ]);

  return (
    <>
      <PageHeader title="Pharmacy" subtitle="Dispensing queue and live inventory." />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div>
          <div className="flex gap-1 mb-3 border-b border-line">
            {['PRESCRIBED', 'PARTIALLY_DISPENSED', 'DISPENSED', 'REJECTED'].map((s) => (
              <Link
                key={s}
                href={`/pharmacy?status=${s}`}
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
                  <th className="table-th">Patient</th>
                  <th className="table-th">Doctor</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Prescribed</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-ink-subtle py-10">
                      No prescriptions in this state.
                    </td>
                  </tr>
                ) : (
                  pending.map((p) => (
                    <tr key={p.id}>
                      <td className="table-td">
                        <div className="font-medium">{p.patient.fullName}</div>
                        <div className="text-xs text-ink-subtle">{p.patient.mrn}</div>
                      </td>
                      <td className="table-td">Dr. {p.doctor.user.fullName}</td>
                      <td className="table-td">{p.items.length} item{p.items.length === 1 ? '' : 's'}</td>
                      <td className="table-td">{formatDate(p.createdAt, true)}</td>
                      <td className="table-td"><StatusBadge kind="prescription" value={p.status} /></td>
                      <td className="table-td text-right">
                        <Link href={`/pharmacy/${p.id}`} className="text-brand-700 hover:underline">Dispense</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="card p-4 h-fit">
          <div className="text-sm font-semibold mb-3">Low stock</div>
          {lowStock.length === 0 ? (
            <div className="text-sm text-ink-subtle">All medications above reorder level.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((m) => (
                <li key={m.id} className="flex justify-between">
                  <span>{m.name} <span className="text-ink-subtle">{m.strength}</span></span>
                  <span className={m.stockQty <= 5 ? 'badge-rose' : 'badge-amber'}>{m.stockQty}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}
