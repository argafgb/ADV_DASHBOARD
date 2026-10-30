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
  ticket: z.string().nullable(),
  project_name: z.string().nullable(),
  owner_name: z.string().nullable(),
  owner_division: z.string().nullable(),
  pic_name: z.string().nullable(),
  pic_short_name: z.string().nullable(),
  project_type: z.string().nullable(),
  last_status: z.string().nullable(),
  milestone: z.string().nullable(),
  status_pma: z.string().nullable(),
  management_priority: z.string().nullable(),
  report_year: z.number().int().nullable(),
  report_period: z.string().nullable(),
  quarter: z.string().nullable(),
  created_time: z.date().nullable(),
  last_edited_time: z.date().nullable(),
  data_quality_flags: z.array(z.string()),
  cleansed_data: jsonObjectSchema,
  last_synced: z.date(),
});

const syncSnapshotSchema = z.object({
  records_processed: z.number().int().nonnegative(),
  last_synced: z.date().nullable(),
});

function formatProjectRow(
  row: z.infer<typeof picMonitoringRowSchema>,
): DashboardProject {
  return {
    Ticket: row.ticket,
    "Project Name": row.project_name,
    "Owner Name": row.owner_name,
    "Owner Div": row.owner_division,
    "Owner Division": row.owner_division,
    "PIC Name": row.pic_name,
    "PIC Short Name": row.pic_short_name,
    "Type Project": row.project_type,
    "Last Status": row.last_status,
    Milestone: row.milestone,
    "Status PMA": row.status_pma,
    "Prioritas Mgmt": row.management_priority,
    Year: row.report_year ?? row.cleansed_data["Year"] ?? null,
    Period: row.report_period ?? row.cleansed_data["Period"] ?? null,
    Kuartal: row.quarter ?? row.cleansed_data["Kuartal"] ?? null,
    "Created time": row.created_time?.toISOString() ?? null,
    "Last edited time": row.last_edited_time?.toISOString() ?? null,
    created_time: row.created_time?.toISOString() ?? null,
    last_edited_time: row.last_edited_time?.toISOString() ?? null,
    ...row.cleansed_data,
    cleansed_data: row.cleansed_data,
    notion_page_id: row.notion_page_id,
    data_quality_flags: row.data_quality_flags,
    last_synced: row.last_synced.toISOString(),
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
          id: `postgres-${snapshot.last_synced.toISOString()}`,
          sync_type: "Cron Worker",
          status: "Success",
          records_processed: snapshot.records_processed,
          message: "Sinkronisasi data terbaru berhasil tersimpan.",
          created_at: snapshot.last_synced.toISOString(),
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
