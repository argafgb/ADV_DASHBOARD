import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  normalizeSimpleStatus,
  normalizeSeverity,
  calculatePenaltyWeight,
  displayStage,
  normalizeIssueType,
  normalizeSectionName,
  getPeriodLabel,
  RawBugRecord,
} from "@/features/bug-tracker/overview/services/overviewService";
import { IssueItem, IssuesDataPayload, FsdMark } from "../types/issuesData";
import { dayDiff } from "../utils/issuesDataUtils";

interface RawIssueRow extends RawBugRecord {
  no: number | string | null;
  name: string | null;
  url: string | null;
  screenshot_url: string | null;
  sit_realized_date: string | Date | null;
  time_input: string | Date | null;
  time_edit: string | Date | null;
}

function toIsoDate(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function toIsoMinute(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 16);
  return String(v).slice(0, 16);
}

export function mapRawRowToIssueItem(r: RawIssueRow): IssueItem {
  const disc = toIsoDate(r.discovery_date);
  const finish = toIsoDate(r.finish_date);
  const rawDays = dayDiff(disc, finish);
  const fsd: FsdMark =
    r.include_in_fsd === true
      ? "Ya"
      : r.include_in_fsd === false
        ? "Tidak"
        : "-";

  return {
    id: r.id,
    no: r.no !== null && r.no !== undefined ? Number(r.no) : null,
    name: r.name?.trim() || null,
    url: r.url?.trim() || null,
    screenshotUrl: r.screenshot_url?.trim() || null,
    project: r.project_name?.trim() || "-",
    pic: r.pic_name?.trim() || "-",
    dev: r.dev_name?.trim() || "-",
    section: normalizeSectionName(r.section_name),
    stage: displayStage(r.testing_type),
    type: normalizeIssueType(r.issue_type),
    sev: normalizeSeverity(r.severity),
    weight: calculatePenaltyWeight(r.severity),
    status: normalizeSimpleStatus(r.status_dev),
    statusPic: r.status_pic?.trim() || "-",
    remarks: r.remarks?.trim() || "-",
    resp: r.dev_response?.trim() || "",
    fsd,
    disc,
    start: toIsoDate(r.start_date),
    finish,
    sitRealized: toIsoDate(r.sit_realized_date),
    timeInput: toIsoMinute(r.time_input),
    timeEdit: toIsoMinute(r.time_edit),
    month: r.month !== null && r.month !== undefined ? Number(r.month) : null,
    year: r.year !== null && r.year !== undefined ? Number(r.year) : null,
    quarter:
      r.quarter !== null && r.quarter !== undefined ? Number(r.quarter) : null,
    periode: r.periode,
    days: rawDays === null || rawDays < 0 ? null : rawDays,
  };
}

export async function fetchIssueItems(
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
): Promise<IssueItem[]> {
  const targetYear = year !== "ALL" ? parseInt(year, 10) : null;
  const monthFilterInfo = parseMonthFilter(month);

  const cleanProject =
    project && project !== "ALL" && project !== "All projects" ? project : null;
  const cleanRole = role && role !== "ALL" && role !== "All Role" ? role : null;

  const records = await sql<RawIssueRow[]>`
    SELECT
      id, no, name, url, screenshot_url,
      year,
      month,
      quarter, periode,
      project_name, section_name, pic_name, dev_name, status_pic, status_dev,
      severity, issue_type, testing_type, include_in_fsd, remarks, dev_response,
      discovery_date, start_date, finish_date, sit_realized_date,
      time_input, time_edit
    FROM bug_tracker.master_list_bugs
    WHERE NULLIF(TRIM(periode), '') IS NOT NULL
      ${targetYear !== null && !isNaN(targetYear) ? sql`AND year = ${targetYear}` : sql``}
      ${!monthFilterInfo.isAll && monthFilterInfo.months.length > 0 ? sql`AND month = ANY(${monthFilterInfo.months})` : sql``}
      ${cleanProject !== null ? sql`AND project_name = ${cleanProject}` : sql``}
      ${cleanRole !== null ? sql`AND section_name = ${cleanRole}` : sql``}
    ORDER BY discovery_date DESC NULLS LAST, time_input DESC NULLS LAST
  `;

  return records.map(mapRawRowToIssueItem);
}

export async function fetchIssuesDataPayload(
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
): Promise<IssuesDataPayload> {
  const prevYear = year !== "ALL" ? parseInt(year, 10) - 1 : null;
  const [items, prevItems] = await Promise.all([
    fetchIssueItems(year, month, project, role),
    prevYear !== null && !isNaN(prevYear)
      ? fetchIssueItems(String(prevYear), month, project, role)
      : Promise.resolve([]),
  ]);
  return {
    items,
    prevItems,
    prevYear: prevItems.length ? prevYear : null,
    periodLabel: getPeriodLabel(year, month),
  };
}

export const getCachedIssuesData = (
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
) =>
  unstable_cache(
    () => fetchIssuesDataPayload(year, month, project, role),
    ["issues-data-v6", year, month, project, role],
    { tags: ["issues-data"], revalidate: 300 },
  )();
