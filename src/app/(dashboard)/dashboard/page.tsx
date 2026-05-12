import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FlaskConical,
  Pill,
  Receipt,
  Users,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { DepartmentPie, DoctorBreakdownChart, TrendChart } from '@/components/dashboard/charts';
import { formatCurrency, formatDate, ROLE_LABEL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function loadStats() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [
    todayAppointments,
    waiting,
    inConsult,
    completedToday,
    pendingLab,
    pendingRx,
    totalPatients,
    revenueAgg,
    trendRows,
    docCounts,
    deptStats,
    recent,
    upcoming,
  ] = await Promise.all([
    prisma.appointment.count({ where: { scheduledAt: { gte: start, lt: end } } }),
    prisma.appointment.count({ where: { status: 'CHECKED_IN' } }),
    prisma.appointment.count({ where: { status: 'IN_CONSULTATION' } }),
    prisma.appointment.count({
      where: { status: 'COMPLETED', completedAt: { gte: start, lt: end } },
    }),
    prisma.labOrder.count({
      where: { status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] } },
    }),
    prisma.prescription.count({ where: { status: { in: ['PRESCRIBED', 'READY'] } } }),
    prisma.patient.count(),
    prisma.invoice.aggregate({
      _sum: { total: true, amountPaid: true },
      where: { issuedAt: { gte: start, lt: end } },
    }),
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: weekAgo } },
      select: { scheduledAt: true },
    }),
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { scheduledAt: { gte: start, lt: end } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 6,
    }),
    prisma.department.findMany({ include: { _count: { select: { doctors: true } } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: true },
    }),
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: start, lt: end } },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
      include: { patient: true, doctor: { include: { user: true } } },
    }),
  ]);

  const trendMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    trendMap.set(d.toISOString().slice(5, 10), 0);
  }
  for (const r of trendRows) {
    const k = r.scheduledAt.toISOString().slice(5, 10);
    if (trendMap.has(k)) trendMap.set(k, trendMap.get(k)! + 1);
  }
  const trend = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

  const docs = await prisma.doctor.findMany({
    where: { id: { in: docCounts.map((d) => d.doctorId) } },
    include: { user: true },
  });
  const docBreakdown = docCounts.map((c) => {
    const d = docs.find((x) => x.id === c.doctorId);
    return { name: d?.user.fullName ?? 'Unknown', count: c._count.id };
  });

  return {
    kpis: {
      todayAppointments,
      waiting,
      inConsult,
      completedToday,
      pendingLab,
      pendingRx,
      totalPatients,
      revenueToday: Number(revenueAgg._sum.total ?? 0),
      collectedToday: Number(revenueAgg._sum.amountPaid ?? 0),
    },
    trend,
    docBreakdown,
    deptStats: deptStats.map((d) => ({ name: d.name, doctors: d._count.doctors })),
    recent,
    upcoming,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Patient role gets a portal-style page
  if (user.role === 'PATIENT') redirect('/portal/records');

  const stats = await loadStats();
  const k = stats.kpis;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.fullName.split(' ')[0]}`}
        subtitle={`${ROLE_LABEL[user.role]} · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        actions={
          <>
            <Link href="/patients/new" className="btn-secondary">New patient</Link>
            <Link href="/appointments/new" className="btn-primary">New appointment</Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's appointments" value={k.todayAppointments} icon={Calendar} tone="blue" />
        <StatCard label="Waiting / Checked-in" value={k.waiting} icon={Clock} tone="amber" />
        <StatCard label="In consultation" value={k.inConsult} icon={Activity} tone="blue" />
        <StatCard label="Completed today" value={k.completedToday} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Total patients" value={k.totalPatients} icon={Users} tone="slate" />
        <StatCard label="Pending lab/rad" value={k.pendingLab} icon={FlaskConical} tone="amber" />
        <StatCard label="Pending prescriptions" value={k.pendingRx} icon={Pill} tone="amber" />
        <StatCard
          label="Revenue today"
          value={formatCurrency(k.revenueToday)}
          delta={`Collected: ${formatCurrency(k.collectedToday)}`}
          icon={Receipt}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-4">
        <div className="lg:col-span-2">
          <TrendChart data={stats.trend} />
        </div>
        <DepartmentPie data={stats.deptStats} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-4">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-ink">Today’s queue</div>
            <Link href="/appointments" className="text-xs text-brand-700 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Token</th>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Doctor</th>
                  <th className="table-th">Time</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.upcoming.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-ink-subtle py-8">
                      No appointments today.
                    </td>
                  </tr>
                ) : (
                  stats.upcoming.map((a) => (
                    <tr key={a.id}>
                      <td className="table-td font-medium">#{a.tokenNo}</td>
                      <td className="table-td">
                        <Link href={`/patients/${a.patientId}`} className="hover:underline">
                          {a.patient.fullName}
                        </Link>
                        <div className="text-xs text-ink-subtle">{a.patient.mrn}</div>
                      </td>
                      <td className="table-td">Dr. {a.doctor.user.fullName}</td>
                      <td className="table-td">{formatDate(a.scheduledAt, true)}</td>
                      <td className="table-td">
                        <StatusBadge kind="appointment" value={a.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DoctorBreakdownChart data={stats.docBreakdown} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-4">
        <div className="lg:col-span-2 card p-4">
          <div className="text-sm font-semibold text-ink mb-3">Recent activity</div>
          <ul className="space-y-2">
            {stats.recent.length === 0 ? (
              <li className="text-sm text-ink-subtle">No activity yet.</li>
            ) : (
              stats.recent.map((r) => (
                <li key={r.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-500" />
                  <div className="flex-1">
                    <span className="font-medium">{r.user?.fullName ?? 'System'}</span>
                    <span className="text-ink-muted"> · {r.action.toLowerCase()} {r.entity}</span>
                  </div>
                  <span className="text-xs text-ink-subtle">{formatDate(r.createdAt, true)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <div className="text-sm font-semibold text-ink">Quick actions</div>
          </div>
          <div className="grid gap-2">
            <Link href="/patients/new" className="btn-secondary justify-start">Register patient</Link>
            <Link href="/appointments/new" className="btn-secondary justify-start">Book appointment</Link>
            <Link href="/lab" className="btn-secondary justify-start">Manage lab orders</Link>
            <Link href="/pharmacy" className="btn-secondary justify-start">Dispense prescriptions</Link>
            <Link href="/billing" className="btn-secondary justify-start">Create invoice</Link>
          </div>
        </div>
      </div>
    </>
  );
}
