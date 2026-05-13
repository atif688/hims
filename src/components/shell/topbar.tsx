'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, LogOut, Moon, Search, Sun, User } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { ROLE_LABEL } from '@/lib/utils';
import type { Role } from '@/lib/types';

export function Topbar({ user }: { user: { name: string; role: Role; email: string } }) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/patients?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-surface-elevated/80 px-4 backdrop-blur no-print">
      <form onSubmit={search} className="flex flex-1 max-w-md items-center gap-2">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patients by name, MRN, phone…"
            className="input pl-9"
          />
        </div>
      </form>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="btn-ghost p-2" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="btn-ghost p-2 relative" aria-label="Notifications" onClick={() => router.push('/notifications')}>
          <Bell className="w-4 h-4" />
        </button>
        <div className="hidden md:flex items-center gap-2 px-2 border-l border-line ml-1 pl-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
            <User className="w-4 h-4 text-brand-700 dark:text-brand-200" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium text-ink">{user.name}</div>
            <div className="text-[11px] text-ink-subtle">{ROLE_LABEL[user.role]}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost p-2" aria-label="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
