'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export function PayForm({ id, balance }: { id: string; balance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'INSURANCE'>('CASH');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await fetch(`/api/invoices/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method, reference }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="card p-5">
      <div className="text-sm font-semibold mb-3">Receive payment</div>
      <div className="space-y-3">
        <div>
          <label className="label">Amount</label>
          <input type="number" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          <div className="text-xs text-ink-subtle mt-1">Outstanding: {formatCurrency(balance)}</div>
        </div>
        <div>
          <label className="label">Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value as never)}>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="WALLET">Mobile wallet</option>
            <option value="INSURANCE">Insurance</option>
          </select>
        </div>
        <div>
          <label className="label">Reference (txn id / receipt)</label>
          <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
        <button disabled={busy || amount <= 0} onClick={submit} className="btn-primary w-full">
          {busy ? 'Processing…' : 'Confirm payment'}
        </button>
      </div>
    </div>
  );
}
