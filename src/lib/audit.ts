import { prisma } from './prisma';

export async function logAudit(opts: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        before: opts.before ? JSON.stringify(opts.before) : null,
        after: opts.after ? JSON.stringify(opts.after) : null,
        ip: opts.ip,
        userAgent: opts.userAgent,
      },
    });
  } catch (err) {
    // Never let audit failures break the request.
    console.error('audit log failed', err);
  }
}
