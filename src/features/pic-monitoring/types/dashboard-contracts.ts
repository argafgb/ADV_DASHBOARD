import { z } from "zod";

export const dashboardProjectsSchema = z
  .array(z.record(z.string(), z.unknown()).readonly())
  .readonly();

export const projectAuditLogSchema = z
  .object({
    id: z.string(),
    notion_page_id: z.string(),
    ticket: z.string().nullable(),
    project_name: z.string().nullable(),
    change_category: z.string(),
    old_value: z.string().nullable(),
    new_value: z.string().nullable(),
    created_at: z.string(),
  })
  .readonly();

export const syncRunSchema = z
  .object({
    id: z.string(),
    sync_type: z.string(),
    status: z.string(),
    records_processed: z.number().int().nonnegative(),
    message: z.string(),
    created_at: z.string(),
  })
  .readonly();

export const syncLogsResponseSchema = z
  .object({
    auditLogs: z.array(projectAuditLogSchema).readonly(),
    syncRuns: z.array(syncRunSchema).readonly(),
  })
  .readonly();

export type DashboardProject = z.infer<typeof dashboardProjectsSchema>[number];
export type ProjectAuditLog = z.infer<typeof projectAuditLogSchema>;
export type SyncLogResponse = z.infer<typeof syncLogsResponseSchema>;
export type SyncRun = z.infer<typeof syncRunSchema>;
