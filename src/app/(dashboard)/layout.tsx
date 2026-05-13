import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import type { Role } from '@/lib/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const role = user.role as Role;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={{ name: user.fullName, role, email: user.email }} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
