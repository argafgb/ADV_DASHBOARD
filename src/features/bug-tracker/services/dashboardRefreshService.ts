import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";

interface LastUpdatedRow {
  last_updated: Date | string | null;
}

async function getDashboardRefreshedAtRaw(): Promise<string | null> {
  const start = performance.now();

  try {
    // Jam yang dilaporkan adalah data terbaru yang masuk dari seluruh tabel
    // Bug Tracker (sync_status, master_list_bugs, qa_tasks, dan bug_hunter_findings).
    // master_list_bugs memakai time_edit/time_input (timestamp tanpa tz berisi WIB),
    // sedangkan qa_tasks dan bug_hunter_findings memiliki kolom synced_at (timestamptz).
    const rows = await sql<LastUpdatedRow[]>`
      SELECT GREATEST(
        (SELECT synced_at FROM bug_tracker.sync_status WHERE key = 'last_sync'),
        (SELECT MAX(GREATEST(time_edit, time_input)) AT TIME ZONE 'Asia/Jakarta' FROM bug_tracker.master_list_bugs),
        (SELECT MAX(synced_at) FROM bug_tracker.qa_tasks),
        (SELECT MAX(synced_at) FROM bug_tracker.bug_hunter_findings)
      ) AS last_updated;
    `;

    const lastSynced = rows[0]?.last_updated ?? null;
    if (lastSynced === null) return null;

    const parsed =
      lastSynced instanceof Date ? lastSynced : new Date(lastSynced);
    if (Number.isNaN(parsed.getTime())) return null;

    console.log(
      `[Database Query] getDashboardRefreshedAt completed in ${(performance.now() - start).toFixed(2)}ms.`,
    );
    return parsed.toISOString();
  } catch (err) {
    console.warn(
      "[Database Query] Failed to fetch master_list_bugs last updated timestamp:",
      err,
    );
    return null;
  }
}

/**
 * Cron n8n menulis berkala, tetapi cache dijaga pendek supaya jam yang tampil
 * tidak tertinggal jauh dari data baru yang barusan masuk.
 */
const getCachedDashboardRefreshedAt = unstable_cache(
  getDashboardRefreshedAtRaw,
  ["bug-tracker-dashboard-refreshed-at"],
  {
    revalidate: 60,
    tags: [
      "overview",
      "issues-data",
      "issues-by-project",
      "dashboard-refreshed-at",
      "qa-tasks",
      "bug-hunter",
    ],
  },
);

export async function getDashboardRefreshedAt(): Promise<string | null> {
  try {
    return await getCachedDashboardRefreshedAt();
  } catch (error) {
    console.error("Failed to fetch dashboard refreshed-at timestamp:", error);
    return null;
  }
}
