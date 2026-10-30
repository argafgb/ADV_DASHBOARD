import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  OverviewFilterParams,
  FullOverviewDashboardData,
  Row1OverviewData,
  Row2OverviewData,
  Row3OverviewData,
  BugBreakdownData,
  DeltaInfo,
  SeverityType,
  SeverityKey,
  SimpleStatus,
  IssueStatus,
  IssueType,
  MatrixRole,
  MatrixType,
  DistributionSeg,
  PersonDetailData,
  AuditMatrixRow,
  StageChip,
} from "../types/overviewTypes";

// ----------------------------------------------------------------------
// SHARED CONSTANTS (client-safe module, re-exported for compatibility)
// ----------------------------------------------------------------------
import {
  SEVERITY_WEIGHTS,
  SEVERITY_ORDER,
  SEVERITY_COLORS,
  SEVERITY_DESC,
  STAGE_LABELS,
} from "./severityConstants";

export {
  SEVERITY_WEIGHTS,
  SEVERITY_ORDER,
  SEVERITY_COLORS,
  SEVERITY_DESC,
  STAGE_LABELS,
};

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// ----------------------------------------------------------------------
// NORMALIZERS
// ----------------------------------------------------------------------
export function normalizeStatusDev(
  rawStatus: string | null | undefined,
): IssueStatus {
  if (!rawStatus) return "Unmapped";
  const s = rawStatus.trim().toLowerCase();
  if (
    s.startsWith("done") ||
    s.startsWith("completed") ||
    s.startsWith("don")
  ) {
    return "Done";
  }
  if (s.includes("on progress")) {
    return "On progress";
  }
  if (s.includes("on queue")) {
    return "On queue";
  }
  if (s.includes("pending")) {
    return "Pending";
  }
  return "Unmapped";
}

/** Collapse messy status_dev free text into the 3-status model used by the UI. */
export function normalizeSimpleStatus(
  rawStatus: string | null | undefined,
): SimpleStatus {
  const st = normalizeStatusDev(rawStatus);
  if (st === "Done") return "Done";
  if (st === "On progress") return "On Progress";
  return "Open";
}

export function normalizeSeverity(
  severity: string | null | undefined,
): SeverityKey {
  if (!severity) return "Unclassified";
  const s = severity.trim();
  if ((SEVERITY_ORDER as string[]).includes(s)) return s as SeverityType;
  return "Unclassified";
}

export function calculatePenaltyWeight(
  severity: string | null | undefined,
): number {
  return SEVERITY_WEIGHTS[normalizeSeverity(severity)];
}

/** Map DB testing_type to display stage label. */
export function displayStage(
  testingType: string | null | undefined,
): (typeof STAGE_LABELS)[number] {
  if (testingType === "Temuan After Live") return "Live on Monitoring";
  if (testingType === "SIT") return "SIT";
  if (testingType === "Change Request") return "Change Request";
  return "Testing PIC";
}

/** Classify only from the Notion `Type (Bug/Change Request)` value. */
export function normalizeIssueType(
  rawIssueType: string | null | undefined,
): IssueType {
  const value = rawIssueType?.trim().toLowerCase().replace(/\s+/g, " ") || "";
  if (value === "bug") return "Bug";
  if (value === "change request") return "CR";
  return "Unclassified";
}

export function isBugRecord(r: RawBugRecord): boolean {
  return normalizeIssueType(r.issue_type) === "Bug";
}

export function isCrRecord(r: RawBugRecord): boolean {
  return normalizeIssueType(r.issue_type) === "CR";
}

export function normalizeSectionName(
  rawSection: string | null | undefined,
): "PIC Project" | "Bizdev" | "Unclassified" {
  const value = rawSection?.trim().toLowerCase().replace(/\s+/g, " ") || "";
  if (value === "pic project") return "PIC Project";
  if (value === "bizdev") return "Bizdev";
  return "Unclassified";
}

function sectionOf(r: RawBugRecord): "PIC Project" | "Bizdev" | "Unclassified" {
  return normalizeSectionName(r.section_name);
}

