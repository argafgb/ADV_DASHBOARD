import {
  dashboardProjectsSchema,
  syncLogsResponseSchema,
  type DashboardProject,
  type SyncLogResponse,
} from "../types/dashboard-contracts";

let projectsRequest: Promise<readonly DashboardProject[]> | undefined;
let projectsRequestIsForced = false;

export async function fetchDashboardProjects(
  forceRefresh = false,
): Promise<readonly DashboardProject[]> {
  if (projectsRequest && (projectsRequestIsForced || !forceRefresh)) {
    return projectsRequest;
  }

  const url = forceRefresh ? "/api/pic-monitoring/projects?refresh=1" : "/api/pic-monitoring/projects";
  const request = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((payload) => dashboardProjectsSchema.parse(payload))
    .finally(() => {
      if (projectsRequest !== request) return;
      projectsRequest = undefined;
      projectsRequestIsForced = false;
    });

  projectsRequest = request;
  projectsRequestIsForced = forceRefresh;

  return request;
}

export async function fetchDashboardSyncLogs(): Promise<SyncLogResponse> {
  const res = await fetch("/api/pic-monitoring/sync-logs");
  if (!res.ok) {
    throw new Error(`Failed to fetch sync logs: ${res.statusText}`);
  }
  const payload = await res.json();
  return syncLogsResponseSchema.parse(payload);
}

export function getClientErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
