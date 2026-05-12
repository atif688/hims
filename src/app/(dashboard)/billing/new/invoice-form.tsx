'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Row { kind: string; description: string; qty: number; unitPrice: number; discount: number; }

export function InvoiceForm({
  recentPatients,
}: {
  recentPatients: { id: string; name: string; mrn: string }[];
}) {
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Row[]>([{ kind: 'CONSULT', description: 'Consultation fee', qty: 1, unitPrice: 1500, discount: 0 }]);
  const [busy, setBusy] = useState(false);

  const subtotal = rows.reduce((s, r) => s + r.qty * r.unitPrice - r.discount, 0);
  const total = Math.max(0, subtotal - discount + tax);

  async function submit() {
    if (!patientId) return alert('Pick a patient.');
    setBusy(true);
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, discount, tax, notes, items: rows }),
    });
    const j = await res.json();
    setBusy(false);
    if (res.ok) router.push(`/billing/${j.data.id}`);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Patient</label>
          <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Select…</option>
            {recentPatients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.mrn}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Line items</div>
            <button
              type="button"
              className="btn-secondary text-xs px-2 py-1"
              onClick={() => setRows((p) => [...p, { kind: 'PROCEDURE', description: '', qty: 1, unitPrice: 0, discount: 0 }])}
            >
              <Plus className="w-3.5 h-3.5" /> Add line
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">Kind</th>
                <th className="table-th">Description</th>
                <th className="table-th">Qty</th>
                <th className="table-th">Price</th>
                <th className="table-th">Disc</th>
                <th className="table-th text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td className="table-td">
                    <select className="input" value={r.kind} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, kind: e.target.value } : x))}>
                      {['CONSULT', 'PROCEDURE', 'LAB', 'PHARMACY', 'RADIOLOGY'].map((k) => <option key={k}>{k}</option>)}
                    </select>
                  </td>
                  <td className="table-td">
                    <input className="input" value={r.description} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                  </td>
                  <td className="table-td">
                    <input type="number" min={1} className="input w-16" value={r.qty} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, qty: Number(e.target.value) || 1 } : x))} />
                  </td>
                  <td className="table-td">
                    <input type="number" min={0} className="input w-24" value={r.unitPrice} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, unitPrice: Number(e.target.value) || 0 } : x))} />
                  </td>
                  <td className="table-td">
                    <input type="number" min={0} className="input w-20" value={r.discount} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, discount: Number(e.target.value) || 0 } : x))} />
                  </td>
                  <td className="table-td text-right font-medium">
                    {formatCurrency(r.qty * r.unitPrice - r.discount)}
                  </td>
                  <td className="table-td">
                    <button className="btn-ghost p-1.5" onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea rows={2} className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <aside className="card p-5 h-fit">
        <div className="text-sm font-semibold mb-3">Summary</div>
        <dl className="space-y-2 text-sm">
          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          <div className="flex justify-between items-center">
            <span className="text-ink-subtle">Discount</span>
            <input type="number" className="input w-28" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ink-subtle">Tax</span>
            <input type="number" className="input w-28" value={tax} onChange={(e) => setTax(Number(e.target.value) || 0)} />
          </div>
          <hr className="border-line" />
          <Row label="Total" value={formatCurrency(total)} strong />
        </dl>
        <button disabled={busy} className="btn-primary w-full mt-6" onClick={submit}>
          {busy ? 'Saving…' : 'Issue invoice'}
        </button>
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={'flex justify-between ' + (strong ? 'font-semibold text-lg' : 'text-ink-muted')}>
      <span>{label}</span>
      <span className={strong ? 'text-ink' : ''}>{value}</span>
    </div>
  );
}