/** Handling duration in days (discovery -> finish). Negative or incomplete = null. */
export function handlingDays(r: RawBugRecord): number | null {
  if (!r.discovery_date || !r.finish_date) return null;
  const a = new Date(r.discovery_date);
  const b = new Date(r.finish_date);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  const d = Math.round((b.getTime() - a.getTime()) / 86400000);
  return d < 0 ? null : d;
}

// ----------------------------------------------------------------------
// RAW DATA FETCH
// ----------------------------------------------------------------------
export interface RawBugRecord {
  id: string;
  year: number | null;
  month: number | null;
  quarter: number | null;
  periode: string | null;
  project_name: string | null;
  section_name: string | null;
  pic_name: string | null;
  dev_name: string | null;
  status_pic: string | null;
  status_dev: string | null;
  severity: string | null;
  issue_type: string | null;
  testing_type: string | null;
  include_in_fsd: boolean | null;
  remarks: string | null;
  dev_response: string | null;
  discovery_date: string | null;
  start_date?: string | null;
  finish_date?: string | null;
}

export async function fetchRawBugTrackerData(
  params: OverviewFilterParams,
): Promise<RawBugRecord[]> {
  const { year, month, project, role } = params;

  const targetYear = year !== "ALL" ? parseInt(year, 10) : null;
  const monthFilterInfo = parseMonthFilter(month);

  const cleanProject =
    project && project !== "ALL" && project !== "All projects" ? project : null;
  const cleanRole = role && role !== "ALL" && role !== "All Role" ? role : null;

  const records = await sql<RawBugRecord[]>`
    SELECT
      id,
      year,
      month,
      quarter, periode, project_name, section_name,
      pic_name, dev_name, status_pic, status_dev, severity, issue_type,
      testing_type, include_in_fsd, remarks, dev_response, discovery_date,
      start_date, finish_date
    FROM bug_tracker.master_list_bugs
    WHERE NULLIF(TRIM(periode), '') IS NOT NULL
      ${targetYear !== null && !isNaN(targetYear) ? sql`AND year = ${targetYear}` : sql``}
      ${!monthFilterInfo.isAll && monthFilterInfo.months.length > 0 ? sql`AND month = ANY(${monthFilterInfo.months})` : sql``}
      ${cleanProject !== null ? sql`AND project_name = ${cleanProject}` : sql``}
      ${cleanRole !== null ? sql`AND section_name = ${cleanRole}` : sql``}
  `;

  return records;
}

/** Year-over-year comparison window: same month range, previous year —
    seragam dengan dashboard lain (mis. Des 2025 dibanding Des 2024). */
async function fetchPrevPeriodRecords(
  params: OverviewFilterParams,
): Promise<RawBugRecord[]> {
  const targetYear =
    params.year !== "ALL"
      ? parseInt(params.year, 10)
      : new Date().getFullYear();

  return fetchRawBugTrackerData({
    ...params,
    year: String(targetYear - 1),
  });
}

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------
function makeDelta(
  cur: number,
  prv: number,
  higherIsBetter: boolean | null,
): DeltaInfo {
  if (!prv) return { show: false, text: "", tone: "neutral" };
  const pct = Math.round(((cur - prv) / prv) * 100);
  const text = (pct > 0 ? "+" : "") + pct + "%";
  const direction = pct > 0 ? "up" : pct < 0 ? "down" : "flat";

  if (higherIsBetter === null || pct === 0) {
    return { show: true, text, tone: "neutral", direction };
  }
  const isGood = higherIsBetter ? pct > 0 : pct < 0;
  return { show: true, text, tone: isGood ? "good" : "bad", direction };
}

export function getPeriodLabel(year: string, month: string): string {
  const info = parseMonthFilter(month);
  if (info.isAll) return `Semua bulan ${year}`;
  if (info.startMonth === info.endMonth) {
    return `${MONTH_NAMES_ID[info.startMonth - 1]} ${year}`;
  }
  return `${MONTH_NAMES_ID[info.startMonth - 1]} – ${MONTH_NAMES_ID[info.endMonth - 1]} ${year}`;
}

/** Bar pct like the standalone: minimum 3% when non-zero for visibility. */
function barPct(n: number, total: number, min = 3): number {
  if (!n) return 0;
  return Math.max(min, Math.round((n / Math.max(1, total)) * 100));
}

