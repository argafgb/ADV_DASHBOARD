import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { DEFAULT_YEAR } from "../utils/constants";
import { parseMonthFilter } from "../utils/filter-utils";
import {
  SHORT_MONTH_NAMES,
  INDONESIAN_MONTH_NAMES,
} from "../utils/month-filter";
import {
  formatDelta,
  formatHoursDelta,
  formatHours,
  formatCost,
} from "../utils/formatters";
import type {
  KpiCardData,
  YoyDataPoint,
  ParetoItem,
  CompositionData,
  OverviewPeriod,
} from "../types/overview.types";

interface KpiCompareRow {
  total_hours: number | null;
  employee_count: number | null;
  avg_per_employee: number | null;
  total_cost: number | null;
  cur_hours: number | null;
  cur_people: number | null;
  cur_avg: number | null;
  cur_cost: number | null;
  prev_month: number | null;
  prev_total_hours: number | null;
  prev_employee_count: number | null;
  prev_avg_per_employee: number | null;
  prev_total_cost: number | null;
}

interface MonthlyRow {
  month: number;
  y0: number | null;
  y1: number | null;
  y2: number | null;
}

interface CauseRow {
  cause_category: string;
  hours_pct: number;
  cost_pct: number;
}

interface CompositionRow {
  type_label: string;
  trx_count: number;
  total_hours: number;
  total_cost: number;
}

interface CutoffRow {
  cutoff_month: number | null;
  last_month: number | null;
}

const NO_PERIOD: OverviewPeriod = {
  year: parseInt(DEFAULT_YEAR, 10),
  startMonth: 1,
  endMonth: 0,
  cutoffMonth: 0,
  available: false,
  label: "Belum ada data",
  includesOpenMonth: false,
};

const EMPTY_COMPOSITION: CompositionData = {
  totalLabel: "Total biaya",
  totalValue: "–",
  items: [],
};

// ─── RAW FUNCTIONS ────────────────────────────────────────

