import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(extra || {}) }, { status });
}

export function handle(handler: () => Promise<NextResponse>) {
  return handler().catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : 'Internal error';
    if (msg === 'UNAUTHORIZED') return err('Unauthorized', 401);
    if (msg === 'FORBIDDEN') return err('Forbidden', 403);
    console.error(e);
    return err(msg, 500);
  });
}
