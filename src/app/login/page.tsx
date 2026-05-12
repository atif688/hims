'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Activity, ArrowRight } from 'lucide-react';

const DEMO = [
  { role: 'Super Admin', email: 'admin@hims.local' },
  { role: 'Doctor', email: 'dr.sara@hims.local' },
  { role: 'Receptionist', email: 'reception@hims.local' },
  { role: 'Pharmacist', email: 'pharmacy@hims.local' },
  { role: 'Lab Staff', email: 'lab@hims.local' },
  { role: 'Patient', email: 'patient@hims.local' },
];

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [email, setEmail] = useState('admin@hims.local');
  const [password, setPassword] = useState('Password123!');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Login failed');
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">Access the HIMS OPD dashboard.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Signing in…' : 'Sign in'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-8 card p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">Demo accounts</div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword('Password123!');
              }}
              className="text-left text-xs rounded-md border border-line px-2 py-1.5 hover:bg-surface-muted"
            >
              <div className="font-medium text-ink">{d.role}</div>
              <div className="text-ink-subtle truncate">{d.email}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-subtle">
          Password for all demo accounts: <code className="font-mono">Password123!</code>
        </p>
      </div>

      <div className="mt-6 text-xs text-ink-subtle">
        ← <Link href="/" className="hover:text-ink">Back to home</Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-surface grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold">HIMS OPD</div>
            <div className="text-xs opacity-80">Hospital Management System</div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            One workflow.
            <br />Every role.
          </h2>
          <p className="mt-3 opacity-90 max-w-md">
            From registration to billing — clinicians, pharmacists, lab staff and admins working from the
            same patient timeline with role-aware permissions.
          </p>
        </div>
        <div className="text-xs opacity-75">© {new Date().getFullYear()} HIMS · Demo build</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Suspense fallback={<div className="text-sm text-ink-subtle">Loading…</div>}>
          <LoginInner />
        </Suspense>
      </div>
    </main>
  );
}