interface PersonAgg {
  name: string;
  isDev: boolean;
  section: "PIC Project" | "Bizdev" | "Unclassified";
  n: number;
  score: number;
  sev: Partial<Record<SeverityKey, number>>;
  days: number[];
  projects: Record<string, number>;
  done: number;
}

/** Aggregate person-level stats (dev OR pic match) for the person detail modal. */
function buildPersonDetails(
  scoped: RawBugRecord[],
): Record<string, PersonDetailData> {
  const map: Record<string, PersonAgg> = {};

  const touch = (
    name: string | null | undefined,
    r: RawBugRecord,
    asDev: boolean,
  ) => {
    const key = name?.trim();
    if (!key || key === "-") return;
    const a =
      map[key] ||
      (map[key] = {
        name: key,
        isDev: false,
        section: sectionOf(r),
        n: 0,
        score: 0,
        sev: {},
        days: [],
        projects: {},
        done: 0,
      });
    if (asDev) a.isDev = true;
    a.n += 1;
    const sev = normalizeSeverity(r.severity);
    a.score += SEVERITY_WEIGHTS[sev];
    a.sev[sev] = (a.sev[sev] || 0) + 1;
    const proj = r.project_name?.trim() || "Tanpa project";
    a.projects[proj] = (a.projects[proj] || 0) + 1;
    if (normalizeSimpleStatus(r.status_dev) === "Done") a.done += 1;
    const d = handlingDays(r);
    if (d !== null) a.days.push(d);
  };

  scoped.forEach((r) => {
    const dev = r.dev_name?.trim();
    const pic = r.pic_name?.trim();
    if (dev && dev !== "-") touch(dev, r, true);
    // avoid double count when dev and pic are the same person
    if (pic && pic !== "-" && pic !== dev && sectionOf(r) !== "Unclassified") {
      touch(pic, r, false);
    }
  });

  const result: Record<string, PersonDetailData> = {};
  Object.values(map).forEach((a) => {
    const maxSev = Math.max(1, ...SEVERITY_ORDER.map((k) => a.sev[k] || 0));
    const role: MatrixRole = a.isDev
      ? "Developer"
      : a.section === "Bizdev"
        ? "Bizdev"
        : "PIC Project";
    result[a.name] = {
      name: a.name,
      role,
      findings: a.n,
      projectCount: Object.keys(a.projects).length,
      penalty: a.score,
      avgDays: a.days.length
        ? Math.round(a.days.reduce((x, y) => x + y, 0) / a.days.length)
        : null,
      doneCount: a.done,
      sevMix: SEVERITY_ORDER.map((k) => {
        const n = a.sev[k] || 0;
        return {
          label: k,
          count: n,
          pct: n ? Math.max(3, Math.round((n / maxSev) * 100)) : 0,
          color: SEVERITY_COLORS[k],
        };
      }),
      topProjects: Object.keys(a.projects)
        .sort((x, y) => a.projects[y] - a.projects[x])
        .slice(0, 6)
        .map((k) => ({ name: k, count: a.projects[k] })),
    };
  });
  return result;
}