export async function getOverviewPeriodRaw(
  year: string,
  month: string,
): Promise<OverviewPeriod> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || parseInt(DEFAULT_YEAR, 10);

  try {
    const rows = await sql<CutoffRow[]>`
      SELECT
        MAX(month) FILTER (WHERE status = 3)::int AS cutoff_month,
        MAX(month) FILTER (WHERE status IN (2, 3))::int AS last_month
      FROM overtime.overtime_transactions
      WHERE year = ${yearNum} AND durasi_lembur > 0;
    `;

    console.log(
      `[DB] getOverviewPeriod in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const cutoffMonth = rows[0]?.cutoff_month ?? 0;
    const lastMonth = rows[0]?.last_month ?? 0;
    if (!lastMonth) return { ...NO_PERIOD, year: yearNum };

    const {
      isAll,
      startMonth: filterStart,
      endMonth: filterEnd,
    } = parseMonthFilter(month);

    const startMonth = isAll ? 1 : filterStart;
    const endMonth = isAll ? cutoffMonth || lastMonth : filterEnd;
    const includesOpenMonth = endMonth > cutoffMonth;

    const suffix = includesOpenMonth ? "berjalan" : "closed";
    const label = isAll
      ? cutoffMonth
        ? `${yearNum} closed s.d. ${SHORT_MONTH_NAMES[cutoffMonth - 1]}`
        : `${yearNum} · belum ada bulan closing`
      : startMonth === endMonth
        ? `${INDONESIAN_MONTH_NAMES[startMonth - 1]} ${yearNum} · ${suffix}`
        : `${SHORT_MONTH_NAMES[startMonth - 1]}–${SHORT_MONTH_NAMES[endMonth - 1]} ${yearNum} · ${suffix}`;

    return {
      year: yearNum,
      startMonth,
      endMonth,
      cutoffMonth,
      available: endMonth >= startMonth,
      label,
      includesOpenMonth,
    };
  } catch (err) {
    console.error("[DB] Failed getOverviewPeriod:", err);
    return { ...NO_PERIOD, year: yearNum };
  }
}

export async function getOverviewKpisRaw(
  period: OverviewPeriod,
): Promise<KpiCardData[]> {
  if (!period.available) return [];

  const start = performance.now();

  try {
    const rows = await sql<KpiCompareRow[]>`
      WITH scoped AS (
        SELECT t.month, t.employee_id, t.durasi_lembur, t.biaya_lembur
        FROM overtime.overtime_transactions t
        WHERE t.year = ${period.year}
          AND t.month BETWEEN ${period.startMonth} AND ${period.endMonth}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
      ),
      period AS (
        SELECT
          COALESCE(SUM(durasi_lembur), 0)::float AS total_hours,
          COUNT(DISTINCT employee_id)::int AS employee_count,
          ROUND(COALESCE(SUM(durasi_lembur) / NULLIF(COUNT(DISTINCT employee_id), 0), 0)::numeric, 1)::float AS avg_per_employee,
          COALESCE(SUM(biaya_lembur), 0)::float AS total_cost
        FROM scoped
      ),
      monthly AS (
        SELECT
          month,
          COALESCE(SUM(durasi_lembur), 0)::float AS total_hours,
          COUNT(DISTINCT employee_id)::int AS employee_count,
          ROUND(COALESCE(SUM(durasi_lembur) / NULLIF(COUNT(DISTINCT employee_id), 0), 0)::numeric, 1)::float AS avg_per_employee,
          COALESCE(SUM(biaya_lembur), 0)::float AS total_cost
        FROM scoped
        GROUP BY month
      ),
      paired AS (
        SELECT
          m.total_hours AS cur_hours,
          m.employee_count AS cur_people,
          m.avg_per_employee AS cur_avg,
          m.total_cost AS cur_cost,
          LAG(m.month) OVER w AS prev_month,
          LAG(m.total_hours) OVER w AS prev_total_hours,
          LAG(m.employee_count) OVER w AS prev_employee_count,
          LAG(m.avg_per_employee) OVER w AS prev_avg_per_employee,
          LAG(m.total_cost) OVER w AS prev_total_cost,
          ROW_NUMBER() OVER (ORDER BY m.month DESC) AS rn
        FROM monthly m
        WINDOW w AS (ORDER BY m.month)
      )
      SELECT
        p.total_hours, p.employee_count, p.avg_per_employee, p.total_cost,
        q.cur_hours, q.cur_people, q.cur_avg, q.cur_cost,
        q.prev_month, q.prev_total_hours, q.prev_employee_count,
        q.prev_avg_per_employee, q.prev_total_cost
      FROM period p
      LEFT JOIN paired q ON q.rn = 1;
    `;

    console.log(
      `[DB] getOverviewKpis in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const r = rows[0];
    if (!r) return [];

    const hoursDelta = formatDelta(r.cur_hours ?? 0, r.prev_total_hours ?? 0);
    const empDelta = formatDelta(r.cur_people ?? 0, r.prev_employee_count ?? 0);
    const avgDelta = formatHoursDelta(
      r.cur_avg ?? 0,
      r.prev_avg_per_employee ?? 0,
    );
    const costDelta = formatDelta(r.cur_cost ?? 0, r.prev_total_cost ?? 0);

    const prevMonth = r.prev_month;
    const comparisonLabel = prevMonth
      ? `vs ${INDONESIAN_MONTH_NAMES[prevMonth - 1]} ${period.year}`
      : "";
    const labelFor = (available: boolean) => (available ? comparisonLabel : "");

    const inverseTone = (d: "up" | "down") => (d === "up" ? "down" : "up");

    return [
      {
        label: "Jam lembur approved",
        value: formatHours(r.total_hours ?? 0),
        icon: "clock",
        deltaLabel: labelFor(hoursDelta.available),
        deltaValue: hoursDelta.value,
        deltaAvailable: hoursDelta.available,
        deltaDirection: hoursDelta.direction,
        deltaTone: inverseTone(hoursDelta.direction),
        tone: "blue" as const,
      },
      {
        label: "Karyawan lembur",
        value: `${(r.employee_count ?? 0).toLocaleString("id-ID")} orang`,
        icon: "users",
        deltaLabel: labelFor(empDelta.available),
        deltaValue: empDelta.value,
        deltaAvailable: empDelta.available,
        deltaDirection: empDelta.direction,
        deltaTone: inverseTone(empDelta.direction),
        tone: "blue" as const,
      },
      {
        label: "Rata-rata per karyawan",
        value: `${(r.avg_per_employee ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jam`,
        icon: "gauge",
        deltaLabel: labelFor(avgDelta.available),
        deltaValue: avgDelta.value,
        deltaAvailable: avgDelta.available,
        deltaDirection: avgDelta.direction,
        deltaTone: inverseTone(avgDelta.direction),
        tone: "green" as const,
      },
      {
        label: "Biaya lembur approved",
        value: formatCost(r.total_cost ?? 0),
        icon: "banknote",
        deltaLabel: labelFor(costDelta.available),
        deltaValue: costDelta.value,
        deltaAvailable: costDelta.available,
        deltaDirection: costDelta.direction,
        deltaTone: inverseTone(costDelta.direction),
        tone: "amber" as const,
      },
    ];
  } catch (err) {
    console.error("[DB] Failed getOverviewKpis:", err);
    return [];
  }
}

