import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, signToken, verifyPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { err, handle, ok } from '@/lib/api';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  return handle(async () => {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) return err('Invalid email or password');

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !user.active) return err('Invalid credentials', 401);

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) return err('Invalid credentials', 401);

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role as never,
      name: user.fullName,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
      ip: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    const res = NextResponse.json({
      ok: true,
      data: { id: user.id, email: user.email, role: user.role, name: user.fullName },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return res;
  });
}
