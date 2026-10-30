import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { parseMonthFilter } from "../utils/filter-utils";
import { unitConditions, unitCacheKey } from "../utils/unit-conditions";
import {
  formatHours,
  formatCost,
  formatWeekLabel,
  formatWeekShort,
  idNum,
} from "../utils/formatters";
import type {
  ApprovalStatusData,
  HeatmapCell,
  Employee,
  RepeatEmployee,
  EmployeeComplianceData,
  RiskBox,
} from "../types/employee.types";

interface ApprovalRow {
  status: number;
  cnt: number;
}

const APPROVAL_STATUSES = [
  {
    status: 2,
    label: "Approved",
    variant: "good",
    color: "var(--chart-green)",
  },
  {
    status: 3,
    label: "Closing",
    variant: "good",
    color: "var(--chart-blue-light)",
  },
  {
    status: 1,
    label: "Verifikasi",
    variant: "warn",
    color: "var(--chart-amber)",
  },
  {
    status: 5,
    label: "Menunggu Approve RH",
    variant: "warn",
    color: "var(--status-amber-fg)",
  },
  {
    status: 0,
    label: "New Entry",
    variant: "default",
    color: "var(--chart-blue-primary)",
  },
  { status: 4, label: "Decline", variant: "risk", color: "var(--chart-red)" },
  {
    status: 6,
    label: "Cancel",
    variant: "risk",
    color: "var(--chart-neutral)",
  },
] as const;

interface HeatRow {
  day_of_week: number;
  time_slot: string;
  heat: number;
}

interface EmployeeRow {
  employee_id: string;
  employee_name: string;
  jabatan: string;
  area_path: string;
  uraian_pekerjaan: string;
  freq: number;
  total_hours: number;
  total_cost: number;
  over_weekly_limit: boolean;
  initials: string;
}

interface WeeklyRow {
  employee_id: string;
  week_start: string;
  hours: number;
  reason: string;
}

interface RepeatRow {
  employee_id: string;
  employee_name: string;
  area_path: string;
  consecutive_weeks: number;
  total_hours: number;
}

interface RiskSummaryRow {
  employees: number;
  weeks: number;
  peak_hours: number;
  impossible_days: number;
}

const EMPTY_VALUE = "–";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SLOTS = ["00–06", "06–09", "09–17", "17–20", "20–24"];

// ─── RAW FUNCTIONS ────────────────────────────────────────

