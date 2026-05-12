export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { handle, ok } from '@/lib/api';

export async function GET(_req: NextRequest) {
  return handle(async () => {
    const session = await requireSession();
    const items = await prisma.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(items);
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    const session = await requireSession();
    const body = (await req.json()) as { id?: string };
    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { readAt: new Date() },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: session.sub, readAt: null },
        data: { readAt: new Date() },
      });
    }
    return ok({ marked: true });
  });
}