export async function getYoyDataRaw(
  period: OverviewPeriod,
  field: "durasi_lembur" | "biaya_lembur",
): Promise<YoyDataPoint[]> {
  if (!period.available) return [];

  const start = performance.now();
  const yearNum = period.year;

  try {
    const rows = await sql<MonthlyRow[]>`
      SELECT
        month,
        SUM(CASE WHEN year = ${yearNum - 2} THEN ${sql.unsafe(field)} ELSE 0 END)::float AS y0,
        SUM(CASE WHEN year = ${yearNum - 1} THEN ${sql.unsafe(field)} ELSE 0 END)::float AS y1,
        SUM(CASE WHEN year = ${yearNum} THEN ${sql.unsafe(field)} ELSE 0 END)::float AS y2
      FROM overtime.overtime_transactions
      WHERE year IN (${yearNum - 2}, ${yearNum - 1}, ${yearNum})
        AND status IN (2, 3)
        AND durasi_lembur > 0
        AND NOT (year = ${yearNum} AND month > ${period.endMonth})
      GROUP BY month
      ORDER BY month;
    `;

    console.log(
      `[DB] getYoyData(${field}) in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const byMonth = new Map(rows.map((r) => [r.month, r]));

    const divisor = field === "biaya_lembur" ? 1_000_000 : 1_000;
    const scale = (v: number | undefined | null) =>
      v ? Math.round((v / divisor) * 100) / 100 : null;

    return SHORT_MONTH_NAMES.map((label, i) => {
      const month = i + 1;
      const row = byMonth.get(month);
      return {
        month: label,
        year2024: scale(row?.y0),
        year2025: scale(row?.y1),
        year2026: month > period.endMonth ? null : scale(row?.y2),
      };
    });
  } catch (err) {
    console.error(`[DB] Failed getYoyData(${field}):`, err);
    return [];
  }
}

export async function getParetoCausesRaw(
  period: OverviewPeriod,
): Promise<ParetoItem[]> {
  if (!period.available) return [];

  const start = performance.now();

  try {
    const rows = await sql<CauseRow[]>`
      WITH scoped AS (
        SELECT
          COALESCE(NULLIF(TRIM(t.cause_category), ''), 'Lainnya') AS cause_category,
          t.durasi_lembur,
          t.biaya_lembur
        FROM overtime.overtime_transactions t
        WHERE t.year = ${period.year}
          AND t.month BETWEEN ${period.startMonth} AND ${period.endMonth}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND NULLIF(TRIM(t.uraian_pekerjaan), '') IS NOT NULL
      ),
      categorized AS (
        SELECT
          cause_category,
          SUM(durasi_lembur) AS total_hours,
          SUM(biaya_lembur) AS total_cost
        FROM scoped
        GROUP BY 1
      ),
      totals AS (
        SELECT
          SUM(durasi_lembur) AS sum_hours,
          SUM(biaya_lembur) AS sum_cost
        FROM scoped
      )
      SELECT
        c.cause_category,
        ROUND((c.total_hours / NULLIF(t.sum_hours, 0) * 100)::numeric, 0)::int AS hours_pct,
        ROUND((c.total_cost / NULLIF(t.sum_cost, 0) * 100)::numeric, 0)::int AS cost_pct
      FROM categorized c
      CROSS JOIN totals t
      ORDER BY c.total_hours DESC
      LIMIT 6;
    `;

    console.log(
      `[DB] getParetoCauses in ${(performance.now() - start).toFixed(2)}ms`,
    );

    return rows.map((r) => ({
      name: r.cause_category,
      hoursPct: r.hours_pct,
      costPct: r.cost_pct,
      label: `${r.hours_pct}% · ${r.cost_pct}%`,
    }));
  } catch (err) {
    console.error("[DB] Failed getParetoCauses:", err);
    return [];
  }
}

export async function getCompositionRaw(
  period: OverviewPeriod,
): Promise<CompositionData> {
  if (!period.available) return EMPTY_COMPOSITION;

  const start = performance.now();

  try {
    const rows = await sql<CompositionRow[]>`
      SELECT
        COALESCE(t.tipe_lembur,
          CASE WHEN hari_libur = 'Ya' THEN 'IPL' ELSE 'SPL' END) AS type_label,
        COUNT(*)::int AS trx_count,
        COALESCE(SUM(durasi_lembur), 0)::float AS total_hours,
        COALESCE(SUM(biaya_lembur), 0)::float AS total_cost
      FROM overtime.overtime_transactions t
      WHERE t.year = ${period.year}
        AND t.month BETWEEN ${period.startMonth} AND ${period.endMonth}
        AND t.status IN (2, 3)
        AND t.durasi_lembur > 0
      GROUP BY type_label
      ORDER BY type_label;
    `;

    console.log(
      `[DB] getComposition in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const grandTotal = rows.reduce((s, r) => s + r.total_cost, 0);

    return {
      totalLabel: "Total biaya",
      totalValue: formatCost(grandTotal),
      items: rows.map((r) => {
        const pct = grandTotal > 0 ? (r.total_cost / grandTotal) * 100 : 0;
        return {
          name: r.type_label,
          percentage: `${pct.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`,
          detail: `${r.trx_count.toLocaleString("id-ID")} transaksi · ${formatHours(r.total_hours)} · ${formatCost(r.total_cost)}`,
          color:
            r.type_label === "IPL" ? ("brand" as const) : ("purple" as const),
        };
      }),
    };
  } catch (err) {
    console.error("[DB] Failed getComposition:", err);
    return EMPTY_COMPOSITION;
  }
}

// ─── CACHED EXPORTS ───────────────────────────────────────

const CACHE_VERSION = "v2-period-follows-filter";

const periodKey = (p: OverviewPeriod) => [
  CACHE_VERSION,
  String(p.year),
  String(p.startMonth),
  String(p.endMonth),
];

export async function getOverviewPeriod(
  year: string,
  month: string,
): Promise<OverviewPeriod> {
  return unstable_cache(
    async () => getOverviewPeriodRaw(year, month),
    ["overtime-overview-period", CACHE_VERSION, year, month],
    { revalidate: 300, tags: ["overtime-overview-kpi"] },
  )();
}

export async function getOverviewKpis(
  period: OverviewPeriod,
): Promise<KpiCardData[]> {
  return unstable_cache(
    async () => getOverviewKpisRaw(period),
    ["overtime-overview-kpis", ...periodKey(period)],
    { revalidate: 300, tags: ["overtime-overview-kpi"] },
  )();
}

export async function getYoyHours(
  period: OverviewPeriod,
): Promise<YoyDataPoint[]> {
  return unstable_cache(
    async () => getYoyDataRaw(period, "durasi_lembur"),
    ["overtime-overview-yoy-hours", ...periodKey(period)],
    { revalidate: 300, tags: ["overtime-overview-yoy"] },
  )();
}

export async function getYoyCost(
  period: OverviewPeriod,
): Promise<YoyDataPoint[]> {
  return unstable_cache(
    async () => getYoyDataRaw(period, "biaya_lembur"),
    ["overtime-overview-yoy-cost", ...periodKey(period)],
    { revalidate: 300, tags: ["overtime-overview-yoy"] },
  )();
}

export async function getParetoCauses(
  period: OverviewPeriod,
): Promise<ParetoItem[]> {
  return unstable_cache(
    async () => getParetoCausesRaw(period),
    ["overtime-overview-pareto", ...periodKey(period)],
    { revalidate: 300, tags: ["overtime-overview-pareto"] },
  )();
}

export async function getComposition(
  period: OverviewPeriod,
): Promise<CompositionData> {
  return unstable_cache(
    async () => getCompositionRaw(period),
    ["overtime-overview-composition", ...periodKey(period)],
    { revalidate: 300, tags: ["overtime-overview-composition"] },
  )();
}
