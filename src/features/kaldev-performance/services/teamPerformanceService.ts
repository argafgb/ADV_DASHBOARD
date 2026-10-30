import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";
import { fmt, p1 } from "../utils/format";
import {
  SLA_TARGET,
  UNASSIGNED,
  MONTH_LONG,
  MONTH_SHORT,
  QUARTER_MONTHS,
  parseMonthIndices,
} from "../utils/sql-helpers";
import type {
  KaldevFilters,
  TeamPerformanceData,
  TeamQuery,
  DoneRow,
  SlaRow,
  TeamRow,
  MonthRow,
  TrendPoint,
  CategorySlice,
} from "../types/kaldev.types";

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Current calendar month index (0-based) and year, for partial detection. */
function nowInfo() {
  const d = new Date();
  return { monthIndex: d.getMonth(), year: d.getFullYear() };
}

/* ── Main implementation ──────────────────────────────────────────────── */

export async function getTeamRaw(
  filters: KaldevFilters,
  query: TeamQuery,
): Promise<TeamPerformanceData> {
  const yearNum = Number(filters.year);
  const now = nowInfo();
  const monthIndices = parseMonthIndices(filters.month);
  const qMonthIndices = QUARTER_MONTHS[query.quarter]; // [0,1,2] etc.

  // ── 0. As-of label ──────────────────────────────────────────────────
  const [asOfRow] = await sql<{ ts: Date | null }[]>`
    SELECT MAX(source_modified_at AT TIME ZONE 'Asia/Jakarta') AS ts
    FROM kaldev_performance.kaldev_projects
  `;
  const asOfDate = asOfRow?.ts;
  let asOfLbl = "—";
  if (asOfDate) {
    const d = new Date(asOfDate);
    const day = d.getDate();
    const mon = MONTH_LONG[d.getMonth()];
    const yr = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    asOfLbl = `${day} ${mon} ${yr} ${hh}.${mm}`;
  }

  // ── 1. Quarter Completion ───────────────────────────────────────────
  const [qm1, qm2, qm3] = qMonthIndices;

  const quarterDoneRaw = await sql<
    { programmer_name: string; mi: number; cnt: number }[]
  >`
    SELECT programmer_name,
           month_index AS mi,
           COUNT(*)::int AS cnt
    FROM kaldev_performance.kaldev_projects
    WHERE status = 'Selesai'
      AND year = ${yearNum}
      AND month_index IN (${qm1}, ${qm2}, ${qm3})
      AND programmer_name IS NOT NULL
    GROUP BY programmer_name, month_index
    ORDER BY programmer_name, month_index
  `;

  // Pivot into per-programmer totals across the 3 months
  const devMap = new Map<string, [number, number, number]>();
  for (const r of quarterDoneRaw) {
    if (!devMap.has(r.programmer_name))
      devMap.set(r.programmer_name, [0, 0, 0]);
    const arr = devMap.get(r.programmer_name)!;
    const idx = qMonthIndices.indexOf(r.mi);
    if (idx >= 0) arr[idx] = Number(r.cnt);
  }

  // Sort by total done DESC and take top 12
  const devEntries = [...devMap.entries()]
    .map(([name, [m1, m2, m3]]) => ({ name, m1, m2, m3, total: m1 + m2 + m3 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const doneRows: DoneRow[] = devEntries.map(({ name, m1, m2, m3 }) => ({
    name,
    m1,
    m2,
    m3,
  }));
  const doneMax = Math.max(1, ...devEntries.flatMap((e) => [e.m1, e.m2, e.m3]));

  const quarterLabels = qMonthIndices.map((mi) => MONTH_LONG[mi]);
  // Count total done across all programmers (not just top 12) for the note
  const totalQuarterDone = quarterDoneRaw.reduce(
    (a, r) => a + Number(r.cnt),
    0,
  );
  const noteFirst = MONTH_LONG[qm1];
  const noteLast = MONTH_LONG[qm3];

  // ── 2. SLA Per Programmer ──────────────────────────────────────────
  // Determine month filter for SLA scope
  const hasPeriod = monthIndices.length > 0;

  const slaRaw = await sql<
    { programmer_name: string | null; ok: number; no: number }[]
  >`
    SELECT programmer_name,
           COUNT(*) FILTER (WHERE achieved = TRUE)::int  AS ok,
           COUNT(*) FILTER (WHERE achieved = FALSE)::int AS no
    FROM kaldev_performance.kaldev_projects
    WHERE status = 'Selesai'
      AND year = ${yearNum}
      AND (${!hasPeriod} OR month_index = ANY(${monthIndices}))
      AND (${filters.from === "Semua"} OR source = ${filters.from})
    GROUP BY programmer_name
  `;

  // Separate assigned vs unassigned
  let unOk = 0;
  let unNo = 0;
  const slaAssigned: SlaRow[] = [];
  for (const r of slaRaw) {
    const ok = Number(r.ok);
    const no = Number(r.no);
    const total = ok + no;
    if (!r.programmer_name) {
      unOk = ok;
      unNo = no;
    } else {
      slaAssigned.push({
        name: r.programmer_name,
        ok,
        no,
        total,
        pct: total ? (ok / total) * 100 : 0,
      });
    }
  }
  // Sort worst performers first: pct ASC, then total DESC
  slaAssigned.sort((a, b) => a.pct - b.pct || b.total - a.total);

  const unScope = unOk + unNo;
  const allOk = slaAssigned.reduce((a, r) => a + r.ok, 0) + unOk;
  const allNo = slaAssigned.reduce((a, r) => a + r.no, 0) + unNo;
  const allTotal = allOk + allNo;

  const slaTotalRow: SlaRow | null = slaAssigned.length
    ? {
        name: "Total divisi",
        ok: allOk,
        no: allNo,
        total: allTotal,
        pct: allTotal ? (allOk / allTotal) * 100 : 0,
        kind: "total",
      }
    : null;

  const slaRangeText = allTotal
    ? `Total divisi dari ${fmt(allOk)} tercapai dibagi ${fmt(allTotal)} proyek selesai · belum ditugaskan ${fmt(unScope)} proyek (di luar peringkat)`
    : "Tidak ada proyek selesai pada periode ini";

  const unassignedText = unScope
    ? `${fmt(unScope)} proyek selesai · ${fmt(unOk)} tercapai · ${p1(unScope ? (unOk / unScope) * 100 : 0)}% — tidak masuk peringkat programmer.`
    : "Tidak ada proyek selesai tanpa developer pada periode ini.";

  // ── 3. Team Load ───────────────────────────────────────────────────
  const teamRaw = await sql<
    {
      programmer_name: string | null;
      q: number;
      p: number;
      today: number;
    }[]
  >`
    SELECT programmer_name,
           COUNT(*) FILTER (WHERE status = 'Antrean')::int     AS q,
           COUNT(*) FILTER (WHERE status = 'Dikerjakan')::int  AS p,
           COUNT(*) FILTER (WHERE status = 'Selesai'
                           AND finish_date::date = CURRENT_DATE)::int AS today
    FROM kaldev_performance.kaldev_projects
    WHERE (status IN ('Antrean', 'Dikerjakan')
           OR (status = 'Selesai' AND finish_date::date = CURRENT_DATE))
      AND (${filters.from === "Semua"} OR source = ${filters.from})
    GROUP BY programmer_name
  `;

  const teamRows: TeamRow[] = [];
  let unQ = 0;
  let unP = 0;
  let unToday = 0;
  for (const r of teamRaw) {
    const q = Number(r.q);
    const p = Number(r.p);
    const today = Number(r.today);
    const total = q + p;
    if (!r.programmer_name) {
      unQ = q;
      unP = p;
      unToday = today;
    } else {
      teamRows.push({ name: r.programmer_name, q, p, today, total });
    }
  }
  // Sort by total DESC
  teamRows.sort((a, b) => b.total - a.total);
  const teamMax = Math.max(1, ...teamRows.map((r) => r.total));

  const totalQ = teamRows.reduce((a, r) => a + r.q, 0) + unQ;
  const totalP = teamRows.reduce((a, r) => a + r.p, 0) + unP;
  const todaySum = teamRows.reduce((a, r) => a + r.today, 0) + unToday;

  const unassignedRow: TeamRow = {
    name: UNASSIGNED,
    q: unQ,
    p: unP,
    today: unToday,
    total: unQ + unP,
    kind: "un",
  };
  const totalRow: TeamRow = {
    name: "Total",
    q: totalQ,
    p: totalP,
    today: todaySum,
    total: totalQ + totalP,
    kind: "total",
  };

  // ── 4. Monthly Breakdown (all months in year) ──────────────────────
  const monthRaw = await sql<{ mi: number; ok: number; no: number }[]>`
    SELECT month_index AS mi,
           COUNT(*) FILTER (WHERE achieved = TRUE)::int  AS ok,
           COUNT(*) FILTER (WHERE achieved = FALSE)::int AS no
    FROM kaldev_performance.kaldev_projects
    WHERE status = 'Selesai'
      AND year = ${yearNum}
      AND (${filters.from === "Semua"} OR source = ${filters.from})
    GROUP BY month_index
    ORDER BY month_index
  `;

  const monthMap = new Map<number, { ok: number; no: number }>();
  for (const r of monthRaw) {
    monthMap.set(r.mi, { ok: Number(r.ok), no: Number(r.no) });
  }

  const monthRows: MonthRow[] = [];
  let mSumOk = 0;
  let mSumNo = 0;
  for (let mi = 0; mi < 12; mi++) {
    const data = monthMap.get(mi) ?? { ok: 0, no: 0 };
    const total = data.ok + data.no;
    const isPartial = mi === now.monthIndex && yearNum === now.year;
    mSumOk += data.ok;
    mSumNo += data.no;
    monthRows.push({
      name: MONTH_LONG[mi],
      ok: data.ok,
      no: data.no,
      total,
      pct: total ? (data.ok / total) * 100 : 0,
      partial: isPartial || undefined,
    });
  }
  const mTotal = mSumOk + mSumNo;
  const monthTotalRow: MonthRow | null = monthRows.length
    ? {
        name: `Total ${filters.year}`,
        ok: mSumOk,
        no: mSumNo,
        total: mTotal,
        pct: mTotal ? (mSumOk / mTotal) * 100 : 0,
        kind: "total",
      }
    : null;

  // Partial month note for rangeText
  const partialMonth = monthRows.find((r) => r.partial);
  const monthRangeText = partialMonth
    ? `* ${partialMonth.name} masih berjalan, data per ${asOfLbl}`
    : "";

  // ── 5. SLA Trend ──────────────────────────────────────────────────
  // Monthly ok/no for Selesai within the filtered period scope
  const trendScope = hasPeriod
    ? monthIndices
    : Array.from({ length: 12 }, (_, i) => i);

  const trendRaw = await sql<{ mi: number; ok: number; no: number }[]>`
    SELECT month_index AS mi,
           COUNT(*) FILTER (WHERE achieved = TRUE)::int  AS ok,
           COUNT(*) FILTER (WHERE achieved = FALSE)::int AS no
    FROM kaldev_performance.kaldev_projects
    WHERE status = 'Selesai'
      AND year = ${yearNum}
      AND month_index = ANY(${trendScope})
      AND (${filters.from === "Semua"} OR source = ${filters.from})
    GROUP BY month_index
    ORDER BY month_index
  `;

  const trendMap = new Map<number, { ok: number; no: number }>();
  for (const r of trendRaw) {
    trendMap.set(r.mi, { ok: Number(r.ok), no: Number(r.no) });
  }

  const trend: TrendPoint[] = trendScope
    .sort((a, b) => a - b)
    .map((mi) => {
      const data = trendMap.get(mi) ?? { ok: 0, no: 0 };
      const total = data.ok + data.no;
      const isPartial = mi === now.monthIndex && yearNum === now.year;
      return {
        key: MONTH_SHORT[mi],
        label: MONTH_SHORT[mi],
        full: MONTH_LONG[mi],
        partial: isPartial,
        ok: data.ok,
        no: data.no,
        pct: total ? (data.ok / total) * 100 : 0,
      };
    });

  const trendPartial = trend.find((t) => t.partial);
  const trendNote = trendPartial
    ? `* ${trendPartial.full} masih berjalan, data per ${asOfLbl}.`
    : null;

  // ── 6. Category Composition ────────────────────────────────────────
  const catRaw = await sql<{ kategori: string; cnt: number }[]>`
    SELECT kategori,
           COUNT(*)::int AS cnt
    FROM kaldev_performance.kaldev_projects
    WHERE status IN ('Antrean', 'Dikerjakan')
      AND (${filters.from === "Semua"} OR source = ${filters.from})
    GROUP BY kategori
    ORDER BY cnt DESC
  `;

  // Pisahkan kategori "Lainnya" agar tidak terduplikasi saat menggabungkan sisa kategori
  const nonLainnya = catRaw
    .filter((r) => r.kategori !== "Lainnya")
    .map((r) => ({ label: r.kategori, value: Number(r.cnt) }));
  const existingLainnya = Number(
    catRaw.find((r) => r.kategori === "Lainnya")?.cnt ?? 0,
  );

  const topCats = nonLainnya.slice(0, 5);
  const restCats = nonLainnya.slice(5);
  const restSum = restCats.reduce((a, c) => a + c.value, 0) + existingLainnya;
  const allCats =
    restSum > 0
      ? [...topCats, { label: "Lainnya", value: restSum }]
      : [...topCats];
  const catTotal = allCats.reduce((a, c) => a + c.value, 0);

  const slices: CategorySlice[] = allCats.map((c) => ({
    label: c.label,
    value: c.value,
    pct: catTotal ? Math.round((c.value / catTotal) * 100) : 0,
    detail:
      c.label === "Lainnya" && (restCats.length > 0 || existingLainnya > 0)
        ? `Gabungan kategori kecil: ${[
            ...restCats.map((r) => `${r.label} ${r.value}`),
            ...(existingLainnya > 0 ? [`Lainnya ${existingLainnya}`] : []),
          ].join(" · ")}`
        : null,
  }));

  // ── Assemble result ────────────────────────────────────────────────
  return {
    target: SLA_TARGET,
    asOfLabel: asOfLbl,
    quarter: {
      key: query.quarter,
      labels: quarterLabels,
      rows: doneRows,
      max: doneMax,
      note: totalQuarterDone
        ? `Total ${fmt(totalQuarterDone)} proyek selesai pada ${noteFirst} – ${noteLast}.`
        : "",
    },
    sla: {
      rows: slaAssigned,
      totalRow: slaTotalRow,
      rangeText: slaRangeText,
      unassignedText,
    },
    team: {
      rows: teamRows,
      unassignedRow,
      totalRow,
      max: teamMax,
    },
    month: {
      rows: monthRows,
      totalRow: monthTotalRow,
      rangeText: monthRangeText,
    },
    trend,
    trendNote,
    categories: { slices, total: catTotal },
  };
}

export async function getTeamPerformanceData(
  filters: KaldevFilters,
  query: TeamQuery,
): Promise<TeamPerformanceData> {
  return unstable_cache(
    async () => getTeamRaw(filters, query),
    ["kaldev-team", filters.year, filters.month, filters.from, query.quarter],
    { revalidate: 300, tags: ["kaldev-team"] },
  )();
}
