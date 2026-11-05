import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { sql } from "@/lib/db";
import { PIC_DASHBOARD_PROJECTS_CACHE_TAG } from "./cache-tags";
import type {
  DashboardProject,
  ProjectAuditLog,
  SyncLogResponse,
  SyncRun,
} from "../types/dashboard-contracts";

const jsonObjectSchema = z.record(z.string(), z.unknown());

const picMonitoringRowSchema = z.object({
  notion_page_id: z.string(),
  ticket: z.string().nullable().optional(),
  project_name: z.string().nullable().optional(),
  owner_name: z.string().nullable().optional(),
  owner_division: z.string().nullable().optional(),
  pic_name: z.string().nullable().optional(),
  pic_short_name: z.string().nullable().optional(),
  project_type: z.string().nullable().optional(),
  last_status: z.string().nullable().optional(),
  milestone: z.string().nullable().optional(),
  status_pma: z.string().nullable().optional(),
  management_priority: z.string().nullable().optional(),
  report_year: z.number().int().nullable().optional(),
  report_period: z.string().nullable().optional(),
  quarter: z.string().nullable().optional(),
  created_time: z.union([z.date(), z.string()]).nullable().optional(),
  last_edited_time: z.union([z.date(), z.string()]).nullable().optional(),
  data_quality_flags: z.array(z.string()).nullable().optional().default([]),
  cleansed_data: jsonObjectSchema.nullable().optional().default({}),
  last_synced: z.union([z.date(), z.string()]).nullable().optional(),
});

const syncSnapshotSchema = z.object({
  records_processed: z.number().int().nonnegative(),
  last_synced: z.union([z.date(), z.string()]).nullable(),
});

function toIso(val: Date | string | null | undefined): string | null {
  if (!val) return null;
  return val instanceof Date ? val.toISOString() : String(val);
}

function formatProjectRow(
  row: z.infer<typeof picMonitoringRowSchema>,
): DashboardProject {
  const cleansed = row.cleansed_data ?? {};
  const createdIso = toIso(row.created_time);
  const editedIso = toIso(row.last_edited_time);
  const syncedIso = toIso(row.last_synced) ?? editedIso ?? createdIso ?? new Date().toISOString();

  return {
    Ticket: row.ticket ?? null,
    "Project Name": row.project_name ?? null,
    "Owner Name": row.owner_name ?? null,
    "Owner Div": row.owner_division ?? null,
    "Owner Division": row.owner_division ?? null,
    "PIC Name": row.pic_name ?? null,
    "PIC Short Name": row.pic_short_name ?? null,
    "Type Project": row.project_type ?? null,
    "Last Status": row.last_status ?? null,
    Milestone: row.milestone ?? null,
    "Status PMA": row.status_pma ?? null,
    "Prioritas Mgmt": row.management_priority ?? null,
    Year: row.report_year ?? (cleansed["Year"] as number | null) ?? null,
    Period: row.report_period ?? (cleansed["Period"] as string | null) ?? null,
    Kuartal: row.quarter ?? (cleansed["Kuartal"] as string | null) ?? null,
    "Created time": createdIso,
    "Last edited time": editedIso,
    created_time: createdIso,
    last_edited_time: editedIso,
    ...cleansed,
    cleansed_data: cleansed,
    notion_page_id: row.notion_page_id,
    data_quality_flags: Array.isArray(row.data_quality_flags) ? row.data_quality_flags : [],
    last_synced: syncedIso,
  };
}

let inFlightQuery: Promise<readonly DashboardProject[]> | null = null;
let lastKnownProjects: readonly DashboardProject[] | null = null;

export async function queryDashboardProjects(): Promise<readonly DashboardProject[]> {
  if (inFlightQuery) {
    return inFlightQuery;
  }

  inFlightQuery = (async () => {
    try {
      const rows = await sql`
        select
          notion_page_id,
          ticket,
          project_name,
          owner_name,
          owner_division,
          pic_name,
          pic_short_name,
          project_type,
          last_status,
          milestone,
          status_pma,
          management_priority,
          report_year,
          report_period,
          quarter,
          created_time,
          last_edited_time,
          data_quality_flags,
          cleansed_data,
          last_synced
        from public.pic_monitoring as project
        where project.archived = false and project.in_trash = false
        order by notion_page_id
      `;

      const parsed = z
        .array(picMonitoringRowSchema)
        .parse(rows)
        .map(formatProjectRow);
      lastKnownProjects = parsed;
      return parsed;
    } catch (error) {
      if (lastKnownProjects && lastKnownProjects.length > 0) {
        console.warn(
          "[Dashboard DB] Connection error, serving fallback cache:",
          error,
        );
        return lastKnownProjects;
      }
      throw error;
    } finally {
      inFlightQuery = null;
    }
  })();

  return inFlightQuery;
}

async function getCachedDashboardProjects(): Promise<
  readonly DashboardProject[]
> {
  "use cache";
  cacheTag(PIC_DASHBOARD_PROJECTS_CACHE_TAG);
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  return queryDashboardProjects();
}

export function getDashboardProjects(
  forceRefresh = false,
): Promise<readonly DashboardProject[]> {
  return forceRefresh ? queryDashboardProjects() : getCachedDashboardProjects();
}

export async function getDashboardSyncLogsRaw(): Promise<SyncLogResponse> {
  const rows = await sql`
    select
      count(*)::int as records_processed,
      max(last_synced) as last_synced
    from public.pic_monitoring
    where archived = false and in_trash = false
  `;
  const snapshot = syncSnapshotSchema.parse(rows[0]);

  const auditLogs: readonly ProjectAuditLog[] = [];
  const syncRuns: readonly SyncRun[] = snapshot.last_synced
    ? [
        {
          id: `postgres-${toIso(snapshot.last_synced)}`,
          sync_type: "Cron Worker",
          status: "Success",
          records_processed: snapshot.records_processed,
          message: "Sinkronisasi data terbaru berhasil tersimpan.",
          created_at: toIso(snapshot.last_synced) ?? '',
        },
      ]
    : [];

  return { auditLogs, syncRuns };
}

export async function getDashboardSyncLogs(): Promise<SyncLogResponse> {
  "use cache";
  cacheTag(PIC_DASHBOARD_PROJECTS_CACHE_TAG);
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return getDashboardSyncLogsRaw();
}

export async function getLatestDatabaseTimestamp(): Promise<string | null> {
  try {
    const rows = await sql`
      select
        greatest(
          max(last_edited_time),
          max(last_synced),
          max(created_time)
        ) as latest_time
      from public.pic_monitoring
      where archived = false and in_trash = false
    `;
    const dt = rows[0]?.latest_time;
    if (dt) {
      return dt instanceof Date ? dt.toISOString() : String(dt);
    }
  } catch {
    // fallback
  }
  return null;
}
