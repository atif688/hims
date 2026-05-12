'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Doctor { id: string; name: string; specialty: string; fee: number; }
interface PatientMatch { id: string; mrn: string; fullName: string; phone: string; }

export function AppointmentForm({
  doctors,
  preselectPatient,
}: {
  doctors: Doctor[];
  preselectPatient: { id: string; name: string; mrn: string } | null;
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState(preselectPatient?.id ?? '');
  const [patientLabel, setPatientLabel] = useState(
    preselectPatient ? `${preselectPatient.name} (${preselectPatient.mrn})` : '',
  );
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<PatientMatch[]>([]);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset() + 15);
    return d.toISOString().slice(0, 16);
  });
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (search.trim().length < 2) {
      setMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/patients?q=${encodeURIComponent(search.trim())}&take=8`);
      const j = await r.json();
      setMatches(j.data?.items ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const selectedDoc = doctors.find((d) => d.id === doctorId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setErr('Pick a patient first.');
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        doctorId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        priority,
        reason,
        source: 'WALK_IN',
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(json.error || 'Failed to create');
      return;
    }
    router.push(`/appointments/${json.data.id}`);
  }

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card p-5 space-y-4">
        <div>
          <label className="label">Patient</label>
          {patientId ? (
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm">
              <span>{patientLabel}</span>
              <button
                type="button"
                className="text-xs text-brand-700 hover:underline"
                onClick={() => { setPatientId(''); setPatientLabel(''); }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
              <input
                className="input pl-9"
                placeholder="Search by name, MRN, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {matches.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full card max-h-64 overflow-auto p-1">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientId(m.id);
                          setPatientLabel(`${m.fullName} (${m.mrn})`);
                          setMatches([]);
                          setSearch('');
                        }}
                        className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-surface-muted"
                      >
                        <div className="font-medium">{m.fullName}</div>
                        <div className="text-xs text-ink-subtle">{m.mrn} · {m.phone}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Doctor</label>
            <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date & time</label>
            <input
              type="datetime-local"
              className="input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'ROUTINE' | 'URGENT' | 'EMERGENCY')}
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          <div>
            <label className="label">Reason / chief complaint</label>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. follow-up, fever, BP" />
          </div>
        </div>

        {err && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {err}
          </div>
        )}
      </div>

      <aside className="card p-5 h-fit">
        <div className="text-sm font-semibold mb-3">Summary</div>
        <dl className="text-sm space-y-2">
          <div>
            <dt className="text-ink-subtle text-xs">Patient</dt>
            <dd>{patientLabel || '— not selected —'}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle text-xs">Doctor</dt>
            <dd>{selectedDoc ? `Dr. ${selectedDoc.name}` : '—'}</dd>
            <div className="text-xs text-ink-subtle">{selectedDoc?.specialty}</div>
          </div>
          <div>
            <dt className="text-ink-subtle text-xs">Consultation fee</dt>
            <dd className="font-semibold">{selectedDoc ? formatCurrency(selectedDoc.fee) : '—'}</dd>
          </div>
        </dl>
        <button disabled={busy} className="btn-primary w-full mt-6">
          {busy ? 'Booking…' : 'Book appointment'}
        </button>
      </aside>
    </form>
  );
}
