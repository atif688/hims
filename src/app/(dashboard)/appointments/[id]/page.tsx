import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { calcAge, formatDate } from '@/lib/utils';
import { StatusActions } from './status-actions';
import { Activity, FlaskConical, Pill, Stethoscope } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const appt = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: { include: { allergies: true } },
      doctor: { include: { user: true, department: true } },
      examination: true,
      prescription: { include: { items: true } },
      labOrders: { include: { items: { include: { test: true } } } },
    },
  });
  if (!appt) notFound();

  return (
    <>
      <PageHeader
        title={`Visit ${appt.visitNo} · Token #${appt.tokenNo}`}
        subtitle={`${appt.patient.fullName} (${appt.patient.mrn}) · Dr. ${appt.doctor.user.fullName}`}
        actions={
          <>
            <Link href={`/workbench?appointmentId=${appt.id}`} className="btn-primary">
              <Stethoscope className="w-4 h-4" /> Open in workbench
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Visit status</div>
              <StatusBadge kind="appointment" value={appt.status} />
            </div>
            <StatusActions id={appt.id} current={appt.status as never} />

            <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
              <Info k="Scheduled" v={formatDate(appt.scheduledAt, true)} />
              <Info k="Checked in" v={formatDate(appt.checkedInAt, true)} />
              <Info k="Started" v={formatDate(appt.startedAt, true)} />
              <Info k="Completed" v={formatDate(appt.completedAt, true)} />
              <Info k="Source" v={appt.source} />
              <Info k="Priority" v={appt.priority} />
              <Info k="Reason" v={appt.reason} className="sm:col-span-2" />
            </dl>
          </div>

          {appt.examination && (
            <div className="card p-5">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Examination
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-sm">
                <Info k="BP" v={appt.examination.bpSystolic && appt.examination.bpDiastolic ? `${appt.examination.bpSystolic}/${appt.examination.bpDiastolic} mmHg` : null} />
                <Info k="Pulse" v={appt.examination.pulse ? `${appt.examination.pulse} bpm` : null} />
                <Info k="Temp" v={appt.examination.tempC ? `${appt.examination.tempC} °C` : null} />
                <Info k="SpO₂" v={appt.examination.spo2 ? `${appt.examination.spo2}%` : null} />
                <Info k="Height" v={appt.examination.heightCm ? `${appt.examination.heightCm} cm` : null} />
                <Info k="Weight" v={appt.examination.weightKg ? `${appt.examination.weightKg} kg` : null} />
                <Info k="BMI" v={appt.examination.bmi ? String(appt.examination.bmi) : null} />
                <Info k="Pain" v={appt.examination.painScore != null ? `${appt.examination.painScore}/10` : null} />
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <Info k="Chief complaint" v={appt.examination.chiefComplaint} />
                <Info k="Diagnosis" v={appt.examination.diagnosis} />
                <Info k="ICD codes" v={appt.examination.icdCodes} />
              </div>
            </div>
          )}

          {appt.prescription && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Pill className="w-4 h-4" /> Prescription
                </div>
                <StatusBadge kind="prescription" value={appt.prescription.status} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Drug</th>
                    <th className="table-th">Dose</th>
                    <th className="table-th">Freq</th>
                    <th className="table-th">Days</th>
                    <th className="table-th">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {appt.prescription.items.map((i) => (
                    <tr key={i.id}>
                      <td className="table-td font-medium">{i.drugName}</td>
                      <td className="table-td">{i.dose}</td>
                      <td className="table-td">{i.frequency}</td>
                      <td className="table-td">{i.durationDays ?? '—'}</td>
                      <td className="table-td">{i.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {appt.prescription.advice && (
                <div className="mt-3 text-sm">
                  <div className="text-xs text-ink-subtle">Advice</div>
                  <div>{appt.prescription.advice}</div>
                </div>
              )}
            </div>
          )}

          {appt.labOrders.length > 0 && (
            <div className="card p-5">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4" /> Lab / Radiology orders
              </div>
              <ul className="space-y-2 text-sm">
                {appt.labOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{o.orderNo}</div>
                      <div className="text-xs text-ink-subtle">{o.items.map((i) => i.test.name).join(', ')}</div>
                    </div>
                    <StatusBadge kind="lab" value={o.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="card p-5 h-fit">
          <div className="text-sm font-semibold mb-3">Patient</div>
          <div className="text-sm">
            <Link href={`/patients/${appt.patient.id}`} className="font-medium hover:underline">
              {appt.patient.fullName}
            </Link>
            <div className="text-xs text-ink-subtle">
              {appt.patient.mrn} · {calcAge(appt.patient.dob)}y · {appt.patient.gender}
            </div>
            <div className="text-xs text-ink-subtle">{appt.patient.phone}</div>
          </div>

          {appt.patient.allergies.length > 0 && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-ink-subtle mb-1">Allergies</div>
              <ul className="text-sm space-y-1">
                {appt.patient.allergies.map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span>{a.substance}</span>
                    <span className="badge-amber">{a.severity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-line text-xs text-ink-muted">
            Doctor: Dr. {appt.doctor.user.fullName}
            <div>{appt.doctor.department?.name ?? appt.doctor.specialty}</div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Info({ k, v, className }: { k: string; v?: string | null; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-ink-subtle">{k}</div>
      <div className="text-sm">{v || '—'}</div>
    </div>
  );
}
