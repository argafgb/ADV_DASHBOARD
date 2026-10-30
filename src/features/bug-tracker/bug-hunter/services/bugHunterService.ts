import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  BugFinding,
  FindingCategory,
  FindingSeverity,
  FindingPriority,
  FindingStatus,
  FindingPlatform,
} from "../types/bugHunterTypes";

interface RawBugFindingRow {
  id: string;
  number: number | null;
  finding: string | null;
  category: string | null;
  module: string | null;
  sub_menu: string | null;
  severity: string | null;
  priority: string | null;
  platform: string | null;
  hunter: string | null;
  dev_name: string | null;
  bizdev_name: string | null;
  date_found: string | Date | null;
  doc_realized_date: string | Date | null;
  live_realized_date: string | Date | null;
  status: string | null;
  progress_penyelesaian: string | null;
  progress_qa: string | null;
  last_update: string | null;
  recurring: boolean | null;
  link_menu: string | null;
  link_log_temuan: string | null;
}

function toIsoDate(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function toNumber(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number.isNaN(v) ? null : v;
}

function mapRawRowToBugFinding(r: RawBugFindingRow): BugFinding {
  return {
    id: r.id,
    number: toNumber(r.number),
    finding: r.finding ?? "",
    category: (r.category as FindingCategory | null) ?? null,
    module: r.module,
    subMenu: r.sub_menu,
    severity: (r.severity as FindingSeverity | null) ?? null,
    priority: (r.priority as FindingPriority | null) ?? null,
    platform: (r.platform as FindingPlatform | null) ?? null,
    hunter: r.hunter,
    devName: r.dev_name,
    bizdevName: r.bizdev_name,
    dateFound: toIsoDate(r.date_found),
    docRealizedDate: toIsoDate(r.doc_realized_date),
    liveRealizedDate: toIsoDate(r.live_realized_date),
    status: (r.status as FindingStatus | null) ?? null,
    progressPenyelesaian: r.progress_penyelesaian,
    progressQA: r.progress_qa,
    lastUpdate: r.last_update,
    recurring: r.recurring ?? false,
    linkMenu: r.link_menu,
    linkLogTemuan: r.link_log_temuan,
  };
}

/**
 * Fetch bug hunter findings scoped to the global year/month filter (same
 * semantics as the issues-data service): period is derived from `date_found`.
 */
export async function getBugHunterFindingsRaw(
  year: string = "ALL",
  month: string = "ALL",
): Promise<BugFinding[]> {
  const targetYear = year !== "ALL" ? parseInt(year, 10) : null;
  const monthInfo = parseMonthFilter(month);

  const rows = await sql<RawBugFindingRow[]>`
    SELECT
      id, number, finding, category, module, sub_menu, severity, priority,
      platform, hunter, dev_name, bizdev_name, date_found, doc_realized_date,
      live_realized_date, status, progress_penyelesaian, progress_qa,
      last_update, recurring, link_menu, link_log_temuan
    FROM bug_tracker.bug_hunter_findings
    WHERE TRUE
      ${targetYear !== null && !isNaN(targetYear) ? sql`AND EXTRACT(YEAR FROM date_found) = ${targetYear}` : sql``}
      ${!monthInfo.isAll && monthInfo.months.length > 0 ? sql`AND EXTRACT(MONTH FROM date_found) = ANY(${monthInfo.months})` : sql``}
    ORDER BY date_found DESC NULLS LAST, number DESC NULLS LAST
  `;

  return rows.map(mapRawRowToBugFinding);
}

export async function getBugHunterFindingsData(
  year: string = "ALL",
  month: string = "ALL",
): Promise<BugFinding[]> {
  return unstable_cache(
    () => getBugHunterFindingsRaw(year, month),
    ["bug-hunter-findings-data-v2", year, month],
    { revalidate: 300, tags: ["bug-hunter"] },
  )();
}