export async function getApprovalStatusRaw(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<EmployeeComplianceData["approvalStatus"]> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const rows = await sql<ApprovalRow[]>`
      SELECT t.status::int AS status, COUNT(*)::int AS cnt
      FROM overtime.overtime_transactions t
      WHERE t.year = ${yearNum} AND ${monthCondition} AND ${areaCondition}
        AND ${level1Condition} AND ${level2Condition}
      GROUP BY t.status;
    `;

    const avgRows = await sql<{ avg_hours: number | null }[]>`
      SELECT
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600
          )::numeric,
          1
        )::float AS avg_hours
      FROM overtime.overtime_transactions t
      WHERE t.year = ${yearNum} AND ${monthCondition} AND ${areaCondition}
        AND ${level1Condition} AND ${level2Condition}
        AND t.status IN (2, 3)
        AND t.updated_at IS NOT NULL
        AND t.created_at IS NOT NULL
        AND t.updated_at >= t.created_at;
    `;

    console.log(
      `[DB] getApprovalStatus in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const counts = new Map(rows.map((r) => [r.status, r.cnt]));
    const total = rows.reduce((s, r) => s + r.cnt, 0);

    const items = APPROVAL_STATUSES.map((cfg) => {
      const count = counts.get(cfg.status) ?? 0;
      const percentage =
        total > 0
          ? Math.round((count / total) * 1000) / 10
          : 0;
      return {
        label: cfg.label,
        count,
        percentage,
        color: cfg.color,
        variant: cfg.variant,
      };
    });

    const avgHours = avgRows[0]?.avg_hours ?? null;
    const avgApprovalTime =
      avgHours !== null ? `${avgHours.toLocaleString("id-ID")} jam` : EMPTY_VALUE;

    return {
      items,
      totalSubmissions: total,
      avgApprovalTime,
    };
  } catch (err) {
    console.error("[DB] Failed getApprovalStatus:", err);
    return {
      items: APPROVAL_STATUSES.map((cfg) => ({
        label: cfg.label,
        count: 0,
        percentage: 0,
        color: cfg.color,
        variant: cfg.variant,
      })),
      totalSubmissions: 0,
      avgApprovalTime: EMPTY_VALUE,
    };
  }
}

export async function getHeatmapRaw(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<HeatmapCell[]> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const rows = await sql<HeatRow[]>`
      WITH base AS (
        SELECT
          t.day_of_week::int AS day_of_week,
          CASE
            WHEN t.slot_00_06 > 0 THEN '00–06'
            WHEN t.slot_06_09 > 0 THEN '06–09'
            WHEN t.slot_09_17 > 0 THEN '09–17'
            WHEN t.slot_17_20 > 0 THEN '17–20'
            ELSE '20–24'
          END AS time_slot,
          t.durasi_lembur
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND ${monthCondition}
          AND ${areaCondition}
          AND ${level1Condition}
          AND ${level2Condition}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND t.day_of_week BETWEEN 1 AND 7
      )
      SELECT
        day_of_week,
        time_slot,
        ROUND(COALESCE(SUM(durasi_lembur), 0)::numeric, 0)::int AS heat
      FROM base
      GROUP BY day_of_week, time_slot;
    `;

    console.log(`[DB] getHeatmap in ${(performance.now() - start).toFixed(2)}ms`);

    const cellMap = new Map<string, number>();
    for (const r of rows) {
      cellMap.set(`${r.day_of_week}_${r.time_slot}`, r.heat);
    }

    const maxHeat = Math.max(...rows.map((r) => r.heat), 1);

    const cells: HeatmapCell[] = [];
    for (let d = 1; d <= 7; d++) {
      for (const slot of SLOTS) {
        const key = `${d}_${slot}`;
        const rawHours = cellMap.get(key) ?? 0;
        const normalized = rawHours > 0 ? (rawHours / maxHeat) * 100 : 0;
        const isWeekend = d >= 6;
        cells.push({
          day: DAYS[d - 1],
          slot,
          heat: Math.round(normalized),
          value: rawHours,
          isWeekend,
          label: `${rawHours.toLocaleString("id-ID")} jam`,
        });
      }
    }

    return cells;
  } catch (err) {
    console.error("[DB] Failed getHeatmap:", err);
    return [];
  }
}

export async function getComplianceRiskRaw(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<{ boxes: RiskBox[]; total: number }> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const [summaryRows, impossibleRows] = await Promise.all([
      sql<RiskSummaryRow[]>`
        WITH weekly_totals AS (
          SELECT
            t.employee_id,
            t.week_start,
            SUM(t.durasi_lembur) AS week_hours
          FROM overtime.overtime_transactions t
          WHERE t.year = ${yearNum}
            AND ${monthCondition}
            AND ${areaCondition}
            AND ${level1Condition}
            AND ${level2Condition}
            AND t.status IN (2, 3)
            AND t.durasi_lembur > 0
            AND t.week_start IS NOT NULL
          GROUP BY t.employee_id, t.week_start
        )
        SELECT
          COUNT(DISTINCT employee_id) FILTER (WHERE week_hours > 18)::int AS employees,
          COUNT(*) FILTER (WHERE week_hours > 18)::int AS weeks,
          COALESCE(MAX(week_hours), 0)::float AS peak_hours,
          0::int AS impossible_days
        FROM weekly_totals;
      `,
      sql<{ impossible_days: number }[]>`
        SELECT COUNT(*)::int AS impossible_days
        FROM (
          SELECT t.employee_id, t.tanggal
          FROM overtime.overtime_transactions t
          WHERE t.year = ${yearNum}
            AND ${monthCondition}
            AND ${areaCondition}
            AND ${level1Condition}
            AND ${level2Condition}
            AND t.status IN (2, 3)
            AND t.durasi_lembur > 0
            AND t.tanggal IS NOT NULL
          GROUP BY t.employee_id, t.tanggal
          HAVING SUM(t.durasi_lembur) > 16
        ) sub;
      `,
    ]);

    console.log(
      `[DB] getComplianceRisk in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const s = summaryRows[0] ?? {
      employees: 0,
      weeks: 0,
      peak_hours: 0,
      impossible_days: 0,
    };
    const impossibleDays = impossibleRows[0]?.impossible_days ?? 0;

    const empCount = s.employees ?? 0;
    const weekCount = s.weeks ?? 0;
    const peakHours = s.peak_hours ?? 0;

    const boxes: RiskBox[] = [
      {
        count: empCount,
        countLabel: `${empCount.toLocaleString("id-ID")} orang`,
        title: "Karyawan > 18 jam/minggu",
        description:
          empCount > 0
            ? "Pernah melampaui batas 18 jam lembur pada hari kerja dalam satu minggu."
            : "Tidak ada karyawan yang melampaui batas mingguan pada periode ini.",
        tone: "red",
        icon: "users",
      },
      {
        count: weekCount,
        countLabel: `${weekCount.toLocaleString("id-ID")} minggu-orang`,
        title: "Minggu terindikasi",
        description:
          weekCount > 0
            ? "Jumlah akumulasi minggu kerja di mana pelanggaran batas terjadi."
            : "Beban kerja mingguan berada dalam ambang batas wajar.",
        tone: "amber",
        icon: "clock",
      },
      {
        count: Math.round(peakHours),
        countLabel: peakHours > 0 ? `${formatHours(peakHours)} / mgg` : EMPTY_VALUE,
        title: "Jam lembur tertinggi",
        description:
          peakHours > 0
            ? "Rekor lembur mingguan tertinggi seorang karyawan pada periode aktif."
            : "Belum ada transaksi lembur yang tercatat pada periode ini.",
        tone: "amber",
        icon: "gauge",
      },
      {
        count: impossibleDays,
        countLabel: `${impossibleDays.toLocaleString("id-ID")} hari-orang`,
        title: "Durasi harian > 16 jam",
        description:
          impossibleDays > 0
            ? "Hari kerja dengan total lembur ekstrem yang memerlukan peninjauan khusus."
            : "Tidak ditemukan transaksi lembur harian yang melebihi batas ekstrem.",
        tone: impossibleDays > 0 ? "red" : "amber",
        icon: "clock",
      },
    ];

    const total = empCount + weekCount + impossibleDays;
    return { boxes, total };
  } catch (err) {
    console.error("[DB] Failed getComplianceRisk:", err);
    return {
      boxes: [
        {
          count: 0,
          countLabel: "0 orang",
          title: "Karyawan > 18 jam/minggu",
          description: "Data risiko belum tersedia.",
          tone: "red",
          icon: "users",
        },
        {
          count: 0,
          countLabel: "0 minggu-orang",
          title: "Minggu terindikasi",
          description: "Data risiko belum tersedia.",
          tone: "amber",
          icon: "clock",
        },
        {
          count: 0,
          countLabel: EMPTY_VALUE,
          title: "Jam lembur tertinggi",
          description: "Data risiko belum tersedia.",
          tone: "amber",
          icon: "gauge",
        },
        {
          count: 0,
          countLabel: "0 hari-orang",
          title: "Durasi harian > 16 jam",
          description: "Data risiko belum tersedia.",
          tone: "amber",
          icon: "clock",
        },
      ],
      total: 0,
    };
  }
}

