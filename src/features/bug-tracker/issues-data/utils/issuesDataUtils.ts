import { fmt } from "@/lib/utils";
import {
  IssueItem,
  IssueGroup,
  IssueDetailData,
  DetailStage,
  SeverityDonutData,
  HeatmapRow,
  MonthBar,
  SevLegendItem,
  GroupByOption,
  IssueTypeFilter,
} from "../types/issuesData";
import {
  SEVERITY_ORDER,
  SEVERITY_COLORS,
} from "@/features/bug-tracker/overview/services/severityConstants";
import { SeverityKey } from "@/features/bug-tracker/overview/types/overviewTypes";

export const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const MONTH_LONG_ID = [
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

export const fmtId = (n: number): string => fmt(n || 0);

// ----------------------------------------------------------------------
// DATE HELPERS
// ----------------------------------------------------------------------
export function dayDiff(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  if (!a || !b) return null;
  const x = new Date(a.slice(0, 10));
  const y = new Date(b.slice(0, 10));
  if (isNaN(x.getTime()) || isNaN(y.getTime())) return null;
  return Math.round((y.getTime() - x.getTime()) / 86400000);
}

/** "2026-07-27" -> "27 Jul 2026" */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const p = iso.slice(0, 10).split("-");
  if (p.length !== 3) return iso;
  const mi = +p[1] - 1;
  if (mi < 0 || mi > 11) return iso;
  return `${p[2]} ${MONTH_SHORT_ID[mi]} ${p[0]}`;
}

/** Table date column clock: "2026-07-27T08:30:00" -> "08:30"; null when the
 *  input has no clock. */
export function inputClock(
  timeInput: string | null | undefined,
): string | null {
  return timeInput && timeInput.includes("T")
    ? timeInput.split("T")[1].slice(0, 5)
    : null;
}

