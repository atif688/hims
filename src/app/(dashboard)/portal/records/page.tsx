import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { calcAge, formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PortalRecords() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.patientProfile) {
    return (
      <div className="card p-6">
        <PageHeader title="Patient portal" />
        <p className="text-sm text-ink-muted">
          Your account is not linked to a patient record. Please contact the reception desk.
        </p>
      </div>
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { id: user.patientProfile.id },
    include: {
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: { doctor: { include: { user: true } } },
      },
      prescriptions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true, doctor: { include: { user: true } } },
      },
      labOrders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: { include: { test: true } } },
      },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!patient) redirect('/login');

  return (
    <>
      <PageHeader
        title={`Hello, ${patient.fullName.split(' ')[0]}`}
        subtitle={`MRN ${patient.mrn} · ${calcAge(patient.dob)} y · ${patient.gender}`}
        actions={<Link href="/portal/appointments" className="btn-primary">Book appointment</Link>}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="card p-5">
          <div className="text-sm font-semibold mb-3">Upcoming & recent visits</div>
          {patient.appointments.length === 0 ? (
            <div className="text-sm text-ink-subtle">No visits yet.</div>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {patient.appointments.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Dr. {a.doctor.user.fullName}</div>
                    <div className="text-xs text-ink-subtle">{formatDate(a.scheduledAt, true)}</div>
                  </div>
                  <StatusBadge kind="appointment" value={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="text-sm font-semibold mb-3">Prescriptions</div>
          {patient.prescriptions.length === 0 ? (
            <div className="text-sm text-ink-subtle">None yet.</div>
          ) : (
            <ul className="space-y-3 text-sm">
              {patient.prescriptions.map((p) => (
                <li key={p.id} className="border-b border-line pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{formatDate(p.createdAt)}</div>
                    <StatusBadge kind="prescription" value={p.status} />
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-xs text-ink-muted">
                    {p.items.map((i) => (
                      <li key={i.id}>{i.drugName} {i.dose} {i.frequency} × {i.durationDays ?? '—'} days</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="text-sm font-semibold mb-3">Lab & Radiology reports</div>
          {patient.labOrders.length === 0 ? (
            <div className="text-sm text-ink-subtle">No orders.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {patient.labOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.orderNo}</div>
                    <div className="text-xs text-ink-subtle">{o.items.map((i) => i.test.name).join(', ')}</div>
                  </div>
                  <StatusBadge kind="lab" value={o.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="text-sm font-semibold mb-3">Invoices</div>
          {patient.invoices.length === 0 ? (
            <div className="text-sm text-ink-subtle">No invoices.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {patient.invoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{i.invoiceNo}</div>
                    <div className="text-xs text-ink-subtle">{formatDate(i.issuedAt ?? i.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatCurrency(Number(i.total))}</span>
                    <StatusBadge kind="invoice" value={i.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
