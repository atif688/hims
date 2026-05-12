export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireSession();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const kind = url.searchParams.get('kind') ?? undefined;
    const items = await prisma.labTest.findMany({
      where: {
        active: true,
        kind: kind as never,
        ...(q
          ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 100,
    });
    return ok(items);
  });
}
