import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { parseMonthFilter } from "../utils/filter-utils";
import { unitConditions, unitCacheKey } from "../utils/unit-conditions";
import { formatHours, formatCost } from "../utils/formatters";
import type {
  OrgUnit,
  ComparisonRow,
  RatioData,
  ScatterPoint,
  OrganizationData,
} from "../types/organization.types";

interface UnitRow {
  name: string;
  total_hours: number;
  total_cost: number;
  children_json: string | null;
}

interface CompRow {
  area: string;
  total_hours: number;
}

interface RatioRow {
  name: string | null;
  hc: number | null;
  hours_per_person: number | null;
  total_hours: number;
}

const RATIO_TOP_N = 5;

interface ScatterRow {
  name: string;
  hours: number;
  cost: number;
}

// ─── RAW FUNCTIONS ────────────────────────────────────────

export async function getUnitRankingRaw(
  year: string,
  month: string,
  area: string,
): Promise<OrgUnit[]> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;

  try {
    const rows = await sql<UnitRow[]>`
      WITH unit_totals AS (
        SELECT
          t.level1_name AS name,
          SUM(t.durasi_lembur)::float AS total_hours,
          SUM(t.biaya_lembur)::float AS total_cost
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND t.level1_name IS NOT NULL
          AND ${monthCondition}
          AND ${areaCondition}
        GROUP BY t.level1_name
        ORDER BY total_hours DESC
        LIMIT 5
      ),
      children AS (
        SELECT
          t.level1_name AS parent_name,
          COALESCE(t.level2_name, t.level2_code) AS child_name,
          SUM(t.durasi_lembur)::float AS child_hours,
          SUM(t.biaya_lembur)::float AS child_cost
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND t.level1_name IN (SELECT name FROM unit_totals)
          AND (t.level2_name IS NOT NULL OR t.level2_code IS NOT NULL)
          AND ${monthCondition}
          AND ${areaCondition}
        GROUP BY t.level1_name, COALESCE(t.level2_name, t.level2_code)
      ),
      children_ranked AS (
        SELECT
          parent_name,
          child_name,
          child_hours,
          child_cost,
          ROW_NUMBER() OVER (PARTITION BY parent_name ORDER BY child_hours DESC) AS rn,
          MAX(child_hours) OVER (PARTITION BY parent_name) AS max_child_hours
        FROM children
      )
      SELECT
        u.name,
        u.total_hours,
        u.total_cost,
        COALESCE(
          json_agg(
            json_build_object(
              'name', c.child_name,
              'hours', c.child_hours,
              'cost', c.child_cost,
              'rank', ROUND((c.child_hours / NULLIF(c.max_child_hours, 0) * 100)::numeric, 0)
            )
            ORDER BY c.child_hours DESC
          ) FILTER (WHERE c.child_name IS NOT NULL AND c.rn <= 3),
          '[]'::json
        )::text AS children_json
      FROM unit_totals u
      LEFT JOIN children_ranked c ON c.parent_name = u.name
      GROUP BY u.name, u.total_hours, u.total_cost
      ORDER BY u.total_hours DESC;
    `;

    console.log(
      `[DB] getUnitRanking(${area}) in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const maxHours = rows[0]?.total_hours || 1;

    return rows.map((r) => {
      let children: string[] = [];
      try {
        if (r.children_json) {
          const parsed = JSON.parse(r.children_json) as {
            name: string;
            hours: number;
            cost: number;
            rank: number;
          }[];
          children = parsed.map(
            (c) =>
              `${c.name}|${formatCost(c.cost)} · ${formatHours(c.hours)}|${c.rank}`,
          );
        }
      } catch {
        children = [];
      }

      return {
        name: r.name,
        hours: formatHours(r.total_hours),
        cost: formatCost(r.total_cost),
        rank: Math.round((r.total_hours / maxHours) * 100),
        children,
      };
    });
  } catch (err) {
    console.error(`[DB] Failed getUnitRanking(${area}):`, err);
    return [];
  }
}

export async function getComparisonRaw(
  year: string,
  month: string,
  level1: string | null,
  level2: string | null,
): Promise<OrganizationData["comparison"]> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const rows = await sql<CompRow[]>`
      SELECT
        t.area,
        COALESCE(SUM(t.durasi_lembur), 0)::float AS total_hours
      FROM overtime.overtime_transactions t
      WHERE t.year = ${yearNum}
        AND t.status IN (2, 3)
        AND t.durasi_lembur > 0
        AND t.area IN ('OPS', 'HO')
        AND ${monthCondition}
        AND ${level1Condition}
        AND ${level2Condition}
      GROUP BY t.area;
    `;

    const topContributorRows = await sql<
      {
        label: string;
        hours: number;
        cost: number;
        share_pct: number;
      }[]
    >`
      WITH scoped AS (
        SELECT
          COALESCE(t.level1_name, t.level1_code) AS label,
          SUM(t.durasi_lembur)::float AS hours,
          SUM(t.biaya_lembur)::float AS cost
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND ${monthCondition}
          AND ${level1Condition}
          AND ${level2Condition}
          AND (t.level1_name IS NOT NULL OR t.level1_code IS NOT NULL)
        GROUP BY COALESCE(t.level1_name, t.level1_code)
      ),
      totals AS (
        SELECT SUM(hours) AS grand_hours FROM scoped
      )
      SELECT
        s.label,
        s.hours,
        s.cost,
        ROUND((s.hours / NULLIF(t.grand_hours, 0) * 100)::numeric, 1)::float AS share_pct
      FROM scoped s
      CROSS JOIN totals t
      ORDER BY s.hours DESC
      LIMIT 1;
    `;

    let topIncrease: OrganizationData["comparison"]["topIncrease"] = null;
    if (!isAll && months.length === 1) {
      const curMonth = months[0];
      const prevMonth = curMonth - 1;

      if (prevMonth >= 1) {
        const increaseRows = await sql<
          {
            label: string;
            cur_hours: number;
            prev_hours: number;
            delta_pct: number;
          }[]
        >`
          WITH monthly AS (
            SELECT
              COALESCE(t.level1_name, t.level1_code) AS label,
              SUM(CASE WHEN t.month = ${curMonth} THEN t.durasi_lembur ELSE 0 END)::float AS cur_hours,
              SUM(CASE WHEN t.month = ${prevMonth} THEN t.durasi_lembur ELSE 0 END)::float AS prev_hours
            FROM overtime.overtime_transactions t
            WHERE t.year = ${yearNum}
              AND t.status IN (2, 3)
              AND t.durasi_lembur > 0
              AND t.month IN (${curMonth}, ${prevMonth})
              AND ${level1Condition}
              AND ${level2Condition}
              AND (t.level1_name IS NOT NULL OR t.level1_code IS NOT NULL)
            GROUP BY COALESCE(t.level1_name, t.level1_code)
          )
          SELECT
            label,
            cur_hours,
            prev_hours,
            ROUND(((cur_hours - prev_hours) / NULLIF(prev_hours, 0) * 100)::numeric, 1)::float AS delta_pct
          FROM monthly
          WHERE prev_hours >= 100
            AND cur_hours > prev_hours
          ORDER BY delta_pct DESC
          LIMIT 1;
        `;

        const r = increaseRows[0];
        if (r) {
          topIncrease = {
            label: r.label,
            hours: r.cur_hours,
            prevHours: r.prev_hours,
            deltaPct: r.delta_pct,
          };
        }
      }
    }

    console.log(
      `[DB] getComparison in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const opsHours = rows.find((r) => r.area === "OPS")?.total_hours ?? 0;
    const hoHours = rows.find((r) => r.area === "HO")?.total_hours ?? 0;
    const grandTotal = opsHours + hoHours;

    const opsPct =
      grandTotal > 0 ? Math.round((opsHours / grandTotal) * 1000) / 10 : 0;
    const hoPct =
      grandTotal > 0 ? Math.round((hoHours / grandTotal) * 1000) / 10 : 0;

    const comparisonRows: ComparisonRow[] = [
      {
        label: "Operasional (OPS)",
        hours: opsHours,
        hoursLabel: formatHours(opsHours),
        percentage: opsPct,
        color: "brand",
      },
      {
        label: "Head Office (HO)",
        hours: hoHours,
        hoursLabel: formatHours(hoHours),
        percentage: hoPct,
        color: "purple",
      },
    ];

    const topC = topContributorRows[0];
    const topContributor: OrganizationData["comparison"]["topContributor"] =
      topC
        ? {
            label: topC.label,
            hours: topC.hours,
            cost: topC.cost,
            sharePct: topC.share_pct,
          }
        : null;

    return {
      rows: comparisonRows,
      totalHours: grandTotal,
      topContributor,
      topIncrease,
    };
  } catch (err) {
    console.error("[DB] Failed getComparison:", err);
    return {
      rows: [
        {
          label: "Operasional (OPS)",
          hours: 0,
          hoursLabel: "0 jam",
          percentage: 0,
          color: "brand",
        },
        {
          label: "Head Office (HO)",
          hours: 0,
          hoursLabel: "0 jam",
          percentage: 0,
          color: "purple",
        },
      ],
      totalHours: 0,
      topContributor: null,
      topIncrease: null,
    };
  }
}

