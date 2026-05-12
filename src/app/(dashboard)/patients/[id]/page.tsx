import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { calcAge, formatCurrency, formatDate } from '@/lib/utils';
import { AlertTriangle, Calendar, FlaskConical, QrCode, Receipt, ShieldAlert, Stethoscope } from 'lucide-react';
import { PrintButton } from '@/components/ui/print-button';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      allergies: true,
      history: { orderBy: { createdAt: 'desc' } },
      familyHistory: true,
      vaccinations: { orderBy: { givenAt: 'desc' } },
      insurances: true,
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: { doctor: { include: { user: true } } },
      },
      prescriptions: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true, doctor: { include: { user: true } } },
      },
      labOrders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: { include: { test: true } } },
      },
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!patient) notFound();

  const severeAllergies = patient.allergies.filter(
    (a) => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING',
  );

  return (
    <>
      <PageHeader
        title={patient.fullName}
        subtitle={`${patient.mrn} · ${calcAge(patient.dob)} y · ${patient.gender}`}
        actions={
          <>
            <Link href={`/appointments/new?patientId=${patient.id}`} className="btn-primary">
              <Calendar className="w-4 h-4" /> Book appointment
            </Link>
            <PrintButton />
          </>
        }
      />

      {severeAllergies.length > 0 && (
        <div className="card border-rose-300 bg-rose-50 dark:bg-rose-950 p-3 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span className="text-sm text-rose-700 dark:text-rose-100 font-medium">
            Severe allergies: {severeAllergies.map((a) => a.substance).join(', ')}
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <aside className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-lg font-bold text-brand-700 dark:text-brand-200">
                {patient.fullName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{patient.fullName}</div>
                <div className="text-xs text-ink-subtle">{patient.mrn}</div>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              <Info k="Phone" v={patient.phone} />
              <Info k="Email" v={patient.email} />
              <Info k="Blood" v={patient.bloodGroup} />
              <Info k="DOB" v={formatDate(patient.dob)} />
              <Info k="CNIC" v={patient.cnic} />
              <Info k="City" v={patient.city} />
              <Info k="Marital" v={patient.maritalStatus} />
              <Info k="Occupation" v={patient.occupation} />
            </dl>
            <div className="mt-4 pt-4 border-t border-line flex items-center gap-2 text-xs text-ink-muted">
              <QrCode className="w-4 h-4" />
              <span className="font-mono">{patient.qrCode}</span>
            </div>
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Allergies
            </div>
            {patient.allergies.length === 0 ? (
              <div className="text-sm text-ink-subtle">No known allergies.</div>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {patient.allergies.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span>{a.substance} <span className="text-ink-subtle">({a.kind})</span></span>
                    <span className="badge-amber">{a.severity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold mb-3">Insurance</div>
            {patient.insurances.length === 0 ? (
              <div className="text-sm text-ink-subtle">None on file.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {patient.insurances.map((i) => (
                  <li key={i.id}>
                    <div className="font-medium">{i.provider}</div>
                    <div className="text-xs text-ink-subtle">
                      Policy {i.policyNumber} · valid till {formatDate(i.validTill)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Visit history
              </div>
              <Link href={`/appointments/new?patientId=${patient.id}`} className="text-xs text-brand-700 hover:underline">+ New visit</Link>
            </div>
            {patient.appointments.length === 0 ? (
              <div className="text-sm text-ink-subtle">No visits yet.</div>
            ) : (
              <ul className="divide-y divide-line">
                {patient.appointments.map((a) => (
                  <li key={a.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{formatDate(a.scheduledAt, true)}</div>
                      <div className="text-xs text-ink-subtle">
                        Dr. {a.doctor.user.fullName} · {a.reason ?? 'OPD visit'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge kind="appointment" value={a.status} />
                      <Link href={`/appointments/${a.id}`} className="text-xs text-brand-700 hover:underline">Open</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="text-sm font-semibold mb-3">Recent prescriptions</div>
              {patient.prescriptions.length === 0 ? (
                <div className="text-sm text-ink-subtle">No prescriptions.</div>
              ) : (
                <ul className="space-y-3 text-sm">
                  {patient.prescriptions.map((p) => (
                    <li key={p.id} className="border-b border-line pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{formatDate(p.createdAt)}</div>
                        <StatusBadge kind="prescription" value={p.status} />
                      </div>
                      <ul className="mt-1 text-xs text-ink-muted list-disc pl-4 space-y-0.5">
                        {p.items.map((i) => (
                          <li key={i.id}>{i.drugName} {i.dose} {i.frequency}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4" /> Recent lab/radiology
              </div>
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
            </div>
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Recent invoices
            </div>
            {patient.invoices.length === 0 ? (
              <div className="text-sm text-ink-subtle">No invoices.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">No.</th>
                    <th className="table-th">Date</th>
                    <th className="table-th">Total</th>
                    <th className="table-th">Paid</th>
                    <th className="table-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="table-td font-mono text-xs">{i.invoiceNo}</td>
                      <td className="table-td">{formatDate(i.issuedAt ?? i.createdAt)}</td>
                      <td className="table-td">{formatCurrency(Number(i.total))}</td>
                      <td className="table-td">{formatCurrency(Number(i.amountPaid))}</td>
                      <td className="table-td"><StatusBadge kind="invoice" value={i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold mb-3">Medical history</div>
            {patient.history.length === 0 ? (
              <div className="text-sm text-ink-subtle">No history recorded.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {patient.history.map((h) => (
                  <li key={h.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{h.title}</div>
                      {h.details && <div className="text-xs text-ink-muted">{h.details}</div>}
                    </div>
                    <span className="badge-slate text-[10px]">{h.type.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Info({ k, v }: { k: string; v?: string | null }) {
  return (
    <>
      <dt className="text-xs text-ink-subtle">{k}</dt>
      <dd className="text-sm">{v || '—'}</dd>
    </>
  );
}
