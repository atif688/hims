import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { DispenseForm } from './dispense-form';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DispensePage({ params }: { params: { id: string } }) {
  const rx = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      items: { include: { medication: true } },
    },
  });
  if (!rx) notFound();

  return (
    <>
      <PageHeader
        title={`Dispense prescription`}
        subtitle={`${rx.patient.fullName} (${rx.patient.mrn}) · Dr. ${rx.doctor.user.fullName} · ${formatDate(rx.createdAt, true)}`}
      />
      <DispenseForm
        id={rx.id}
        items={rx.items.map((i) => ({
          id: i.id,
          drugName: i.drugName,
          dose: i.dose,
          frequency: i.frequency,
          quantity: i.quantity,
          dispensed: i.dispensedQty,
          stock: i.medication?.stockQty ?? null,
        }))}
      />
    </>
  );
}
