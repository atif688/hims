import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Activity, Calendar, FlaskConical, Pill, Receipt, Shield, Stethoscope, Users } from 'lucide-react';

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect('/dashboard');

  const features = [
    { icon: Users, title: 'Patient Registry', desc: 'MRN, demographics, allergies, longitudinal records.' },
    { icon: Calendar, title: 'Scheduling', desc: 'Token queue, walk-ins, online booking, multi-clinic.' },
    { icon: Stethoscope, title: 'Doctor Workbench', desc: 'Vitals, SOAP notes, ICD diagnoses, e-prescription.' },
    { icon: Pill, title: 'Pharmacy', desc: 'Live inventory, dispensing, allergy alerts.' },
    { icon: FlaskConical, title: 'Lab & Radiology', desc: 'Test catalog, order workflows, result entry.' },
    { icon: Receipt, title: 'Billing', desc: 'Consult, procedure, pharmacy, insurance, payments.' },
  ];

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-ink">HIMS OPD</div>
              <div className="text-xs text-ink-subtle">Hospital Management System</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary">Sign in</Link>
          </div>
        </div>

        <section className="max-w-3xl">
          <div className="badge-blue mb-4">Enterprise · Modular · HL7/FHIR-ready</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink">
            One platform for your entire OPD workflow.
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Run a multi-specialty outpatient department from a single, role-aware dashboard — patient
            registration to prescription to pharmacy to billing, with a complete audit trail.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">Open dashboard</Link>
            <a href="#features" className="btn-secondary">Explore features</a>
          </div>
        </section>

        <section id="features" className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <f.icon className="w-6 h-6 text-brand-600" />
              <div className="mt-3 font-semibold text-ink">{f.title}</div>
              <div className="text-sm text-ink-muted mt-1">{f.desc}</div>
            </div>
          ))}
        </section>

        <section className="mt-16 card p-6 flex items-start gap-4">
          <Shield className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <div className="font-semibold text-ink">Security & compliance by design</div>
            <p className="text-sm text-ink-muted mt-1">
              JWT auth with role-based access control, encrypted credentials, complete audit trail of
              critical actions, and a HIPAA-inspired data model ready to extend with consent management,
              2FA, and HL7/FHIR exchange.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
