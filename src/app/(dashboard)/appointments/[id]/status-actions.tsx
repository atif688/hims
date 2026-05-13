'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AppointmentStatus } from '@/lib/types';

const NEXT: Record<AppointmentStatus, { label: string; status: AppointmentStatus; tone: string }[]> = {
  SCHEDULED: [
    { label: 'Check in', status: 'CHECKED_IN', tone: 'btn-primary' },
    { label: 'Cancel', status: 'CANCELLED', tone: 'btn-secondary' },
    { label: 'No-show', status: 'NO_SHOW', tone: 'btn-secondary' },
  ],
  CHECKED_IN: [
    { label: 'Start consultation', status: 'IN_CONSULTATION', tone: 'btn-primary' },
    { label: 'Cancel', status: 'CANCELLED', tone: 'btn-secondary' },
  ],
  IN_CONSULTATION: [
    { label: 'Mark completed', status: 'COMPLETED', tone: 'btn-primary' },
  ],
  COMPLETED: [],
  CANCELLED: [{ label: 'Reschedule', status: 'SCHEDULED', tone: 'btn-secondary' }],
  NO_SHOW: [{ label: 'Reschedule', status: 'SCHEDULED', tone: 'btn-secondary' }],
};

export function StatusActions({ id, current }: { id: string; current: AppointmentStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(status: AppointmentStatus) {
    setBusy(true);
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  const options = NEXT[current];
  if (options.length === 0) return <div className="text-xs text-ink-subtle">No further transitions.</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.status} disabled={busy} className={o.tone} onClick={() => change(o.status)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