export function initialsOf(name: string | null | undefined): string {
  return (
    String(name || "")
      .split(/[\s/]+/)
      .filter(Boolean)
      .map((x) => x[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "-"
  );
}

export type DayTone = "green" | "amber" | "red" | "muted";

export function dayTone(d: number | null): DayTone {
  if (d === null) return "muted";
  if (d > 30) return "red";
  if (d > 14) return "amber";
  return "green";
}

// ----------------------------------------------------------------------
// FILTERING
// ----------------------------------------------------------------------
export interface IssueFilters {
  q: string;
  fType: IssueTypeFilter;
  fSeverity: string;
  fStatus: string;
  fStage: string;
}

export function filterIssues(items: IssueItem[], f: IssueFilters): IssueItem[] {
  const q = f.q.trim().toLowerCase();
  return items.filter(
    (r) =>
      (f.fType === "All type" || r.type === f.fType) &&
      (f.fSeverity === "All" || r.sev === f.fSeverity) &&
      (f.fStatus === "All" || r.status === f.fStatus) &&
      (f.fStage === "All stage" || r.stage === f.fStage) &&
      (!q ||
        `${r.pic} ${r.dev} ${r.project} ${r.name ?? ""} ${r.remarks}`
          .toLowerCase()
          .includes(q)),
  );
}

// ----------------------------------------------------------------------
// CHART BUILDERS
// ----------------------------------------------------------------------
export function buildSeverityDonut(items: IssueItem[]): SeverityDonutData {
  const total = items.length;
  const denom = total || 1;
  let acc = 0;
  const segs = SEVERITY_ORDER.map((k) => {
    const n = items.filter((r) => r.sev === k).length;
    const pct = (n / denom) * 100;
    const s = {
      key: k as SeverityKey,
      label: k,
      n,
      color: SEVERITY_COLORS[k],
      from: +acc.toFixed(2),
      to: +(acc + pct).toFixed(2),
    };
    acc += pct;
    return s;
  });
  return { total, segs };
}

export function buildSevLegend(items: IssueItem[]): SevLegendItem[] {
  return SEVERITY_ORDER.map((k) => ({
    label: k,
    n: items.filter((r) => r.sev === k).length,
    color: SEVERITY_COLORS[k],
  }));
}

/** Top-6 developers x 5 severities; t = intensity 0..1 vs max cell. */
export function buildHeatmap(items: IssueItem[]): HeatmapRow[] {
  const agg = new Map<
    string,
    { name: string; n: number; sev: Record<string, number> }
  >();
  items.forEach((r) => {
    if (!r.dev || r.dev === "-") return;
    const a = agg.get(r.dev) || { name: r.dev, n: 0, sev: {} };
    a.n++;
    a.sev[r.sev] = (a.sev[r.sev] || 0) + 1;
    agg.set(r.dev, a);
  });
  const arr = [...agg.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  const max = Math.max(
    1,
    ...arr.map((a) => Math.max(...SEVERITY_ORDER.map((k) => a.sev[k] || 0))),
  );
  return arr.map((a) => ({
    name: a.name,
    cells: SEVERITY_ORDER.map((k) => {
      const n = a.sev[k] || 0;
      return { n, t: n / max };
    }),
  }));
}

const BAR_MAX_H = 172;

/**
 * Batang temuan per bulan. `scaleMax` dipakai agar dua kartu berdampingan
 * (tahun berjalan vs tahun lalu) memakai skala tinggi yang sama.
 */
export function buildMonthBars(
  items: IssueItem[],
  year: number,
  scaleMax?: number,
): MonthBar[] {
  const buckets = Array.from({ length: 12 }, (_, i) =>
    items.filter((r) => r.month === i + 1),
  );
  const max = Math.max(1, scaleMax ?? 0, ...buckets.map((a) => a.length));
  return buckets.map((arr, i) => {
    const h = Math.round((arr.length / max) * BAR_MAX_H);
    return {
      label: MONTH_SHORT_ID[i],
      total: arr.length,
      h: Math.max(arr.length ? 3 : 0, h),
      segs: SEVERITY_ORDER.map((k) => {
        const n = arr.filter((r) => r.sev === k).length;
        return {
          color: SEVERITY_COLORS[k],
          h: n ? Math.max(2, Math.round((n / max) * BAR_MAX_H)) : 0,
        };
      }).filter((s) => s.h > 0),
      rows: SEVERITY_ORDER.map((k) => {
        const n = arr.filter((r) => r.sev === k).length;
        return {
          label: k,
          n,
          pct: arr.length ? Math.round((n / arr.length) * 100) : 0,
          color: SEVERITY_COLORS[k],
          dim: n === 0,
        };
      }),
      tipTitle: `${MONTH_LONG_ID[i]} ${year} · ${fmtId(arr.length)} temuan`,
    };
  });
}

/** Jumlah temuan terbanyak dalam satu bulan; dasar skala bersama antar kartu. */
export function monthlyPeak(items: IssueItem[]): number {
  const buckets = Array.from(
    { length: 12 },
    (_, i) => items.filter((r) => r.month === i + 1).length,
  );
  return Math.max(0, ...buckets);
}

// ----------------------------------------------------------------------
// GROUPING
// ----------------------------------------------------------------------
const GROUP_KEY: Record<
  Exclude<GroupByOption, "Default">,
  (r: IssueItem) => string
> = {
  "PIC / Bizdev": (r) => r.pic,
  Developer: (r) => r.dev,
  Project: (r) => r.project,
  "Tahap testing": (r) => r.stage,
};

export function groupIssues(
  items: IssueItem[],
  groupBy: GroupByOption,
): IssueGroup[] {
  if (groupBy === "Default") return [];
  const keyOf = GROUP_KEY[groupBy];
  const m = new Map<string, IssueItem[]>();
  items.forEach((r) => {
    const k = keyOf(r) || "-";
    const list = m.get(k) || [];
    list.push(r);
    m.set(k, list);
  });
  return [...m.entries()]
    .map(([k, rs]) => {
      const ds = rs.map((r) => r.days).filter((d): d is number => d !== null);
      const dates = rs
        .map((r) => r.disc)
        .filter((d): d is string => !!d)
        .sort();
      return {
        key: k,
        name: k,
        count: rs.length,
        bugCount: rs.filter((r) => r.type === "Bug").length,
        crCount: rs.filter((r) => r.type === "CR").length,
        avgDays: ds.length
          ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length)
          : null,
        rangeLabel: dates.length
          ? `${formatShortDate(dates[0])} – ${formatShortDate(dates[dates.length - 1])}`
          : "tanpa tanggal",
        section: rs[0].section,
        rows: rs,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ----------------------------------------------------------------------
// PAGINATION
// ----------------------------------------------------------------------
export interface PageResult<T> {
  slice: T[];
  page: number;
  totalPages: number;
  /** up to 8 page numbers */
  pageNumbers: number[];
}

export function paginate<T>(
  list: T[],
  page: number,
  perPage: number,
): PageResult<T> {
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const p = Math.min(Math.max(1, page), totalPages);
  return {
    slice: list.slice((p - 1) * perPage, p * perPage),
    page: p,
    totalPages,
    pageNumbers: Array.from(
      { length: Math.min(totalPages, 8) },
      (_, i) => i + 1,
    ),
  };
}

// ----------------------------------------------------------------------
// DETAIL DRAWER
// ----------------------------------------------------------------------
export function buildIssueDetail(
  r: IssueItem,
  allItems: IssueItem[],
  now: Date = new Date(),
): IssueDetailData {
  const defs: [string, string | null][] = [
    ["Discovery", r.disc],
    ["Start dev", r.start],
    ["Finish", r.finish],
    ["SIT realized", r.sitRealized],
  ];
  const aligns: DetailStage["align"][] = ["start", "center", "center", "end"];
  let last = -1;
  const stages: DetailStage[] = defs.map((d, i) => {
    if (d[1]) last = i;
    const prev = defs
      .slice(0, i)
      .reverse()
      .find((x) => x[1]);
    const gap = d[1] && prev ? dayDiff(prev[1], d[1]) : null;
    return {
      name: d[0],
      date: d[1] ? formatShortDate(d[1]) : "-",
      align: aligns[i],
      gap:
        gap === null
          ? ""
          : gap === 0
            ? "hari yang sama"
            : gap < 0
              ? `${Math.abs(gap)} hari lebih awal`
              : `+${gap} hari`,
      filled: !!d[1],
    };
  });

  const rawTotal = dayDiff(r.disc, r.finish);
  const reversed = rawTotal !== null && rawTotal < 0;
  const total = reversed ? null : rawTotal;
  const running =
    r.disc && !r.finish
      ? dayDiff(r.disc, now.toISOString().slice(0, 10))
      : null;

  const miss = [
    !r.disc && "tanggal temuan",
    !r.finish && "tanggal selesai",
    r.type === "Unclassified" && "tipe issue",
    r.sev === "Unclassified" && "severity",
    r.fsd === "-" && "status FSD",
  ].filter(Boolean) as string[];
  const notes = miss
    .map((m) => `kosong: ${m}`)
    .concat(reversed ? ["urutan tanggal terbalik"] : []);

  const devLoad = allItems.filter((x) => x.dev === r.dev).length;
  const picLoad = allItems.filter((x) => x.pic === r.pic).length;

  return {
    noLabel: r.no ? `No. ${r.no}` : `Temuan ${formatShortDate(r.disc)}`,
    stages,
    progress: ["0%", "16.66%", "50%", "83.33%", "100%"][last + 1] || "0%",
    daysBig:
      total === null
        ? running === null
          ? "-"
          : String(running)
        : String(total),
    daysTone: dayTone(total),
    daysNote:
      total !== null
        ? "hari dari temuan ke selesai"
        : reversed
          ? "urutan tanggal perlu dicek"
          : running !== null
            ? "hari berjalan, belum selesai"
            : "tanggal belum lengkap",
    duration:
      total !== null
        ? `Total penanganan ${fmtId(total)} hari sejak temuan dicatat`
        : reversed
          ? "Tanggal selesai tercatat lebih awal dari tanggal temuan, durasi belum dapat dihitung"
          : running !== null
            ? `Belum selesai · sudah berjalan ${fmtId(running)} hari sejak ditemukan`
            : "Tanggal belum lengkap, durasi tidak dapat dihitung",
    flag: notes.length ? "Perlu dilengkapi" : "Lengkap",
    flagNote: notes.length ? notes.join(" · ") : "semua kolom wajib terisi",
    devLoad,
    picLoad,
    periodLabel: r.disc
      ? `${MONTH_SHORT_ID[+r.disc.slice(5, 7) - 1]} ${r.disc.slice(0, 4)}`
      : "-",
  };
}

// ----------------------------------------------------------------------
// CSV EXPORT
// ----------------------------------------------------------------------
export function buildCsv(items: IssueItem[]): string {
  const esc = (v: string | number | null): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = [
    "No",
    "Nama",
    "Tanggal temuan",
    "Project",
    "Penemu",
    "Developer",
    "Section",
    "Tahap",
    "Tipe",
    "Severity",
    "Status dev",
    "Status PIC",
    "FSD",
    "Start dev",
    "Finish",
    "SIT realized",
    "Handling (hari)",
    "Isi temuan",
    "Response developer",
    "Link Notion",
    "Link lampiran",
  ];
  const rows = items.map((r, i) =>
    [
      r.no ?? i + 1,
      r.name ?? "",
      r.disc ?? "",
      r.project,
      r.pic,
      r.dev,
      r.section,
      r.stage,
      r.type,
      r.sev,
      r.status,
      r.statusPic,
      r.fsd,
      r.start ?? "",
      r.finish ?? "",
      r.sitRealized ?? "",
      r.days ?? "",
      r.remarks,
      r.resp,
      r.url ?? "",
      r.screenshotUrl ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [head.map(esc).join(","), ...rows].join("\r\n");
}
