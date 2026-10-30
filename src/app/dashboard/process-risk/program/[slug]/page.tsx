export const instant = false;
import { connection } from 'next/server';
import { requirePagePermission } from '@/lib/access/session';
import ProgramDashboard from '@/features/process-risk/components/ProgramDashboard';

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  await requirePagePermission('menu.process-risk.program.view');
  const { slug } = await params;

  return <ProgramDashboard slug={slug} />;
}
