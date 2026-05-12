export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export async function GET(_req: NextRequest) {
  return handle(async () => {
    const session = await requireSession();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [todayAppointments, waiting, inConsult, completedToday, pendingLab, pendingRx, totalPatients, revenueAgg] =
      await Promise.all([
        prisma.appointment.count({ where: { scheduledAt: { gte: startOfDay, lt: endOfDay } } }),
        prisma.appointment.count({ where: { status: 'CHECKED_IN' } }),
        prisma.appointment.count({ where: { status: 'IN_CONSULTATION' } }),
        prisma.appointment.count({
          where: { status: 'COMPLETED', completedAt: { gte: startOfDay, lt: endOfDay } },
        }),
        prisma.labOrder.count({ where: { status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] } } }),
        prisma.prescription.count({ where: { status: { in: ['PRESCRIBED', 'READY'] } } }),
        prisma.patient.count(),
        prisma.invoice.aggregate({
          _sum: { total: true, amountPaid: true },
          where: { issuedAt: { gte: startOfDay, lt: endOfDay } },
        }),
      ]);

    // trend: last 7 days appointment counts
    const trendRows = await prisma.appointment.findMany({
      where: { scheduledAt: { gte: sevenDaysAgo } },
      select: { scheduledAt: true },
    });
    const trendMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      trendMap.set(k, 0);
    }
    for (const row of trendRows) {
      const k = row.scheduledAt.toISOString().slice(0, 10);
      trendMap.set(k, (trendMap.get(k) || 0) + 1);
    }
    const trend = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

    // Doctor-wise patient counts today
    const docCounts = await prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { scheduledAt: { gte: startOfDay, lt: endOfDay } },
      _count: { id: true },
    });
    const docs = await prisma.doctor.findMany({
      where: { id: { in: docCounts.map((d) => d.doctorId) } },
      include: { user: true, department: true },
    });
    const doctorBreakdown = docCounts.map((c) => {
      const d = docs.find((x) => x.id === c.doctorId);
      return {
        doctorId: c.doctorId,
        name: d?.user.fullName ?? 'Unknown',
        department: d?.department?.name ?? d?.specialty ?? '',
        count: c._count.id,
      };
    });

    const deptStats = await prisma.department.findMany({
      include: { _count: { select: { doctors: true } } },
    });

    const recent = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: true },
    });

    return ok({
      role: session.role,
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
      doctorBreakdown,
      deptStats: deptStats.map((d) => ({ name: d.name, doctors: d._count.doctors })),
      recentActivity: recent.map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        user: r.user?.fullName ?? 'System',
        at: r.createdAt,
      })),
    });
  });
}
