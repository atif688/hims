'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';
import type { Role } from '@prisma/client';
import { navForRole } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar({ role }: { role: Role }) {
  const path = usePathname();
  const items = navForRole(role);
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.group ?? 'Main';
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-surface-elevated">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-line">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-ink">HIMS OPD</div>
          <div className="text-[11px] text-ink-subtle">Hospital Management</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
              {group}
            </div>
            <div className="space-y-0.5">
              {list.map((item) => {
                const Icon = item.icon;
                const active = path === item.href || (item.href !== '/dashboard' && path?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                      active
                        ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-950 dark:text-brand-200'
                        : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-line text-[11px] text-ink-subtle">
        v1.0 · HL7/FHIR-ready
      </div>
    </aside>
  );
}