export async function getEmployeeTableRaw(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<Employee[]> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const rows = await sql<EmployeeRow[]>`
      WITH weekly AS (
        SELECT
          t.employee_id,
          t.week_start,
          SUM(t.durasi_lembur) AS week_hours
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND ${monthCondition}
          AND ${areaCondition}
          AND ${level1Condition}
          AND ${level2Condition}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND t.week_start IS NOT NULL
        GROUP BY t.employee_id, t.week_start
      ),
      violations AS (
        SELECT employee_id, bool_or(week_hours > 18) AS over_weekly_limit
        FROM weekly
        GROUP BY employee_id
      ),
      reasons AS (
        SELECT DISTINCT ON (t.employee_id)
          t.employee_id,
          COALESCE(NULLIF(TRIM(t.uraian_pekerjaan), ''), 'Tidak ada uraian') AS uraian_pekerjaan
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND ${monthCondition}
          AND ${areaCondition}
          AND ${level1Condition}
          AND ${level2Condition}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
        ORDER BY t.employee_id, t.durasi_lembur DESC
      )
      SELECT
        t.employee_id,
        COALESCE(MAX(t.employee_name), t.employee_id) AS employee_name,
        COALESCE(MAX(t.jabatan), 'Karyawan') AS jabatan,
        COALESCE(
          MAX(
            CASE
              WHEN t.area = 'OPS' THEN 'OPS / ' || COALESCE(t.level1_name, t.level1_code, '–') || ' / ' || COALESCE(t.level2_name, t.level2_code, '–')
              WHEN t.area = 'HO' THEN 'HO / ' || COALESCE(t.level1_name, t.level1_code, '–') || ' / ' || COALESCE(t.level2_name, t.level2_code, '–')
              ELSE COALESCE(t.area, '–')
            END
          ),
          '–'
        ) AS area_path,
        COALESCE(MAX(r.uraian_pekerjaan), 'Tidak ada uraian') AS uraian_pekerjaan,
        COUNT(*)::int AS freq,
        ROUND(COALESCE(SUM(t.durasi_lembur), 0)::numeric, 1)::float AS total_hours,
        ROUND(COALESCE(SUM(t.biaya_lembur), 0)::numeric, 0)::float AS total_cost,
        COALESCE(bool_or(v.over_weekly_limit), false) AS over_weekly_limit,
        UPPER(SUBSTRING(COALESCE(MAX(t.employee_name), 'NA'), 1, 2)) AS initials
      FROM overtime.overtime_transactions t
      LEFT JOIN violations v ON v.employee_id = t.employee_id
      LEFT JOIN reasons r ON r.employee_id = t.employee_id
      WHERE t.year = ${yearNum}
        AND ${monthCondition}
        AND ${areaCondition}
        AND ${level1Condition}
        AND ${level2Condition}
        AND t.status IN (2, 3)
        AND t.durasi_lembur > 0
        AND t.employee_id IS NOT NULL
      GROUP BY t.employee_id
      ORDER BY total_hours DESC
      LIMIT 100;
    `;

    if (rows.length === 0) return [];

    const employeeIds = rows.map((r) => r.employee_id);

    const weeklyRows = await sql<WeeklyRow[]>`
      SELECT
        t.employee_id,
        t.week_start::text AS week_start,
        ROUND(COALESCE(SUM(t.durasi_lembur), 0)::numeric, 1)::float AS hours,
        COALESCE(
          (
            SELECT COALESCE(NULLIF(TRIM(sub.uraian_pekerjaan), ''), 'Tidak ada uraian')
            FROM overtime.overtime_transactions sub
            WHERE sub.employee_id = t.employee_id
              AND sub.week_start = t.week_start
              AND sub.year = ${yearNum}
              AND ${monthCondition}
              AND sub.status IN (2, 3)
              AND sub.durasi_lembur > 0
            ORDER BY sub.durasi_lembur DESC
            LIMIT 1
          ),
          'Tidak ada uraian'
        ) AS reason
      FROM overtime.overtime_transactions t
      WHERE t.year = ${yearNum}
        AND ${monthCondition}
        AND t.status IN (2, 3)
        AND t.durasi_lembur > 0
        AND t.week_start IS NOT NULL
        AND t.employee_id IN ${sql(employeeIds)}
      GROUP BY t.employee_id, t.week_start
      ORDER BY t.employee_id, t.week_start;
    `;

    console.log(
      `[DB] getEmployeeTable in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const weeklyByEmployee = new Map<string, WeeklyRow[]>();
    for (const w of weeklyRows) {
      const arr = weeklyByEmployee.get(w.employee_id) ?? [];
      arr.push(w);
      weeklyByEmployee.set(w.employee_id, arr);
    }

    return rows.map((r) => {
      const wList = weeklyByEmployee.get(r.employee_id) ?? [];
      const weekly = wList.map((w) => ({
        label: formatWeekLabel(w.week_start),
        short: formatWeekShort(w.week_start),
        hours: w.hours,
        reason: w.reason,
      }));

      const peakWeekly = wList.reduce<WeeklyRow | null>(
        (max, w) => (!max || w.hours > max.hours ? w : max),
        null,
      );

      const isHighHours = r.total_hours >= 40;
      const isOverWeekly = r.over_weekly_limit;

      let level = "Perlu dipantau";
      let tag: "risk" | "warn" = "warn";

      if (isHighHours || isOverWeekly) {
        level = "Melebihi 40 jam";
        tag = "risk";
      }

      return {
        initials: r.initials,
        name: r.employee_name,
        id: r.employee_id,
        role: r.jabatan,
        area: r.area_path,
        reason: r.uraian_pekerjaan,
        peakHeadline: peakWeekly
          ? `${formatHours(peakWeekly.hours)} pada ${formatWeekLabel(peakWeekly.week_start)}`
          : undefined,
        peakReason: peakWeekly?.reason,
        weekly,
        freq: r.freq,
        hours: idNum(r.total_hours, 1),
        cost: formatCost(r.total_cost),
        level,
        tag,
      };
    });
  } catch (err) {
    console.error("[DB] Failed getEmployeeTable:", err);
    return [];
  }
}

export async function getRepeatPatternsRaw(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<RepeatEmployee[]> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const rows = await sql<RepeatRow[]>`
      WITH weekly_active AS (
        SELECT DISTINCT
          t.employee_id,
          t.week_start::date AS week_start
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND ${monthCondition}
          AND ${areaCondition}
          AND ${level1Condition}
          AND ${level2Condition}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND t.week_start IS NOT NULL
      ),
      numbered AS (
        SELECT
          employee_id,
          week_start,
          (week_start - (ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY week_start) * 7)::int) AS grp
        FROM weekly_active
      ),
      streaks AS (
        SELECT
          employee_id,
          COUNT(*)::int AS consecutive_weeks
        FROM numbered
        GROUP BY employee_id, grp
      ),
      max_streaks AS (
        SELECT
          employee_id,
          MAX(consecutive_weeks)::int AS consecutive_weeks
        FROM streaks
        GROUP BY employee_id
        HAVING MAX(consecutive_weeks) >= 3
      ),
      employee_totals AS (
        SELECT
          t.employee_id,
          COALESCE(MAX(t.employee_name), t.employee_id) AS employee_name,
          COALESCE(
            MAX(
              CASE
                WHEN t.area = 'OPS' THEN 'OPS · ' || COALESCE(t.level1_name, t.level1_code, '–') || ' · ' || COALESCE(t.level2_name, t.level2_code, '–')
                WHEN t.area = 'HO' THEN 'HO · ' || COALESCE(t.level1_name, t.level1_code, '–') || ' · ' || COALESCE(t.level2_name, t.level2_code, '–')
                ELSE COALESCE(t.area, '–')
              END
            ),
            '–'
          ) AS area_path,
          ROUND(COALESCE(SUM(t.durasi_lembur), 0)::numeric, 0)::float AS total_hours
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND ${monthCondition}
          AND ${areaCondition}
          AND ${level1Condition}
          AND ${level2Condition}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
        GROUP BY t.employee_id
      )
      SELECT
        m.employee_id,
        e.employee_name,
        e.area_path,
        m.consecutive_weeks,
        e.total_hours
      FROM max_streaks m
      JOIN employee_totals e ON e.employee_id = m.employee_id
      ORDER BY m.consecutive_weeks DESC, e.total_hours DESC
      LIMIT 10;
    `;

    console.log(
      `[DB] getRepeatPatterns in ${(performance.now() - start).toFixed(2)}ms`,
    );

    return rows.map((r) => ({
      id: r.employee_id,
      name: r.employee_name,
      area: r.area_path,
      pattern: `${r.consecutive_weeks} minggu beruntun`,
      consecutiveWeeks: r.consecutive_weeks,
      hours: `${r.total_hours.toLocaleString("id-ID")} jam`,
      totalHours: r.total_hours,
    }));
  } catch (err) {
    console.error("[DB] Failed getRepeatPatterns:", err);
    return [];
  }
}

// ─── CACHED EXPORTS ───────────────────────────────────────

export async function getApprovalStatus(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<ApprovalStatusData> {
  return unstable_cache(
    async () => getApprovalStatusRaw(year, month, area, level1, level2),
    [
      "overtime-employee-approval-status",
      year,
      month,
      area,
      unitCacheKey(level1, level2),
    ],
    { revalidate: 300, tags: ["overtime-employee-compliance"] },
  )();
}

export async function getHeatmap(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<HeatmapCell[]> {
  return unstable_cache(
    async () => getHeatmapRaw(year, month, area, level1, level2),
    [
      "overtime-employee-heatmap",
      year,
      month,
      area,
      unitCacheKey(level1, level2),
    ],
    { revalidate: 300, tags: ["overtime-employee-compliance"] },
  )();
}

export async function getComplianceRisk(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<{ boxes: RiskBox[]; total: number }> {
  return unstable_cache(
    async () => getComplianceRiskRaw(year, month, area, level1, level2),
    [
      "overtime-employee-compliance-risk",
      year,
      month,
      area,
      unitCacheKey(level1, level2),
    ],
    { revalidate: 300, tags: ["overtime-employee-compliance"] },
  )();
}

export async function getEmployeeTable(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<Employee[]> {
  return unstable_cache(
    async () => getEmployeeTableRaw(year, month, area, level1, level2),
    [
      "overtime-employee-table",
      year,
      month,
      area,
      unitCacheKey(level1, level2),
    ],
    { revalidate: 300, tags: ["overtime-employee-compliance"] },
  )();
}

export async function getRepeatPatterns(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<RepeatEmployee[]> {
  return unstable_cache(
    async () => getRepeatPatternsRaw(year, month, area, level1, level2),
    [
      "overtime-employee-repeat-patterns",
      year,
      month,
      area,
      unitCacheKey(level1, level2),
    ],
    { revalidate: 300, tags: ["overtime-employee-compliance"] },
  )();
}
