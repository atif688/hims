'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { UserPlus } from 'lucide-react';

export default function NewPatientPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(json.error || 'Failed to register');
      return;
    }
    router.push(`/patients/${json.data.id}`);
  }

  return (
    <>
      <PageHeader title="Register patient" subtitle="Create a new patient record (MRN auto-generated)." />
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 card p-5">
          <div className="text-sm font-semibold mb-3">Demographics</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name" name="fullName" required />
            <Field label="Gender" name="gender" type="select" options={['MALE', 'FEMALE', 'OTHER']} required />
            <Field label="Date of birth" name="dob" type="date" required />
            <Field label="Blood group" name="bloodGroup" placeholder="e.g. O+" />
            <Field label="Marital status" name="maritalStatus" placeholder="single/married" />
            <Field label="Nationality" name="nationality" defaultValue="Pakistani" />
            <Field label="Occupation" name="occupation" />
            <Field label="Education" name="education" />
            <Field label="CNIC" name="cnic" placeholder="XXXXX-XXXXXXX-X" />
          </div>

          <div className="text-sm font-semibold mt-6 mb-3">Contact</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Mobile" name="phone" required />
            <Field label="Alt phone" name="altPhone" />
            <Field label="Email" name="email" type="email" />
            <Field label="City" name="city" />
            <div className="sm:col-span-2">
              <Field label="Address" name="address" />
            </div>
            <Field label="Emergency contact name" name="emergencyName" />
            <Field label="Emergency phone" name="emergencyPhone" />
            <Field label="Relation" name="emergencyRel" placeholder="spouse, parent…" />
          </div>
        </section>

        <aside className="card p-5 h-fit">
          <div className="text-sm font-semibold mb-3">Category</div>
          <div className="grid gap-2">
            {['NEW', 'REPEAT', 'CORPORATE', 'GOVT_SCHEME', 'EMERGENCY', 'REFERRED'].map((c, i) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input type="radio" name="category" value={c} defaultChecked={i === 0} />
                {c.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
          {err && (
            <div className="mt-4 rounded-lg bg-rose-50 dark:bg-rose-950 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
              {err}
            </div>
          )}
          <button disabled={busy} className="btn-primary w-full mt-6">
            <UserPlus className="w-4 h-4" />
            {busy ? 'Saving…' : 'Register patient'}
          </button>
          <p className="mt-3 text-xs text-ink-subtle">
            MRN and QR code will be auto-generated. Duplicate detection runs on CNIC.
          </p>
        </aside>
      </form>
    </>
  );
}

function Field({
  label,
  name,
  type = 'text',
  options,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  options?: string[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}{required ? ' *' : ''}</label>
      {type === 'select' ? (
        <select name={name} required={required} defaultValue={defaultValue} className="input">
          <option value="">Select…</option>
          {options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="input"
        />
      )}
    </div>
  );
}