// ----------------------------------------------------------------------
// ROW 1: KPI cards + stage chips + bug breakdown modal + person details
// ----------------------------------------------------------------------
export async function fetchRow1Raw(
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
): Promise<Row1OverviewData> {
  const params: OverviewFilterParams = { year, month, project, role };
  // Semua KPI Row 1 memakai scope filter global yang sama. Pembanding YoY
  // menggunakan tahun sebelumnya dengan month/project/role yang identik agar
  // angka kartu, delta, dan halaman Comparison tidak saling berbeda.
  const [scoped, prevRecords] = await Promise.all([
    fetchRawBugTrackerData(params),
    fetchPrevPeriodRecords(params),
  ]);

  const bugs = scoped.filter(isBugRecord);
  const crs = scoped.filter(isCrRecord);

  const penaltyOf = (rs: RawBugRecord[]) =>
    rs.reduce((acc, r) => acc + calculatePenaltyWeight(r.severity), 0);

  const curFindings = scoped.length;
  const curBug = bugs.length;
  const curCr = crs.length;
  const curPen = penaltyOf(scoped);

  const prvFindings = prevRecords.length;
  const prvBug = prevRecords.filter(isBugRecord).length;
  const prvCr = prevRecords.filter(isCrRecord).length;
  const prvPen = penaltyOf(prevRecords);

  // Mini chart YoY per kartu KPI — hanya bila tahun pembanding ada datanya.
  const curYearNum =
    year !== "ALL" ? parseInt(year, 10) : new Date().getFullYear();
  const yoy = (prev: number, cur: number) =>
    prev > 0
      ? {
          prevYear: String(curYearNum - 1),
          curYear: String(curYearNum),
          prev,
          cur,
        }
      : null;

  const findingsYoY = yoy(prvFindings, curFindings);
  const bugYoY = yoy(prvBug, curBug);
  const crYoY = yoy(prvCr, curCr);
  const penaltyYoY = yoy(prvPen, curPen);

  // Stage chips on "Total bug" card
  const bugStageLabels = [
    "Testing PIC",
    "SIT",
    "Live on Monitoring",
    "Change Request",
  ] as const;
  const stageChips: StageChip[] = bugStageLabels.map((label) => {
    const n = bugs.filter((r) => displayStage(r.testing_type) === label).length;
    return { label, count: n, pct: barPct(n, bugs.length) };
  });

  // Bug breakdown modal
  const bugMax = Math.max(1, bugs.length);
  const stageCards = bugStageLabels.map((label) => {
    const n = bugs.filter((r) => displayStage(r.testing_type) === label).length;
    return { label, count: n, pct: barPct(n, bugMax) };
  });

  const severityRows = SEVERITY_ORDER.map((k) => {
    const n = bugs.filter((r) => normalizeSeverity(r.severity) === k).length;
    return {
      label: k,
      count: n,
      pct: barPct(n, bugMax),
      color: SEVERITY_COLORS[k],
    };
  });

  const statusRows = (["Done", "On Progress", "Open"] as SimpleStatus[]).map(
    (st) => {
      const n = bugs.filter(
        (r) => normalizeSimpleStatus(r.status_dev) === st,
      ).length;
      return { label: st, count: n, pct: barPct(n, bugMax) };
    },
  );

  const contributorMap: Record<
    string,
    { name: string; n: number; sev: Partial<Record<SeverityKey, number>> }
  > = {};
  bugs.forEach((r) => {
    const name = r.dev_name?.trim();
    if (!name || name === "-") return;
    const a =
      contributorMap[name] || (contributorMap[name] = { name, n: 0, sev: {} });
    a.n += 1;
    const sev = normalizeSeverity(r.severity);
    a.sev[sev] = (a.sev[sev] || 0) + 1;
  });
  const topContributors = Object.values(contributorMap)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((d) => ({
      name: d.name,
      bugCount: d.n,
      criticalCount: d.sev.Critical || 0,
      chips: (["Critical", "Major", "Minor"] as SeverityType[]).map((k) => ({
        label: k,
        count: d.sev[k] || 0,
      })),
    }));

  const bugModalData: BugBreakdownData = {
    totalBugs: bugs.length,
    stageCards,
    severityRows,
    statusRows,
    topContributors,
  };

  // Chip delta mengikuti angka chart YoY (setahun vs setahun) agar konsisten.
  return {
    findings: {
      count: curFindings,
      delta: makeDelta(curFindings, prvFindings, null),
    },
    findingsYoY,
    bug: {
      count: curBug,
      delta: makeDelta(curBug, prvBug, false),
    },
    bugYoY,
    cr: { count: curCr, delta: makeDelta(curCr, prvCr, false) },
    crYoY,
    penalty: {
      count: curPen,
      delta: makeDelta(curPen, prvPen, false),
    },
    penaltyYoY,
    stageChips,
    periodLabel: getPeriodLabel(year, month),
    bugModalData,
    personDetails: buildPersonDetails(scoped),
  };
}

