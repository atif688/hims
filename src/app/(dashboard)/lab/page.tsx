import { LabRadList } from '@/components/lab/lab-rad-list';

export const dynamic = 'force-dynamic';

export default async function LabPage({ searchParams }: { searchParams: { status?: string } }) {
  return <LabRadList kind="LABORATORY" title="Laboratory" status={searchParams.status} basePath="/lab" />;
}
