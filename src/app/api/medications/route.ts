export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSession();
    const q = new URL(req.url).searchParams.get('q')?.trim();
    const items = await prisma.medication.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { genericName: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: 100,
    });
    return ok(items);
  });
}
