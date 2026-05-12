export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export async function GET() {
  return handle(async () => {
    await requireSession();
    const doctors = await prisma.doctor.findMany({
      include: { user: true, department: true, schedules: true },
      orderBy: { user: { fullName: 'asc' } },
    });
    return ok(doctors);
  });
}
