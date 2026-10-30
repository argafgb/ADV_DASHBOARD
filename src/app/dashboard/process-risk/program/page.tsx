export const instant = false;
import { connection } from 'next/server';
import { requirePagePermission } from '@/lib/access/session';
import ProgramDirectory from '@/features/process-risk/components/ProgramDirectory';

export default async function ProcessRiskProgramPage() {
  await connection();
  await requirePagePermission('menu.process-risk.program.view');

  return <ProgramDirectory />;
}
