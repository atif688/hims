'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Item {
  id: string;
  name: string;
  code: string;
  unit: string;
  ref: string;
  value: string;
  flag: string;
  remarks: string;
}

export function LabResultForm({
  id,
  status,
  items,
}: {
  id: string;
  status: string;
  items: Item[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(items);

  async function patch(action: 'collect' | 'in-progress' | 'save' | 'report') {
    setBusy(true);
    const status =
      action === 'collect' ? 'SAMPLE_COLLECTED' :
      action === 'in-progress' ? 'IN_PROGRESS' :
      action === 'save' ? 'RESULT_READY' :
      action === 'report' ? 'REPORTED' : undefined;

    const res = await fetch(`/api/lab-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        results: rows.map((r) => ({
          id: r.id,
          resultValue: r.value || null,
          flag: r.flag || null,
          remarks: r.remarks || null,
        })),
      }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">Test</th>
              <th className="table-th">Result</th>
              <th className="table-th">Unit</th>
              <th className="table-th">Reference</th>
              <th className="table-th">Flag</th>
              <th className="table-th">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id}>
                <td className="table-td">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-ink-subtle">{r.code}</div>
                </td>
                <td className="table-td">
                  <input className="input w-32" value={r.value} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} />
                </td>
                <td className="table-td">{r.unit || '—'}</td>
                <td className="table-td">{r.ref || '—'}</td>
                <td className="table-td">
                  <select className="input w-24" value={r.flag} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, flag: e.target.value } : x))}>
                    <option value="">—</option>
                    <option value="L">Low</option>
                    <option value="H">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </td>
                <td className="table-td">
                  <input className="input" value={r.remarks} onChange={(e) => setRows((p) => p.map((x, i) => i === idx ? { ...x, remarks: e.target.value } : x))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {status === 'ORDERED' && (
          <button disabled={busy} onClick={() => patch('collect')} className="btn-secondary">Mark sample collected</button>
        )}
        {(status === 'ORDERED' || status === 'SAMPLE_COLLECTED') && (
          <button disabled={busy} onClick={() => patch('in-progress')} className="btn-secondary">Mark in progress</button>
        )}
        <button disabled={busy} onClick={() => patch('save')} className="btn-primary">Save results</button>
        <button disabled={busy} onClick={() => patch('report')} className="btn-primary">Save & report</button>
      </div>
    </div>
  );
}
