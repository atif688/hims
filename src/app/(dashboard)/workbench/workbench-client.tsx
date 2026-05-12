'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, FlaskConical, Pill, Save, ShieldAlert, X } from 'lucide-react';
import { calcBMI } from '@/lib/utils';

interface ApptRef { id: string; patientId: string; doctorId: string; }
interface PatientRef {
  id: string;
  name: string;
  mrn: string;
  phone: string;
  allergies: { substance: string; severity: string }[];
}
interface LabTest { id: string; code: string; name: string; kind: string; price: number; }
interface Medication { id: string; name: string; generic: string | null; strength: string | null; price: number; stock: number; }

interface RxItem {
  medicationId?: string | null;
  drugName: string;
  dose: string;
  frequency: string;
  durationDays?: number;
  quantity: number;
  instructions?: string;
}

interface Existing {
  examination: any | null;
  prescription: { items: any[]; advice: string | null; followUpDate: Date | null } | null;
  labOrders: any[];
}

const TABS = [
  { key: 'exam', label: 'Examination', icon: Activity },
  { key: 'rx', label: 'Prescription', icon: Pill },
  { key: 'lab', label: 'Lab / Radiology', icon: FlaskConical },
] as const;

export function WorkbenchClient({
  appointment,
  patient,
  existing,
  labTests,
  medications,
}: {
  appointment: ApptRef;
  patient: PatientRef;
  existing: Existing;
  labTests: LabTest[];
  medications: Medication[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('exam');
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  // examination form state
  const [exam, setExam] = useState({
    bpSystolic: existing.examination?.bpSystolic ?? '',
    bpDiastolic: existing.examination?.bpDiastolic ?? '',
    pulse: existing.examination?.pulse ?? '',
    tempC: existing.examination?.tempC ?? '',
    respRate: existing.examination?.respRate ?? '',
    spo2: existing.examination?.spo2 ?? '',
    heightCm: existing.examination?.heightCm ?? '',
    weightKg: existing.examination?.weightKg ?? '',
    chiefComplaint: existing.examination?.chiefComplaint ?? '',
    hopi: existing.examination?.hopi ?? '',
    generalExam: existing.examination?.generalExam ?? '',
    systemicExam: existing.examination?.systemicExam ?? '',
    diagnosis: existing.examination?.diagnosis ?? '',
    icdCodes: existing.examination?.icdCodes ?? '',
    painScore: existing.examination?.painScore ?? '',
    gcsScore: existing.examination?.gcsScore ?? '',
    clinicalImpression: existing.examination?.clinicalImpression ?? '',
  });

  const bmi = useMemo(
    () => calcBMI(Number(exam.weightKg) || null, Number(exam.heightCm) || null),
    [exam.weightKg, exam.heightCm],
  );

  // Rx state
  const [rxAdvice, setRxAdvice] = useState(existing.prescription?.advice ?? '');
  const [followUp, setFollowUp] = useState(
    existing.prescription?.followUpDate
      ? new Date(existing.prescription.followUpDate).toISOString().slice(0, 10)
      : '',
  );
  const [rxItems, setRxItems] = useState<RxItem[]>(
    existing.prescription?.items?.map((i: any) => ({
      medicationId: i.medicationId,
      drugName: i.drugName,
      dose: i.dose,
      frequency: i.frequency,
      durationDays: i.durationDays,
      quantity: i.quantity,
      instructions: i.instructions ?? '',
    })) || [],
  );

  // Lab state
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [labNote, setLabNote] = useState('');

  async function saveExam(sign = false) {
    setSaving(true);
    const res = await fetch('/api/examinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: appointment.id,
        ...exam,
        sign,
      }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  async function saveRx() {
    if (rxItems.length === 0) return alert('Add at least one medication.');
    setSaving(true);
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: appointment.id,
        advice: rxAdvice,
        followUpDate: followUp ? new Date(followUp).toISOString() : null,
        items: rxItems,
      }),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) {
      setAlerts(j.data.alerts || []);
      router.refresh();
    }
  }

  async function orderLab() {
    if (selectedTests.length === 0) return alert('Select at least one test.');
    setSaving(true);
    const res = await fetch('/api/lab-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment.id,
        clinicalNotes: labNote,
        testIds: selectedTests,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSelectedTests([]);
      setLabNote('');
      router.refresh();
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
        <div>
          <div className="font-semibold text-lg">{patient.name}</div>
          <div className="text-xs text-ink-subtle">{patient.mrn} · {patient.phone}</div>
        </div>
        {patient.allergies.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-rose-700 dark:text-rose-200">
            <ShieldAlert className="w-4 h-4" />
            Allergies: {patient.allergies.map((a) => a.substance).join(', ')}
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg ' +
                (tab === t.key ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 font-medium' : 'text-ink-muted hover:bg-surface-muted')
              }
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div className="card border-amber-300 bg-amber-50 dark:bg-amber-950 p-3 mb-4">
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-100 mb-1">Alerts</div>
          <ul className="text-sm list-disc pl-5 text-amber-700 dark:text-amber-200">
            {alerts.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {tab === 'exam' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            {[
              ['BP Sys', 'bpSystolic', 'mmHg'],
              ['BP Dia', 'bpDiastolic', 'mmHg'],
              ['Pulse', 'pulse', 'bpm'],
              ['Temp', 'tempC', '°C'],
              ['Resp', 'respRate', '/min'],
              ['SpO₂', 'spo2', '%'],
              ['Height', 'heightCm', 'cm'],
              ['Weight', 'weightKg', 'kg'],
            ].map(([label, key, unit]) => (
              <div key={key}>
                <label className="label">{label} <span className="text-ink-subtle">({unit})</span></label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={(exam as any)[key]}
                  onChange={(e) => setExam((s) => ({ ...s, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="label">BMI</label>
              <input className="input" value={bmi ?? ''} readOnly />
            </div>
            <div>
              <label className="label">Pain (0–10)</label>
              <input
                type="number"
                min={0}
                max={10}
                className="input"
                value={exam.painScore}
                onChange={(e) => setExam((s) => ({ ...s, painScore: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">GCS (3–15)</label>
              <input
                type="number"
                min={3}
                max={15}
                className="input"
                value={exam.gcsScore}
                onChange={(e) => setExam((s) => ({ ...s, gcsScore: e.target.value }))}
              />
            </div>
          </div>

          {[
            ['Chief complaint', 'chiefComplaint'],
            ['HOPI (history of present illness)', 'hopi'],
            ['General examination', 'generalExam'],
            ['Systemic examination', 'systemicExam'],
            ['Diagnosis', 'diagnosis'],
            ['ICD codes (comma separated)', 'icdCodes'],
            ['Clinical impression', 'clinicalImpression'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <textarea
                rows={key === 'icdCodes' || key === 'diagnosis' ? 1 : 2}
                className="input"
                value={(exam as any)[key]}
                onChange={(e) => setExam((s) => ({ ...s, [key]: e.target.value }))}
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button disabled={saving} onClick={() => saveExam(false)} className="btn-secondary">
              <Save className="w-4 h-4" /> Save draft
            </button>
            <button disabled={saving} onClick={() => saveExam(true)} className="btn-primary">
              <Save className="w-4 h-4" /> Save & digitally sign
            </button>
          </div>
        </div>
      )}

      {tab === 'rx' && (
        <div className="space-y-4">
          <div className="card p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
              Search medication
            </div>
            <MedicationPicker
              medications={medications}
              onPick={(m) =>
                setRxItems((prev) => [
                  ...prev,
                  {
                    medicationId: m.id,
                    drugName: m.strength ? `${m.name} ${m.strength}` : m.name,
                    dose: m.strength ?? '',
                    frequency: 'OD',
                    durationDays: 5,
                    quantity: 1,
                    instructions: '',
                  },
                ])
              }
            />
          </div>

          {rxItems.length === 0 ? (
            <div className="text-sm text-ink-subtle border border-dashed border-line rounded-lg p-6 text-center">
              No medications added yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Drug</th>
                  <th className="table-th">Dose</th>
                  <th className="table-th">Frequency</th>
                  <th className="table-th">Days</th>
                  <th className="table-th">Qty</th>
                  <th className="table-th">Instructions</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {rxItems.map((i, idx) => (
                  <tr key={idx}>
                    <td className="table-td">
                      <input
                        className="input"
                        value={i.drugName}
                        onChange={(e) =>
                          setRxItems((p) => p.map((x, j) => (j === idx ? { ...x, drugName: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="table-td">
                      <input
                        className="input"
                        value={i.dose}
                        onChange={(e) =>
                          setRxItems((p) => p.map((x, j) => (j === idx ? { ...x, dose: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="table-td">
                      <input
                        className="input"
                        value={i.frequency}
                        onChange={(e) =>
                          setRxItems((p) => p.map((x, j) => (j === idx ? { ...x, frequency: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="table-td">
                      <input
                        type="number"
                        className="input"
                        value={i.durationDays ?? ''}
                        onChange={(e) =>
                          setRxItems((p) =>
                            p.map((x, j) => (j === idx ? { ...x, durationDays: Number(e.target.value) || undefined } : x)),
                          )
                        }
                      />
                    </td>
                    <td className="table-td">
                      <input
                        type="number"
                        className="input"
                        value={i.quantity}
                        onChange={(e) =>
                          setRxItems((p) => p.map((x, j) => (j === idx ? { ...x, quantity: Number(e.target.value) || 1 } : x)))
                        }
                      />
                    </td>
                    <td className="table-td">
                      <input
                        className="input"
                        value={i.instructions ?? ''}
                        onChange={(e) =>
                          setRxItems((p) => p.map((x, j) => (j === idx ? { ...x, instructions: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="table-td">
                      <button
                        className="btn-ghost p-1.5"
                        onClick={() => setRxItems((p) => p.filter((_, j) => j !== idx))}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">General advice</label>
              <textarea rows={2} className="input" value={rxAdvice} onChange={(e) => setRxAdvice(e.target.value)} />
            </div>
            <div>
              <label className="label">Follow-up date</label>
              <input type="date" className="input" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <button disabled={saving} onClick={saveRx} className="btn-primary">
              <Save className="w-4 h-4" /> Save prescription
            </button>
          </div>
        </div>
      )}

      {tab === 'lab' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {labTests.map((t) => {
              const selected = selectedTests.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={
                    'flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer ' +
                    (selected ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-line hover:bg-surface-muted')
                  }
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected}
                    onChange={(e) =>
                      setSelectedTests((p) => (e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id)))
                    }
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-ink-subtle">{t.code} · {t.kind}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div>
            <label className="label">Clinical justification</label>
            <textarea rows={2} className="input" value={labNote} onChange={(e) => setLabNote(e.target.value)} />
          </div>
          <button disabled={saving} onClick={orderLab} className="btn-primary">
            <Save className="w-4 h-4" /> Place order ({selectedTests.length})
          </button>
        </div>
      )}
    </div>
  );
}

function MedicationPicker({
  medications,
  onPick,
}: {
  medications: Medication[];
  onPick: (m: Medication) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = medications
    .filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        m.generic?.toLowerCase().includes(q.toLowerCase()),
    )
    .slice(0, 8);

  return (
    <div>
      <input className="input" placeholder="Type to search (e.g. Paracetamol)…" value={q} onChange={(e) => setQ(e.target.value)} />
      {q && (
        <ul className="mt-2 grid sm:grid-cols-2 gap-2">
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="w-full text-left rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-muted"
                onClick={() => { onPick(m); setQ(''); }}
              >
                <div className="font-medium">{m.name} {m.strength}</div>
                <div className="text-xs text-ink-subtle">{m.generic} · stock {m.stock}</div>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="text-xs text-ink-subtle">No matches.</li>}
        </ul>
      )}
    </div>
  );
}
