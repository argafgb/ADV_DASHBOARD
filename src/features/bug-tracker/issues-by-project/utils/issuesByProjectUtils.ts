import { IssueItem } from "@/features/bug-tracker/issues-data/types/issuesData";
import {
  MONTH_SHORT_ID,
  MONTH_LONG_ID,
  fmtId,
  formatShortDate,
} from "@/features/bug-tracker/issues-data/utils/issuesDataUtils";
import {
  TopProject,
  FoundVsClosedData,
  BugCrChartData,
  ProjectGroup,
  ProjectSortOption,
} from "../types/issuesByProject";

// ----------------------------------------------------------------------
// TOP CONTRIBUTING PROJECTS
// ----------------------------------------------------------------------
export function buildTopProjects(items: IssueItem[]): TopProject[] {
  const agg = new Map<string, number>();
  items.forEach((r) => {
    agg.set(r.project, (agg.get(r.project) || 0) + 1);
  });
  const max = Math.max(1, ...agg.values());
  return [...agg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, n]) => ({
      name,
      n,
      pct: Math.max(3, Math.round((n / max) * 100)),
    }));
}

// ----------------------------------------------------------------------
// FOUND VS CLOSED (cumulative area chart, recharts)
// ----------------------------------------------------------------------
export function buildFoundVsClosed(
  foundPerMonth: number[],
  closedPerMonth: number[],
): FoundVsClosedData {
  // Cumulative series spans the whole axis: on "All Months" the line is
  // carried flat through December instead of stopping at the last month
  // with activity.
  let cf = 0;
  let cc = 0;
  const points: FoundVsClosedData["points"] = [];
  for (let k = 0; k < 12; k++) {
    cf += foundPerMonth[k] || 0;
    cc += closedPerMonth[k] || 0;
    points.push({ month: MONTH_SHORT_ID[k], found: cf, closed: cc });
  }

  return { foundTotal: cf, closedTotal: cc, points };
}

/** Nilai kumulatif tertinggi, dasar domain sumbu Y bersama dua kartu. */
export function foundVsClosedPeak(data: FoundVsClosedData): number {
  return Math.max(data.foundTotal, data.closedTotal);
}

// ----------------------------------------------------------------------
// BUG VS CHANGE REQUEST (grouped bars, max height 170)
// ----------------------------------------------------------------------
const BC_MAX_H = 170;

/**
 * `scaleMax` menyamakan tinggi batang antara kartu tahun berjalan dan kartu
 * pembanding tahun lalu.
 */
export function buildBugCrChart(
  items: IssueItem[],
  year: number,
  scaleMax?: number,
): BugCrChartData {
  const bug = Array.from({ length: 12 }, () => 0);
  const cr = Array.from({ length: 12 }, () => 0);
  const unclassified = Array.from({ length: 12 }, () => 0);
  items.forEach((r) => {
    if (!r.month || r.month < 1 || r.month > 12) return;
    if (r.type === "Bug") bug[r.month - 1]++;
    else if (r.type === "CR") cr[r.month - 1]++;
    else unclassified[r.month - 1]++;
  });
  const max = Math.max(1, scaleMax ?? 0, ...bug, ...cr);
  const bars = Array.from({ length: 12 }, (_, k) => {
    const b = bug[k];
    const c = cr[k];
    const u = unclassified[k];
    const t = b + c + u;
    return {
      label: MONTH_SHORT_ID[k],
      nb: b,
      nc: c,
      nu: u,
      hb: b ? Math.max(3, Math.round((b / max) * BC_MAX_H)) : 0,
      hc: c ? Math.max(3, Math.round((c / max) * BC_MAX_H)) : 0,
      tipTitle: `${MONTH_LONG_ID[k]} ${year} · ${fmtId(t)} record`,
      rows: (
        [
          ["Bug", b, "bug"],
          ["Change request", c, "cr"],
          ["Belum diklasifikasi", u, "unclassified"],
        ] as const
      ).map(([label, n, colorKey]) => ({
        label,
        n,
        pct: t ? Math.round((n / t) * 100) : 0,
        colorKey,
        dim: n === 0,
      })),
    };
  });
  return {
    bars,
    totalBug: bug.reduce((a, b) => a + b, 0),
    totalCr: cr.reduce((a, b) => a + b, 0),
    totalUnclassified: unclassified.reduce((a, b) => a + b, 0),
  };
}

/** Nilai bulanan tertinggi (bug atau CR) sebagai dasar skala bersama. */
export function bugCrPeak(items: IssueItem[]): number {
  const bug = Array.from({ length: 12 }, () => 0);
  const cr = Array.from({ length: 12 }, () => 0);
  items.forEach((r) => {
    if (!r.month || r.month < 1 || r.month > 12) return;
    if (r.type === "Bug") bug[r.month - 1]++;
    else if (r.type === "CR") cr[r.month - 1]++;
  });
  return Math.max(0, ...bug, ...cr);
}

// ----------------------------------------------------------------------
// PROJECT GROUPS
// ----------------------------------------------------------------------
export function buildProjectGroups(
  items: IssueItem[],
  q: string,
  sort: ProjectSortOption,
): ProjectGroup[] {
  const agg = new Map<string, IssueItem[]>();
  items.forEach((r) => {
    const list = agg.get(r.project) || [];
    list.push(r);
    agg.set(r.project, list);
  });
  const qp = q.trim().toLowerCase();
  const groups = [...agg.entries()]
    .filter(([name]) => !qp || name.toLowerCase().includes(qp))
    .map(([name, rs]) => {
      const dates = rs
        .map((r) => r.disc)
        .filter((d): d is string => !!d)
        .sort();
      const ds = rs.map((r) => r.days).filter((d): d is number => d !== null);
      const ya = rs.filter((r) => r.fsd === "Ya").length;
      const no = rs.filter((r) => r.fsd === "Tidak").length;
      const lo = dates[0] || "";
      const hi = dates[dates.length - 1] || "";
      return {
        key: name,
        name,
        lo,
        hi,
        rangeLabel: lo
          ? `${formatShortDate(lo)} – ${formatShortDate(hi)}`
          : "tanpa tanggal",
        bugCount: rs.filter((r) => r.type === "Bug").length,
        crCount: rs.filter((r) => r.type === "CR").length,
        fsdYa: ya,
        fsdNo: no,
        fsdOk: ya >= no,
        avgDays: ds.length
          ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length)
          : null,
        rows: rs,
      };
    });
  groups.sort((a, b) =>
    sort === "Terbaru"
      ? b.hi.localeCompare(a.hi)
      : sort === "Terlama"
        ? a.lo.localeCompare(b.lo)
        : b.rows.length - a.rows.length,
  );
  return groups;
}
