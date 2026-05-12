'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Item {
  id: string;
  drugName: string;
  dose: string;
  frequency: string;
  quantity: number;
  dispensed: number;
  stock: number | null;
}

export function DispenseForm({ id, items }: { id: string; items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.quantity])),
  );

  async function submit() {
    setBusy(true);
    const res = await fetch(`/api/prescriptions/${id}/dispense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: Object.entries(qty).map(([id, dispensedQty]) => ({ id, dispensedQty })),
      }),
    });
    setBusy(false);
    if (res.ok) router.push('/pharmacy');
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted">
          <tr>
            <th className="table-th">Drug</th>
            <th className="table-th">Dose</th>
            <th className="table-th">Frequency</th>
            <th className="table-th">Prescribed</th>
            <th className="table-th">Stock</th>
            <th className="table-th">Dispense qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const insufficient = i.stock != null && i.stock < (qty[i.id] ?? 0);
            return (
              <tr key={i.id}>
                <td className="table-td font-medium">{i.drugName}</td>
                <td className="table-td">{i.dose}</td>
                <td className="table-td">{i.frequency}</td>
                <td className="table-td">{i.quantity}</td>
                <td className="table-td">
                  {i.stock != null ? (
                    <span className={i.stock <= 5 ? 'badge-rose' : i.stock <= 20 ? 'badge-amber' : 'badge-green'}>
                      {i.stock}
                    </span>
                  ) : '—'}
                </td>
                <td className="table-td">
                  <input
                    type="number"
                    min={0}
                    max={i.quantity}
                    value={qty[i.id]}
                    onChange={(e) => setQty((s) => ({ ...s, [i.id]: Math.max(0, Math.min(Number(e.target.value), i.quantity)) }))}
                    className={'input w-24 ' + (insufficient ? 'border-rose-400' : '')}
                  />
                  {insufficient && <div className="text-xs text-rose-600 mt-1">Insufficient stock</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="p-3 border-t border-line flex justify-end gap-2">
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button disabled={busy} onClick={submit} className="btn-primary">
          {busy ? 'Dispensing…' : 'Confirm dispense'}
        </button>
      </div>
    </div>
  );
}
