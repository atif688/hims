import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { patient: true, payments: true },
  });

  const totals = invoices.reduce(
    (acc, i) => ({
      issued: acc.issued + Number(i.total),
      collected: acc.collected + Number(i.amountPaid),
    }),
    { issued: 0, collected: 0 },
  );

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle={`Issued ${formatCurrency(totals.issued)} · Collected ${formatCurrency(totals.collected)}`}
        actions={
          <Link href="/billing/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New invoice
          </Link>
        }
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">Invoice #</th>
              <th className="table-th">Patient</th>
              <th className="table-th">Issued</th>
              <th className="table-th">Total</th>
              <th className="table-th">Paid</th>
              <th className="table-th">Balance</th>
              <th className="table-th">Status</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={8} className="table-td text-center py-10 text-ink-subtle">No invoices yet.</td></tr>
            ) : (
              invoices.map((i) => {
                const balance = Number(i.total) - Number(i.amountPaid);
                return (
                  <tr key={i.id}>
                    <td className="table-td font-mono text-xs">{i.invoiceNo}</td>
                    <td className="table-td">{i.patient.fullName}</td>
                    <td className="table-td">{formatDate(i.issuedAt ?? i.createdAt)}</td>
                    <td className="table-td">{formatCurrency(Number(i.total))}</td>
                    <td className="table-td">{formatCurrency(Number(i.amountPaid))}</td>
                    <td className={'table-td ' + (balance > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="table-td"><StatusBadge kind="invoice" value={i.status} /></td>
                    <td className="table-td text-right">
                      <Link href={`/billing/${i.id}`} className="text-brand-700 hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
