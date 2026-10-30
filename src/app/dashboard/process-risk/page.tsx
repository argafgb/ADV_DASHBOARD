export const instant = false;
import { connection } from 'next/server';
import { requirePagePermission } from '@/lib/access/session';
import OverviewDashboard from '@/features/process-risk/components/OverviewDashboard';

export default async function ProcessRiskOverviewPage() {
  await connection();
  await requirePagePermission('menu.process-risk.overview.view');

  return <OverviewDashboard />;
}
