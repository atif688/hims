import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  };
  return (
    <div className="card p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
        {delta && <div className="text-xs text-ink-subtle mt-0.5">{delta}</div>}
      </div>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', tones[tone])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
