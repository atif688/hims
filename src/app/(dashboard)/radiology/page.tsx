import { LabRadList } from '@/components/lab/lab-rad-list';

export const dynamic = 'force-dynamic';

export default async function RadiologyPage({ searchParams }: { searchParams: { status?: string } }) {
  return <LabRadList kind="RADIOLOGY" title="Radiology" status={searchParams.status} basePath="/radiology" />;
}