// ----------------------------------------------------------------------
// ROW 2: Finding source + FSD coverage + Personnel & severity matrix
// ----------------------------------------------------------------------
export async function fetchRow2Raw(
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
  mtRole: MatrixRole = "Developer",
  mtType: MatrixType = "Bug",
): Promise<Row2OverviewData> {
  const params: OverviewFilterParams = { year, month, project, role };
  const scoped = await fetchRawBugTrackerData(params);
  const total = scoped.length;

  // Finding source: PIC Project vs Bizdev
  const picN = scoped.filter((r) => sectionOf(r) === "PIC Project").length;
  const bizN = scoped.filter((r) => sectionOf(r) === "Bizdev").length;
  const unclassifiedSectionN = scoped.filter(
    (r) => sectionOf(r) === "Unclassified",
  ).length;
  const srcSegs: DistributionSeg[] = [
    {
      label: "PIC Project",
      count: picN,
      pct: barPct(picN, total, 2),
      color: "#2563EB",
    },
    {
      label: "Bizdev",
      count: bizN,
      pct: barPct(bizN, total, 2),
      color: "#f59e0b",
    },
    {
      label: "Belum diklasifikasi",
      count: unclassifiedSectionN,
      pct: barPct(unclassifiedSectionN, total, 2),
      color: "#9ca3af",
    },
  ];

  // FSD coverage: Masuk / Di luar / Belum ditandai
  const fsdYa = scoped.filter((r) => r.include_in_fsd === true).length;
  const fsdNo = scoped.filter((r) => r.include_in_fsd === false).length;
  const fsdNull = total - fsdYa - fsdNo;
  const fsdSegs: DistributionSeg[] = [
    {
      label: "Masuk FSD",
      count: fsdYa,
      pct: barPct(fsdYa, total, 2),
      color: "#10b981",
    },
    {
      label: "Di luar FSD",
      count: fsdNo,
      pct: barPct(fsdNo, total, 2),
      color: "#f59e0b",
    },
    {
      label: "Belum ditandai",
      count: fsdNull,
      pct: barPct(fsdNull, total, 2),
      color: "#9ca3af",
    },
  ];

  // Personnel matrix: role + type aware
  const typed = scoped.filter((r) =>
    mtType === "Bug" ? isBugRecord(r) : isCrRecord(r),
  );
  const mrecs = typed.filter(
    (r) => mtRole === "Developer" || sectionOf(r) === mtRole,
  );
  const keyOf = (r: RawBugRecord) =>
    mtRole === "Developer" ? r.dev_name?.trim() : r.pic_name?.trim();

  const agg: Record<string, { name: string; n: number }> = {};
  mrecs.forEach((r) => {
    const k = keyOf(r);
    if (!k || k === "-") return;
    const a = agg[k] || (agg[k] = { name: k, n: 0 });
    a.n += 1;
  });
  const aggArr = Object.values(agg).sort((a, b) => b.n - a.n);
  const maxN = Math.max(1, aggArr[0]?.n || 1);
  const personBars = aggArr.slice(0, 6).map((d) => ({
    name: d.name,
    count: d.n,
    pct: Math.max(3, Math.round((d.n / maxN) * 100)),
  }));

  // Severity donut over matrix records
  const mtotal = mrecs.length;
  const donutSegs = SEVERITY_ORDER.map((k) => {
    const n = mrecs.filter((r) => normalizeSeverity(r.severity) === k).length;
    return {
      label: k as SeverityKey,
      count: n,
      pct: mtotal ? Math.round((n / mtotal) * 100) : 0,
      color: SEVERITY_COLORS[k],
    };
  });

  const sevScale = SEVERITY_ORDER.map((k) => ({
    label: k,
    weight: SEVERITY_WEIGHTS[k],
    desc: SEVERITY_DESC[k],
  }));

  return {
    mtRole,
    mtType,
    periodLabel: getPeriodLabel(year, month),
    srcSegs,
    fsdSegs,
    personBars,
    donutTotal: mtotal,
    donutSegs,
    sevScale,
  };
}

