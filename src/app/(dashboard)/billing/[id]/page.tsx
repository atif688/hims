import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { PrintButton } from '@/components/ui/print-button';
import { PayForm } from './pay-form';
import { formatCurrency, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { patient: true, items: true, payments: { orderBy: { receivedAt: 'desc' } } },
  });
  if (!invoice) notFound();
  const balance = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.invoiceNo}`}
        subtitle={`${invoice.patient.fullName} (${invoice.patient.mrn})`}
        actions={
          <>
            <StatusBadge kind="invoice" value={invoice.status} />
            <PrintButton />
          </>
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="card p-5">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-2xl font-bold">INVOICE</div>
              <div className="text-sm text-ink-subtle">No. {invoice.invoiceNo}</div>
              <div className="text-sm text-ink-subtle">Date: {formatDate(invoice.issuedAt ?? invoice.createdAt, true)}</div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">{invoice.patient.fullName}</div>
              <div className="text-ink-subtle">{invoice.patient.mrn}</div>
              <div className="text-ink-subtle">{invoice.patient.phone}</div>
            </div>
          </div>

          <table className="w-full text-sm border-t border-line">
            <thead>
              <tr>
                <th className="table-th">Description</th>
                <th className="table-th">Kind</th>
                <th className="table-th">Qty</th>
                <th className="table-th">Price</th>
                <th className="table-th text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((i) => (
                <tr key={i.id}>
                  <td className="table-td">{i.description}</td>
                  <td className="table-td"><span className="badge-slate">{i.kind}</span></td>
                  <td className="table-td">{i.qty}</td>
                  <td className="table-td">{formatCurrency(Number(i.unitPrice))}</td>
                  <td className="table-td text-right">{formatCurrency(Number(i.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-full max-w-xs text-sm space-y-1">
            <Row label="Subtotal" value={formatCurrency(Number(invoice.subtotal))} />
            <Row label="Discount" value={`- ${formatCurrency(Number(invoice.discount))}`} />
            <Row label="Tax" value={formatCurrency(Number(invoice.tax))} />
            <hr className="border-line" />
            <Row label="Total" value={formatCurrency(Number(invoice.total))} strong />
            <Row label="Paid" value={formatCurrency(Number(invoice.amountPaid))} />
            <Row label="Balance" value={formatCurrency(balance)} strong />
          </div>

          {invoice.notes && (
            <div className="mt-6 text-sm">
              <div className="text-xs text-ink-subtle">Notes</div>
              <div>{invoice.notes}</div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {balance > 0 && <PayForm id={invoice.id} balance={balance} />}

          <div className="card p-5">
            <div className="text-sm font-semibold mb-3">Payments</div>
            {invoice.payments.length === 0 ? (
              <div className="text-sm text-ink-subtle">No payments yet.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex justify-between border-b border-line pb-2 last:border-0">
                    <div>
                      <div className="font-medium">{formatCurrency(Number(p.amount))}</div>
                      <div className="text-xs text-ink-subtle">{p.method} · {formatDate(p.receivedAt, true)}</div>
                    </div>
                    {p.reference && <span className="text-xs text-ink-subtle">{p.reference}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={'flex justify-between ' + (strong ? 'font-semibold' : 'text-ink-muted')}>
      <span>{label}</span>
      <span className={strong ? 'text-ink' : ''}>{value}</span>
    </div>
  );
}
