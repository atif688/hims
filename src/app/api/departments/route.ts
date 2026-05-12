export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export async function GET() {
  return handle(async () => {
    await requireSession();
    const items = await prisma.department.findMany({
      include: {
        doctors: { include: { user: true } },
        _count: { select: { doctors: true } },
      },
      orderBy: { name: 'asc' },
    });
    return ok(items);
  });
}