// ----------------------------------------------------------------------
// ROW 3: Performance audit matrix (all devs by penalty score)
// ----------------------------------------------------------------------
export async function fetchRow3Raw(
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
): Promise<Row3OverviewData> {
  const params: OverviewFilterParams = { year, month, project, role };
  const scoped = await fetchRawBugTrackerData(params);

  const devMap: Record<
    string,
    {
      name: string;
      n: number;
      score: number;
      sev: Record<SeverityType, number>;
      days: number[];
      projects: Record<string, number>;
      done: number;
    }
  > = {};

  scoped.forEach((r) => {
    const name = r.dev_name?.trim();
    if (!name || name === "-") return;
    const a =
      devMap[name] ||
      (devMap[name] = {
        name,
        n: 0,
        score: 0,
        sev: { Critical: 0, Major: 0, Minor: 0, Recurring: 0, Trivia: 0 },
        days: [],
        projects: {},
        done: 0,
      });
    a.n += 1;
    const sev = normalizeSeverity(r.severity);
    a.score += SEVERITY_WEIGHTS[sev];
    if (sev !== "Unclassified") a.sev[sev] += 1;
    const proj = r.project_name?.trim() || "Tanpa project";
    a.projects[proj] = (a.projects[proj] || 0) + 1;
    if (normalizeSimpleStatus(r.status_dev) === "Done") a.done += 1;
    const d = handlingDays(r);
    if (d !== null) a.days.push(d);
  });

  const devArr = Object.values(devMap).sort((a, b) => b.score - a.score);
  const maxScore = Math.max(1, devArr[0]?.score || 1);

  const matrixRows: AuditMatrixRow[] = devArr.map((d, i) => {
    const ratio = d.score / maxScore;
    const avgDays = d.days.length
      ? Math.round(d.days.reduce((x, y) => x + y, 0) / d.days.length)
      : null;
    return {
      rank: i + 1,
      name: d.name,
      projectCount: Object.keys(d.projects).length,
      doneCount: d.done,
      total: d.n,
      score: d.score,
      avgDays,
      sevCounts: d.sev,
      statusLabel:
        ratio >= 0.7
          ? "Perlu audit"
          : ratio >= 0.4
            ? "Perlu dipantau"
            : "Terkendali",
      tone: ratio >= 0.7 ? "red" : ratio >= 0.4 ? "amber" : "green",
    };
  });

  return {
    periodLabel: getPeriodLabel(year, month),
    matrixRows,
  };
}

// ----------------------------------------------------------------------
// CACHING LAYER (Next.js unstable_cache)
// ----------------------------------------------------------------------
export const getCachedRow1Data = (
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
) =>
  unstable_cache(
    () => fetchRow1Raw(year, month, project, role),
    ["overview-row1-v5", year, month, project, role],
    { tags: ["overview"], revalidate: 300 },
  )();

export const getCachedRow2Data = (
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
  mtRole: MatrixRole = "Developer",
  mtType: MatrixType = "Bug",
) =>
  unstable_cache(
    () => fetchRow2Raw(year, month, project, role, mtRole, mtType),
    ["overview-row2-v8", year, month, project, role, mtRole, mtType],
    { tags: ["overview"], revalidate: 300 },
  )();

export const getCachedRow3Data = (
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
) =>
  unstable_cache(
    () => fetchRow3Raw(year, month, project, role),
    ["overview-row3-v5", year, month, project, role],
    { tags: ["overview"], revalidate: 300 },
  )();

// ----------------------------------------------------------------------
// PARALLEL ORCHESTRATION SERVICE (Promise.all)
// ----------------------------------------------------------------------
export async function getOverviewDashboardData(
  year: string = "ALL",
  month: string = "ALL",
  project: string = "ALL",
  role: string = "ALL",
  mtRole: MatrixRole = "Developer",
  mtType: MatrixType = "Bug",
): Promise<FullOverviewDashboardData> {
  const [row1, row2, row3] = await Promise.all([
    getCachedRow1Data(year, month, project, role),
    getCachedRow2Data(year, month, project, role, mtRole, mtType),
    getCachedRow3Data(year, month, project, role),
  ]);

  return { row1, row2, row3 };
}

// Backward compatibility helpers
export async function getRow1OverviewData(
  params: OverviewFilterParams,
): Promise<Row1OverviewData> {
  return fetchRow1Raw(params.year, params.month, params.project, params.role);
}

export async function getRow2OverviewData(
  params: OverviewFilterParams,
  mtRole: MatrixRole = "Developer",
  mtType: MatrixType = "Bug",
): Promise<Row2OverviewData> {
  return fetchRow2Raw(
    params.year,
    params.month,
    params.project,
    params.role,
    mtRole,
    mtType,
  );
}

export async function getRow3OverviewData(
  params: OverviewFilterParams,
): Promise<Row3OverviewData> {
  return fetchRow3Raw(params.year, params.month, params.project, params.role);
}
