import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { LabResultForm } from './result-form';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function LabOrderPage({ params }: { params: { id: string } }) {
  const order = await prisma.labOrder.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      items: { include: { test: true } },
    },
  });
  if (!order) notFound();

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNo}`}
        subtitle={`${order.patient.fullName} (${order.patient.mrn}) · Dr. ${order.doctor.user.fullName} · ${formatDate(order.createdAt, true)}`}
        actions={<StatusBadge kind="lab" value={order.status} />}
      />
      <LabResultForm
        id={order.id}
        status={order.status}
        items={order.items.map((i) => ({
          id: i.id,
          name: i.test.name,
          code: i.test.code,
          unit: i.test.units ?? '',
          ref: i.test.refRange ?? '',
          value: i.resultValue ?? '',
          flag: i.flag ?? '',
          remarks: i.remarks ?? '',
        }))}
      />
    </>
  );
}
