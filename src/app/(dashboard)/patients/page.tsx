import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/ui/page-header';
import { calcAge, formatDate } from '@/lib/utils';
import { Plus, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string };
}) {
  const q = searchParams.q?.trim();
  const cat = searchParams.cat;
  const items = await prisma.patient.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { mrn: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { cnic: { contains: q } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(cat ? { category: cat as never } : {}),
    },
    orderBy: { registeredAt: 'desc' },
    take: 50,
  });

  const total = await prisma.patient.count();

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={`${total.toLocaleString()} total · showing ${items.length}`}
        actions={
          <Link href="/patients/new" className="btn-primary">
            <UserPlus className="w-4 h-4" /> New patient
          </Link>
        }
      />

      <form className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name, MRN, phone, CNIC, email…"
          className="input flex-1 min-w-[240px]"
        />
        <select name="cat" defaultValue={cat ?? ''} className="input w-44">
          <option value="">All categories</option>
          <option value="NEW">New</option>
          <option value="REPEAT">Repeat</option>
          <option value="CORPORATE">Corporate</option>
          <option value="GOVT_SCHEME">Govt scheme</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="REFERRED">Referred</option>
        </select>
        <button className="btn-primary">Search</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="table-th">MRN</th>
              <th className="table-th">Patient</th>
              <th className="table-th">Age/Sex</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Category</th>
              <th className="table-th">Registered</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-10 text-ink-subtle">
                  No patients found. <Link className="text-brand-700 underline" href="/patients/new">Register one</Link>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="hover:bg-surface-muted/40">
                  <td className="table-td font-mono text-xs">{p.mrn}</td>
                  <td className="table-td">
                    <Link href={`/patients/${p.id}`} className="font-medium hover:underline">
                      {p.fullName}
                    </Link>
                    {p.cnic && <div className="text-xs text-ink-subtle">CNIC: {p.cnic}</div>}
                  </td>
                  <td className="table-td">{calcAge(p.dob)} · {p.gender[0]}</td>
                  <td className="table-td">{p.phone}</td>
                  <td className="table-td"><span className="badge-slate">{p.category.replace(/_/g, ' ')}</span></td>
                  <td className="table-td">{formatDate(p.registeredAt)}</td>
                  <td className="table-td text-right">
                    <Link href={`/patients/${p.id}`} className="text-brand-700 hover:underline">Open</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
