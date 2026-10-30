import 'server-only';

import { unstable_cache } from 'next/cache';
import { sql } from '@/lib/db';
import type { ProcessRiskDashboardData, ProcessRiskRow } from '../types';
import { rowsToWorkplans, summarize } from '../utils/transformers';

async function queryLastSyncedAt(): Promise<string | null> {
  const rows = await sql<{ synced_at: Date | string | null }[]>`
    select max(updated_at) as synced_at
    from public.process_n_risk
  `;
  const syncedAt = rows[0]?.synced_at;
  return syncedAt ? new Date(syncedAt).toISOString() : null;
}

export async function getProcessRiskDashboardDataRaw(): Promise<ProcessRiskDashboardData> {
  const rows = await sql<ProcessRiskRow[]>`
    with latest_sync as (
      select max(updated_at) as synced_at
      from public.process_n_risk
    )
    select
      record.id::text,
      record.name,
      record.program,
      record.category_kerja,
      record.deskripsi,
      record.pic,
      record.no_dokumen_ba,
      record.notion_url,
      record.periode_test_list,
      record.periode_test_month_numbers,
      record.period_mismatch,
      record.file_count,
      to_char(record.tanggal_pelaksanaan_ba, 'YYYY-MM-DD') as tanggal_pelaksanaan_ba,
      record.year as schedule_year,
      record.record_status
    from public.process_n_risk as record
    cross join latest_sync
    where record.updated_at = latest_sync.synced_at
      and record.archived is not true
      and record.in_trash is not true
      and record.name is not null
    order by record.id::bigint
  `;

  const workplans = rowsToWorkplans(rows);

  return {
    workplans,
    programs: summarize(workplans),
    source: 'database',
    recordCount: rows.length,
    undatedCount: rows.filter((row) => row.schedule_year === null).length,
    updatedAt: await queryLastSyncedAt(),
  };
}

export async function getProcessRiskDashboardData(): Promise<ProcessRiskDashboardData> {
  return unstable_cache(
    async () => getProcessRiskDashboardDataRaw(),
    ['process-risk-dashboard-data'],
    {
      revalidate: 300,
      tags: ['process-risk-dashboard-data'],
    },
  )();
}
