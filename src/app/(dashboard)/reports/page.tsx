import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { PrintButton } from '@/components/ui/print-button';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, Receipt, Stethoscope, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalPatients,
    apptsToday,
    apptsMonth,
    revenueToday,
    revenueMonth,
    rxToday,
    labMonth,
    diagnoses,
    topDoctors,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({ where: { scheduledAt: { gte: start } } }),
    prisma.appointment.count({ where: { scheduledAt: { gte: monthStart } } }),
    prisma.invoice.aggregate({ _sum: { total: true, amountPaid: true }, where: { issuedAt: { gte: start } } }),
    prisma.invoice.aggregate({ _sum: { total: true, amountPaid: true }, where: { issuedAt: { gte: monthStart } } }),
    prisma.prescription.count({ where: { createdAt: { gte: start } } }),
    prisma.labOrder.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.examination.findMany({
      where: { diagnosis: { not: null } },
      select: { diagnosis: true },
      take: 200,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { scheduledAt: { gte: monthStart } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const docs = await prisma.doctor.findMany({
    where: { id: { in: topDoctors.map((d) => d.doctorId) } },
    include: { user: true },
  });

  // tally diagnoses
  const diagMap = new Map<string, number>();
  for (const d of diagnoses) {
    if (!d.diagnosis) continue;
    const key = d.diagnosis.split(/[;,]/)[0].trim().slice(0, 64);
    if (!key) continue;
    diagMap.set(key, (diagMap.get(key) ?? 0) + 1);
  }
  const topDiagnoses = Array.from(diagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        subtitle={`As of ${formatDate(now, true)}`}
        actions={<PrintButton label="Export / Print" />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total patients" value={totalPatients} icon={Users} tone="slate" />
        <StatCard label="Appointments today" value={apptsToday} icon={Calendar} tone="blue" />
        <StatCard label="Appointments (MTD)" value={apptsMonth} icon={Calendar} tone="blue" />
        <StatCard label="Prescriptions today" value={rxToday} icon={Stethoscope} tone="amber" />
        <StatCard
          label="Revenue today"
          value={formatCurrency(Number(revenueToday._sum.total ?? 0))}
          delta={`Collected: ${formatCurrency(Number(revenueToday._sum.amountPaid ?? 0))}`}
          icon={Receipt}
          tone="emerald"
        />
        <StatCard
          label="Revenue (MTD)"
          value={formatCurrency(Number(revenueMonth._sum.total ?? 0))}
          delta={`Collected: ${formatCurrency(Number(revenueMonth._sum.amountPaid ?? 0))}`}
          icon={Receipt}
          tone="emerald"
        />
        <StatCard label="Lab/rad orders (MTD)" value={labMonth} icon={Stethoscope} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5">
          <div className="text-sm font-semibold mb-3">Top diagnoses (recent)</div>
          {topDiagnoses.length === 0 ? (
            <div className="text-sm text-ink-subtle">No diagnoses recorded.</div>
          ) : (
            <ul className="space-y-2">
              {topDiagnoses.map(([dx, count]) => (
                <li key={dx} className="flex items-center gap-3">
                  <div className="flex-1 text-sm">{dx}</div>
                  <div className="w-32 h-2 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, count * 20)}%` }} />
                  </div>
                  <div className="w-10 text-right text-xs text-ink-muted">{count}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="text-sm font-semibold mb-3">Top doctors (MTD)</div>
          {topDoctors.length === 0 ? (
            <div className="text-sm text-ink-subtle">No data.</div>
          ) : (
            <ul className="space-y-2">
              {topDoctors.map((t) => {
                const d = docs.find((x) => x.id === t.doctorId);
                return (
                  <li key={t.doctorId} className="flex items-center justify-between text-sm">
                    <span>Dr. {d?.user.fullName ?? 'Unknown'} <span className="text-ink-subtle">{d?.specialty}</span></span>
                    <span className="badge-blue">{t._count.id} visits</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
