import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { InvoiceForm } from './invoice-form';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  const recent = await prisma.patient.findMany({ orderBy: { registeredAt: 'desc' }, take: 50 });
  return (
    <>
      <PageHeader title="New invoice" subtitle="Create a consolidated bill for a patient visit." />
      <InvoiceForm
        recentPatients={recent.map((p) => ({ id: p.id, name: p.fullName, mrn: p.mrn }))}
      />
    </>
  );
}
