import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { formatDate } from '@/lib/utils';
import { Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return (
    <>
      <PageHeader title="Notifications" subtitle={`${items.length} recent notifications`} />
      <div className="card divide-y divide-line">
        {items.length === 0 ? (
          <div className="p-10 text-center text-ink-subtle">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-60" />
            No notifications yet.
          </div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="p-4 flex items-start gap-3">
              <div className={'w-2 h-2 mt-1.5 rounded-full ' + (n.readAt ? 'bg-ink-subtle' : 'bg-brand-500')} />
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                {n.body && <div className="text-sm text-ink-muted">{n.body}</div>}
              </div>
              <div className="text-xs text-ink-subtle">{formatDate(n.createdAt, true)}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
