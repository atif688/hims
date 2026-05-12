import { cn } from '@/lib/utils';

const APPT_TONES: Record<string, string> = {
  SCHEDULED: 'badge-slate',
  CHECKED_IN: 'badge-amber',
  IN_CONSULTATION: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-rose',
  NO_SHOW: 'badge-rose',
};

const LAB_TONES: Record<string, string> = {
  ORDERED: 'badge-slate',
  SAMPLE_COLLECTED: 'badge-amber',
  IN_PROGRESS: 'badge-blue',
  RESULT_READY: 'badge-green',
  REPORTED: 'badge-green',
  CANCELLED: 'badge-rose',
};

const RX_TONES: Record<string, string> = {
  PRESCRIBED: 'badge-blue',
  READY: 'badge-amber',
  DISPENSED: 'badge-green',
  PARTIALLY_DISPENSED: 'badge-amber',
  REJECTED: 'badge-rose',
};

const INV_TONES: Record<string, string> = {
  DRAFT: 'badge-slate',
  ISSUED: 'badge-blue',
  PARTIAL: 'badge-amber',
  PAID: 'badge-green',
  REFUNDED: 'badge-rose',
  CANCELLED: 'badge-rose',
};

export function StatusBadge({
  kind,
  value,
}: {
  kind: 'appointment' | 'lab' | 'prescription' | 'invoice';
  value: string;
}) {
  const map = {
    appointment: APPT_TONES,
    lab: LAB_TONES,
    prescription: RX_TONES,
    invoice: INV_TONES,
  }[kind];
  return <span className={cn(map[value] ?? 'badge-slate')}>{value.replace(/_/g, ' ')}</span>;
}