export async function getRatioRaw(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<RatioData> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const rows = await sql<RatioRow[]>`
      WITH trx_hours AS (
        SELECT
          t.level1_code,
          MAX(t.level1_name) AS level1_name,
          SUM(t.durasi_lembur)::float AS total_hours
        FROM overtime.overtime_transactions t
        WHERE t.year = ${yearNum}
          AND t.status IN (2, 3)
          AND t.durasi_lembur > 0
          AND ${monthCondition}
          AND ${areaCondition}
          AND ${level1Condition}
          AND ${level2Condition}
          AND t.level1_code IS NOT NULL
        GROUP BY t.level1_code
      ),
      active_hc AS (
        SELECT
          e.org_unit_code,
          COUNT(*)::int AS hc
        FROM overtime.employees e
        WHERE e.status = 'A'
          AND e.org_unit_code IS NOT NULL
        GROUP BY e.org_unit_code
      )
      SELECT
        COALESCE(t.level1_name, t.level1_code) AS name,
        h.hc,
        ROUND((t.total_hours / NULLIF(h.hc, 0))::numeric, 1)::float AS hours_per_person,
        t.total_hours
      FROM trx_hours t
      LEFT JOIN active_hc h ON h.org_unit_code = t.level1_code;
    `;

    console.log(
      `[DB] getRatio in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const validRows = rows
      .filter((r): r is RatioRow & { hours_per_person: number } =>
        r.hours_per_person !== null && r.name !== null,
      )
      .sort((a, b) => b.hours_per_person - a.hours_per_person);

    const unmatchedRows = rows.filter((r) => r.hc === null || r.hc === 0);
    const unmatched = {
      units: unmatchedRows.length,
      hours: Math.round(unmatchedRows.reduce((s, r) => s + r.total_hours, 0)),
    };

    const top = validRows.slice(0, RATIO_TOP_N);
    const maxVal = top[0]?.hours_per_person || 1;

    const items = top.map((r) => ({
      name: r.name!,
      value: `${r.hours_per_person.toLocaleString("id-ID", { maximumFractionDigits: 1 })} jam`,
      fill: Math.round((r.hours_per_person / maxVal) * 100),
    }));

    return { items, unmatched };
  } catch (err) {
    console.error("[DB] Failed getRatio:", err);
    return { items: [], unmatched: { units: 0, hours: 0 } };
  }
}

export async function getScatterRaw(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<ScatterPoint[]> {
  const start = performance.now();
  const yearNum = parseInt(year, 10) || 2026;
  const { months, isAll } = parseMonthFilter(month);
  const monthCondition = isAll ? sql`TRUE` : sql`t.month IN ${sql(months)}`;
  const areaCondition = area === "ALL" ? sql`TRUE` : sql`t.area = ${area}`;
  const { level1Condition, level2Condition } = unitConditions(level1, level2);

  try {
    const rows = await sql<ScatterRow[]>`
      SELECT
        COALESCE(t.level1_name, t.level1_code) AS name,
        ROUND(SUM(t.durasi_lembur)::numeric, 0)::float AS hours,
        ROUND((SUM(t.biaya_lembur) / 1000000)::numeric, 1)::float AS cost
      FROM overtime.overtime_transactions t
      WHERE t.year = ${yearNum}
        AND t.status IN (2, 3)
        AND t.durasi_lembur > 0
        AND ${monthCondition}
        AND ${areaCondition}
        AND ${level1Condition}
        AND ${level2Condition}
        AND (t.level1_name IS NOT NULL OR t.level1_code IS NOT NULL)
      GROUP BY COALESCE(t.level1_name, t.level1_code)
      HAVING SUM(t.durasi_lembur) > 0;
    `;

    console.log(
      `[DB] getScatter in ${(performance.now() - start).toFixed(2)}ms`,
    );

    const maxHours = Math.max(...rows.map((r) => r.hours), 1);

    return rows.map((r) => ({
      name: r.name,
      hours: r.hours,
      cost: r.cost,
      radius: Math.max(6, Math.round((r.hours / maxHours) * 16) + 4),
    }));
  } catch (err) {
    console.error("[DB] Failed getScatter:", err);
    return [];
  }
}

// ─── CACHED EXPORTS ───────────────────────────────────────

export async function getOpsRanking(
  year: string,
  month: string,
): Promise<OrgUnit[]> {
  return unstable_cache(
    async () => getUnitRankingRaw(year, month, "OPS"),
    ["overtime-org-ranking-ops", year, month],
    { revalidate: 300, tags: ["overtime-organization"] },
  )();
}

export async function getHoRanking(
  year: string,
  month: string,
): Promise<OrgUnit[]> {
  return unstable_cache(
    async () => getUnitRankingRaw(year, month, "HO"),
    ["overtime-org-ranking-ho", year, month],
    { revalidate: 300, tags: ["overtime-organization"] },
  )();
}

export async function getComparison(
  year: string,
  month: string,
  level1: string | null,
  level2: string | null,
): Promise<OrganizationData["comparison"]> {
  return unstable_cache(
    async () => getComparisonRaw(year, month, level1, level2),
    ["overtime-org-comparison", year, month, unitCacheKey(level1, level2)],
    { revalidate: 300, tags: ["overtime-organization"] },
  )();
}

export async function getRatio(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<RatioData> {
  return unstable_cache(
    async () => getRatioRaw(year, month, area, level1, level2),
    ["overtime-org-ratio", year, month, area, unitCacheKey(level1, level2)],
    { revalidate: 300, tags: ["overtime-organization"] },
  )();
}

export async function getScatter(
  year: string,
  month: string,
  area: string,
  level1: string | null,
  level2: string | null,
): Promise<ScatterPoint[]> {
  return unstable_cache(
    async () => getScatterRaw(year, month, area, level1, level2),
    ["overtime-org-scatter", year, month, area, unitCacheKey(level1, level2)],
    { revalidate: 300, tags: ["overtime-organization"] },
  )();
}
