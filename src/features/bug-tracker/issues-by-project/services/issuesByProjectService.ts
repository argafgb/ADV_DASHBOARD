import "server-only";

import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { getPeriodLabel } from "@/features/bug-tracker/overview/services/overviewService";
import { fetchIssueItems } from "@/features/bug-tracker/issues-data/services/issuesDataService";
import { IssuesByProjectPayload } from "../types/issuesByProject";

interface ClosedMonthCount {
  finish_year: number | string;
  finish_month: number | string;
  records: number | string;
}

async function fetchClosedMonthCounts(
  targetYear: number | null,
  prevYear: number | null,
  project: string,
  role: string,
): Promise<ClosedMonthCount[]> {
  const cleanProject =
    project && project !== "ALL" && project !== "All projects" ? project : null;
  const cleanRole = role && role !== "ALL" && role !== "All Role" ? role : null;
  const relevantYears = [targetYear, prevYear].filter(
    (value): value is number => value !== null && !isNaN(value),
  );

  return sql<ClosedMonthCount[]>`
    SELECT
      EXTRACT(YEAR FROM finish_date)::int AS finish_year,
      EXTRACT(MONTH FROM finish_date)::int AS finish_month,
      COUNT(*)::int AS records
    FROM bug_tracker.master_list_bugs
    WHERE finish_date IS NOT NULL
      ${relevantYears.length > 0 ? sql`AND EXTRACT(YEAR FROM finish_date)::int = ANY(${relevantYears})` : sql``}
      ${cleanProject !== null ? sql`AND project_name = ${cleanProject}` : sql``}
      ${cleanRole !== null ? sql`AND section_name = ${cleanRole}` : sql``}
    GROUP BY 1, 2
    ORDER BY 1, 2
  `;
}

export async function fetchIssuesByProjectPayload(
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
): Promise<IssuesByProjectPayload> {
  // Findings follow Periode, while closed counts follow Finish Date even when
  // the record was found in another year. Month scoping is applied below.
  const targetYear = year !== "ALL" ? parseInt(year, 10) : null;
  const prevYear = targetYear !== null ? targetYear - 1 : null;
  const [yearItems, prevItems, closedMonthCounts] = await Promise.all([
    fetchIssueItems(year, "ALL", project, role),
    prevYear !== null && !isNaN(prevYear)
      ? fetchIssueItems(String(prevYear), "ALL", project, role)
      : Promise.resolve([]),
    fetchClosedMonthCounts(targetYear, prevYear, project, role),
  ]);

  const monthInfo = parseMonthFilter(month);
  const inMonthScope = (m: number) =>
    monthInfo.isAll || monthInfo.months.includes(m);
  const items = monthInfo.isAll
    ? yearItems
    : yearItems.filter((r) => r.month !== null && inMonthScope(r.month));

  const foundPerMonth = Array.from({ length: 12 }, () => 0);
  const closedPerMonth = Array.from({ length: 12 }, () => 0);

  yearItems.forEach((r) => {
    if (
      r.month !== null &&
      r.month >= 1 &&
      r.month <= 12 &&
      inMonthScope(r.month)
    ) {
      foundPerMonth[r.month - 1]++;
    }
  });

  // Pembanding tahun sebelumnya, dihitung dengan aturan identik supaya kartu
  // berdampingan benar-benar apple-to-apple.
  const foundPerMonthPrev = Array.from({ length: 12 }, () => 0);
  const closedPerMonthPrev = Array.from({ length: 12 }, () => 0);
  prevItems.forEach((r) => {
    if (
      r.month !== null &&
      r.month >= 1 &&
      r.month <= 12 &&
      inMonthScope(r.month)
    ) {
      foundPerMonthPrev[r.month - 1]++;
    }
  });

  closedMonthCounts.forEach((row) => {
    const finishYear = Number(row.finish_year);
    const finishMonth = Number(row.finish_month);
    const records = Number(row.records);
    if (finishMonth < 1 || finishMonth > 12 || !inMonthScope(finishMonth)) {
      return;
    }
    if (targetYear === null || finishYear === targetYear) {
      closedPerMonth[finishMonth - 1] += records;
    }
    if (prevYear !== null && finishYear === prevYear) {
      closedPerMonthPrev[finishMonth - 1] += records;
    }
  });

  const hasPrev =
    foundPerMonthPrev.some((n) => n > 0) ||
    closedPerMonthPrev.some((n) => n > 0);

  const prevScoped = monthInfo.isAll
    ? prevItems
    : prevItems.filter((r) => r.month !== null && inMonthScope(r.month));

  return {
    items,
    prevItems: hasPrev ? prevScoped : [],
    foundPerMonth,
    closedPerMonth,
    foundPerMonthPrev: hasPrev ? foundPerMonthPrev : null,
    closedPerMonthPrev: hasPrev ? closedPerMonthPrev : null,
    prevYear: hasPrev ? prevYear : null,
    periodLabel: getPeriodLabel(year, month),
  };
}

// Always read the latest PostgreSQL snapshot on navigation/router refresh.
// Caching each global-filter combination independently can leave "All Projects"
// stale while a project-specific filter already shows newly synchronized rows.
export const getCachedIssuesByProjectData = (
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
) => fetchIssuesByProjectPayload(year, month, project, role);
