import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";
import { fmt, p1, pct1, hrefWith } from "../utils/format";
import {
  SLA_TARGET,
  UNASSIGNED,
  MONTH_LONG,
  MONTH_SHORT,
  parseMonthIndices,
  asOfLabel,
  periodLabel as buildPeriodLabel,
  bulanLabel as buildBulanLabel,
} from "../utils/sql-helpers";
import type {
  KaldevFilters,
  OverviewData,
  AttentionItem,
  DeltaInfo,
  SlaBreach,
  MixSlice,
  TrendPoint,
  IntakeMonth,
  TeamLoadRow,
  CategoryRow,
} from "../types/kaldev.types";

/* ── helpers ──────────────────────────────────────────────────────────── */

function srcFrag(from: string) {
  return from !== "Semua" ? sql`AND source = ${from}` : sql``;
}

/* ── Overview ─────────────────────────────────────────────────────────── */

export async function getOverviewRaw(filters: KaldevFilters): Promise<OverviewData> {
  const yearNum = Number(filters.year);
  const selIdx = parseMonthIndices(filters.month);
  const monthPick = selIdx.length > 0;
  const src = srcFrag(filters.from);
  const now = new Date();
  const curMonthIdx = now.getMonth();
  const curYear = now.getFullYear();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  /* ── 1. Parallel queries ────────────────────────────────────────────── */

  const monthFilter = monthPick ? sql`AND month_index = ANY(${selIdx})` : sql``;

  const [
    kpiRows,
    flagRows,
    slaAgg,
    breachRows,
    trendRows,
    attCounts,
    busiestRows,
    intakeRows,
    teamLoadRows,
    teamTodayRows,
    categoryRows,
    freshness,
    maxMonthRow,
  ] = await Promise.all([
    // KPI: counts by status within year (+ month filter for Selesai)
    sql<
      {
        queue_only: number;
        planned: number;
        queue: number;
        prog: number;
        done: number;
        ach: number;
        hold: number;
        cancel: number;
      }[]
    >`
      SELECT
        COUNT(*) FILTER (WHERE status = 'Antrean')::int AS queue_only,
        COUNT(*) FILTER (WHERE status = 'Planned')::int AS planned,
        COUNT(*) FILTER (WHERE status IN ('Antrean', 'Planned'))::int AS queue,
        COUNT(*) FILTER (WHERE status = 'Dikerjakan')::int AS prog,
        COUNT(*) FILTER (WHERE status = 'Selesai' ${monthFilter})::int AS done,
        COUNT(*) FILTER (WHERE status = 'Selesai' AND achieved = TRUE ${monthFilter})::int AS ach,
        COUNT(*) FILTER (WHERE status = 'Ditahan')::int AS hold,
        COUNT(*) FILTER (WHERE status IN ('Cancel', 'Dibatalkan') ${monthFilter})::int AS cancel
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum} ${src}
    `,

    // Flag counts: hanya berdasar start_date dan planing_date riil
    sql<{ late: number; near: number }[]>`
      SELECT
        COUNT(*) FILTER (
          WHERE start_date IS NOT NULL
            AND planing_date IS NOT NULL
            AND status IN ('Antrean','Dikerjakan','Planned')
            AND (CURRENT_DATE > planing_date::date)
        )::int AS late,
        COUNT(*) FILTER (
          WHERE start_date IS NOT NULL
            AND planing_date IS NOT NULL
            AND status IN ('Antrean','Dikerjakan','Planned')
            AND (CURRENT_DATE <= planing_date::date AND planing_date::date - CURRENT_DATE <= 3)
        )::int AS near
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        ${src}
    `,

    // SLA aggregation for done in scope
    sql<{ total: number; ok: number; no: number }[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE achieved = TRUE)::int AS ok,
        COUNT(*) FILTER (WHERE achieved = FALSE)::int AS no
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        AND status = 'Selesai'
        ${monthFilter}
        ${src}
    `,

    // SLA breaches
    sql<
      {
        project_name: string;
        programmer_name: string | null;
        finish_date: Date | null;
        late_days: number | null;
      }[]
    >`
      SELECT project_name, programmer_name, finish_date, late_days
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        AND status = 'Selesai'
        AND achieved = FALSE
        ${monthFilter}
        ${src}
      ORDER BY late_days DESC NULLS LAST
    `,

    // SLA trend: monthly ok/no for Selesai in the year (all months for trend)
    sql<{ mi: number; ok: number; no: number }[]>`
      SELECT
        month_index::int AS mi,
        COUNT(*) FILTER (WHERE achieved = TRUE)::int AS ok,
        COUNT(*) FILTER (WHERE achieved = FALSE)::int AS no
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        AND status = 'Selesai'
        ${src}
      GROUP BY month_index
      ORDER BY month_index
    `,

    // Attention counts: rules start_date riil, exclude planning from idle, Jeremy as unassigned
    sql<
      {
        late: number;
        near: number;
        nodev: number;
        idle: number;
        hold: number;
      }[]
    >`
      SELECT
        COUNT(*) FILTER (
          WHERE start_date IS NOT NULL
            AND planing_date IS NOT NULL
            AND status IN ('Antrean','Dikerjakan','Planned')
            AND (CURRENT_DATE > planing_date::date)
        )::int AS late,
        COUNT(*) FILTER (
          WHERE start_date IS NOT NULL
            AND planing_date IS NOT NULL
            AND status IN ('Antrean','Dikerjakan','Planned')
            AND (CURRENT_DATE <= planing_date::date AND planing_date::date - CURRENT_DATE <= 3)
        )::int AS near,
        COUNT(*) FILTER (
          WHERE status IN ('Antrean','Planned')
            AND (programmer_name IS NULL OR programmer_name ILIKE '%Jeremy Vincent%')
        )::int AS nodev,
        COUNT(*) FILTER (
          WHERE status = 'Dikerjakan'
            AND start_date IS NOT NULL
            AND start_date::date <= CURRENT_DATE
            AND (CURRENT_DATE - COALESCE(source_modified_at, created_at)::date) > 7
        )::int AS idle,
        COUNT(*) FILTER (WHERE status = 'Ditahan')::int AS hold
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum} ${src}
    `,

    // Busiest programmer (most queue, 0 in-progress)
    sql<{ name: string; q: number }[]>`
      SELECT
        programmer_name AS name,
        COUNT(*) FILTER (WHERE status = 'Antrean')::int AS q
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        AND status IN ('Antrean','Dikerjakan')
        AND programmer_name IS NOT NULL
        ${src}
      GROUP BY programmer_name
      HAVING COUNT(*) FILTER (WHERE status = 'Dikerjakan') = 0
         AND COUNT(*) FILTER (WHERE status = 'Antrean') > 0
      ORDER BY COUNT(*) FILTER (WHERE status = 'Antrean') DESC
      LIMIT 1
    `,

    // Intake: monthly breakdown by status
    sql<
      {
        mi: number;
        done: number;
        progress: number;
        queue: number;
        other: number;
        total: number;
      }[]
    >`
      SELECT
        month_index::int AS mi,
        COUNT(*) FILTER (WHERE status = 'Selesai')::int AS done,
        COUNT(*) FILTER (WHERE status = 'Dikerjakan')::int AS progress,
        COUNT(*) FILTER (WHERE status = 'Antrean')::int AS queue,
        COUNT(*) FILTER (WHERE status NOT IN ('Selesai','Dikerjakan','Antrean'))::int AS other,
        COUNT(*)::int AS total
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum} ${src}
      GROUP BY month_index
      ORDER BY month_index
    `,

    // Team load: per programmer active counts
    sql<{ name: string; q: number; p: number }[]>`
      SELECT
        programmer_name AS name,
        COUNT(*) FILTER (WHERE status = 'Antrean')::int AS q,
        COUNT(*) FILTER (WHERE status = 'Dikerjakan')::int AS p
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        AND status IN ('Antrean','Dikerjakan')
        AND programmer_name IS NOT NULL
        ${src}
      GROUP BY programmer_name
    `,

    // Team today done: Selesai where finish_date is today
    sql<{ name: string; n: number }[]>`
      SELECT
        programmer_name AS name,
        COUNT(*)::int AS n
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        AND status = 'Selesai'
        AND finish_date::date = ${todayDate}
        AND programmer_name IS NOT NULL
        ${src}
      GROUP BY programmer_name
    `,

    // Categories: active projects by kategori
    sql<{ label: string; value: number }[]>`
      SELECT kategori AS label, COUNT(*)::int AS value
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
        AND status IN ('Antrean','Dikerjakan')
        ${src}
      GROUP BY kategori
      ORDER BY COUNT(*) DESC
    `,

    // Freshness
    sql<{ ts: Date | null }[]>`
      SELECT MAX(synced_at) AS ts
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum}
    `,

    // Max month_index with data (for period label)
    sql<{ mx: number }[]>`
      SELECT MAX(month_index)::int AS mx
      FROM kaldev_performance.kaldev_projects
      WHERE year = ${yearNum} ${src}
    `,
  ]);

  /* ── 2. Extract scalar results ──────────────────────────────────────── */

  const queue = kpiRows[0]?.queue ?? 0;
  const queueOnly = kpiRows[0]?.queue_only ?? 0;
  const plannedCount = kpiRows[0]?.planned ?? 0;
  const prog = kpiRows[0]?.prog ?? 0;
  const doneCount = kpiRows[0]?.done ?? 0;
  const holdCount = kpiRows[0]?.hold ?? 0;
  const cancelCount = kpiRows[0]?.cancel ?? 0;
  const lateCount = flagRows[0]?.late ?? 0;
  const nearCount = flagRows[0]?.near ?? 0;

  const slaTotalDone = slaAgg[0]?.total ?? 0;
  const slaOk = slaAgg[0]?.ok ?? 0;
  const slaNo = slaAgg[0]?.no ?? 0;

  const maxMi: number = maxMonthRow[0]?.mx ?? 0;

  /* ── 3. asOfLabel ───────────────────────────────────────────────────── */

  const freshTs = freshness[0]?.ts ?? new Date();
  const asOf = asOfLabel(freshTs);

  /* ── 4. KPI ─────────────────────────────────────────────────────────── */

  const selLo = selIdx.length ? selIdx[0] : -1;
  const selHi = selIdx.length ? selIdx[selIdx.length - 1] : -1;
  const bLabel = buildBulanLabel(selIdx);

  const doneSub = monthPick ? `pada ${bLabel}` : `sepanjang ${filters.year}`;

  /* Done delta */
  let doneDelta: DeltaInfo | null = null;
  if (monthPick && selLo - selIdx.length >= 0) {
    const span = selHi - selLo + 1;
    const prevLo = selLo - span;
    const prevHi = selLo - 1;
    const prevIndices: number[] = [];
    for (let i = prevLo; i <= prevHi; i++) prevIndices.push(i);

    const trendLookup = new Map<number, { ok: number; no: number }>();
    for (const r of trendRows) {
      trendLookup.set(r.mi, { ok: r.ok, no: r.no });
    }

    let currentSum = 0;
    for (const mi of selIdx) {
      const t = trendLookup.get(mi);
      currentSum += t ? t.ok + t.no : 0;
    }
    let previousSum = 0;
    for (const mi of prevIndices) {
      const t = trendLookup.get(mi);
      previousSum += t ? t.ok + t.no : 0;
    }
    doneDelta = { current: currentSum, previous: previousSum, span };
  }

  /* ── 5. SLA card ────────────────────────────────────────────────────── */

  const slaPct = slaTotalDone ? (slaOk / slaTotalDone) * 100 : 0;
  const gap = SLA_TARGET - slaPct;

  const breaches: SlaBreach[] = breachRows.map((r) => ({
    label: r.project_name,
    detail: `${r.programmer_name ?? UNASSIGNED} · ${
      r.finish_date
        ? (() => {
            const dt =
              typeof r.finish_date === "string"
                ? new Date(r.finish_date)
                : r.finish_date;
            const day = dt.getDate();
            const mon = MONTH_LONG[dt.getMonth()];
            const yr = dt.getFullYear();
            return `${day} ${mon} ${yr}`;
          })()
        : "—"
    }`,
    value:
      r.late_days && r.late_days > 0
        ? `+${r.late_days} hari`
        : "Tidak tercapai",
  }));

  const pLabel = buildPeriodLabel(filters.year, selIdx, maxMi);

  /* ── 6. SLA Trend ───────────────────────────────────────────────────── */

  const trendMap = new Map<number, { ok: number; no: number }>();
  for (const r of trendRows) {
    trendMap.set(r.mi, { ok: r.ok, no: r.no });
  }

  const trendMonthIndices: number[] = [];
  if (monthPick) {
    for (const mi of selIdx) trendMonthIndices.push(mi);
  } else {
    for (let i = 0; i <= maxMi; i++) {
      if (trendMap.has(i)) trendMonthIndices.push(i);
    }
  }

  const isCurrentYear = yearNum === curYear;

  const trend: TrendPoint[] = trendMonthIndices.map((mi) => {
    const t = trendMap.get(mi) ?? { ok: 0, no: 0 };
    const tot = t.ok + t.no;
    return {
      key: MONTH_SHORT[mi],
      label: MONTH_SHORT[mi],
      full: `${MONTH_LONG[mi]} ${filters.year}`,
      partial: isCurrentYear && mi === curMonthIdx,
      ok: t.ok,
      no: t.no,
      pct: tot ? (t.ok / tot) * 100 : 0,
    };
  });

  const partialPoint = trend.find((p) => p.partial);
  const trendNote = partialPoint
    ? `* ${partialPoint.full} masih berjalan, data per ${asOf}.`
    : null;

  /* ── 7. Attention list ──────────────────────────────────────────────── */

  const base = { year: filters.year, month: filters.month, from: filters.from };
  const nLate = attCounts[0]?.late ?? 0;
  const nNear = attCounts[0]?.near ?? 0;
  const nNoDev = attCounts[0]?.nodev ?? 0;
  const nIdle = attCounts[0]?.idle ?? 0;
  const nHold = attCounts[0]?.hold ?? 0;

  const busiestDev = busiestRows[0];
  const teamText = busiestDev
    ? `${busiestDev.name}: ${busiestDev.q} antrean, 0 dikerjakan`
    : "Beban kerja tim merata";

  const attention: AttentionItem[] = [
    {
      kind: "late",
      tone: "red",
      text: `${nLate} proyek melewati target SLA`,
      href: hrefWith("/dashboard/kaldev-performance/action-required", base, { tab: "sla" }),
    },
    {
      kind: "near",
      tone: "amber",
      text: `${nNear} proyek mendekati target`,
      href: hrefWith("/dashboard/kaldev-performance/action-required", base, { tab: "sla" }),
    },
    {
      kind: "nodev",
      tone: "amber",
      text: `${nNoDev} proyek belum memiliki programmer`,
      href: hrefWith("/dashboard/kaldev-performance/action-required", base, { tab: "noprog" }),
    },
    {
      kind: "idle",
      tone: "blue",
      text: `${nIdle} proyek tanpa progres lebih dari 7 hari`,
      href: hrefWith("/dashboard/kaldev-performance/action-required", base, { tab: "idle" }),
    },
    {
      kind: "hold",
      tone: "amber",
      text: `${nHold} proyek ditahan menunggu keputusan`,
      href: hrefWith("/dashboard/kaldev-performance/action-required", base, { tab: "hold" }),
    },
    {
      kind: "team",
      tone: "blue",
      text: teamText,
      href: hrefWith("/dashboard/kaldev-performance/team-performance", base, { tab: "beban" }),
    },
  ];

  /* ── 8. Status mix ──────────────────────────────────────────────────── */

  const mixTotal = doneCount + prog + queueOnly + plannedCount || 1;
  const mixDefs: Omit<MixSlice, "pct">[] = [
    {
      key: "done",
      label: "Selesai",
      value: doneCount,
      tipUnit: "Proyek selesai",
      tipSub: "Sudah diserahkan pada periode terpilih",
    },
    {
      key: "prog",
      label: "Dikerjakan",
      value: prog,
      tipUnit: "Proyek dikerjakan",
      tipSub: "Sedang berjalan dengan programmer",
    },
    {
      key: "queue",
      label: "Antrean",
      value: queueOnly,
      tipUnit: "Proyek antrean",
      tipSub: "Dalam antrean pengerjaan programmer",
    },
    {
      key: "planned",
      label: "Planned",
      value: plannedCount,
      tipUnit: "Proyek direncanakan",
      tipSub: "Dalam tahap perencanaan/intake",
    },
  ];
  const mixSlices: MixSlice[] = mixDefs.map((s) => ({
    ...s,
    pct: Math.round((s.value / mixTotal) * 100),
  }));

  /* ── 9. Intake chart ────────────────────────────────────────────────── */

  const intakeMap = new Map<
    number,
    {
      done: number;
      progress: number;
      queue: number;
      other: number;
      total: number;
    }
  >();
  for (const r of intakeRows) {
    intakeMap.set(r.mi, {
      done: r.done,
      progress: r.progress,
      queue: r.queue,
      other: r.other,
      total: r.total,
    });
  }

  const intakeMonthIndices: number[] = [];
  if (monthPick) {
    for (const mi of selIdx) intakeMonthIndices.push(mi);
  } else {
    for (let i = 0; i <= maxMi; i++) {
      if (intakeMap.has(i)) intakeMonthIndices.push(i);
    }
  }

  const intake: IntakeMonth[] = intakeMonthIndices.map((mi) => {
    const r = intakeMap.get(mi) ?? {
      done: 0,
      progress: 0,
      queue: 0,
      other: 0,
      total: 0,
    };
    return {
      key: MONTH_SHORT[mi],
      label: MONTH_SHORT[mi],
      full: `${MONTH_LONG[mi]} ${filters.year}`,
      partial: isCurrentYear && mi === curMonthIdx,
      done: r.done,
      progress: r.progress,
      queue: r.queue,
      other: r.other,
      total: r.total,
    };
  });

  /* ── 10. Team load ──────────────────────────────────────────────────── */

  const todayMap = new Map<string, number>();
  for (const r of teamTodayRows) {
    todayMap.set(r.name, r.n);
  }

  const teamLoad: TeamLoadRow[] = teamLoadRows
    .map((r) => ({
      name: r.name,
      q: r.q,
      p: r.p,
      today: todayMap.get(r.name) ?? 0,
      total: r.q + r.p,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const teamMax = teamLoad.length ? teamLoad[0].total : 1;

  /* ── 11. Categories ─────────────────────────────────────────────────── */

  const categories: CategoryRow[] = categoryRows.map((r) => ({
    label: r.label ?? "Tidak dikategorikan",
    value: r.value,
  }));

  /* ── 12. Assemble OverviewData ──────────────────────────────────────── */

  return {
    asOfLabel: asOf,
    yearLabel: filters.year,
    kpi: {
      aktif: fmt(queue + prog),
      aktifSub: `${fmt(queue)} antrean · ${fmt(prog)} dikerjakan`,
      late: fmt(lateCount),
      near: fmt(nearCount),
      done: fmt(doneCount),
      doneSub,
      doneDelta,
    },
    sla: {
      pct: slaPct,
      pctLabel: pct1(slaPct),
      target: SLA_TARGET,
      periodLabel: pLabel,
      achievedCount: fmt(slaOk),
      notAchievedCount: fmt(slaNo),
      gapText: gap > 0 ? `kurang ${p1(gap)} poin` : "target terlampaui",
      achieved: gap <= 0,
      breachTitle: `${fmt(breachRows.length)} proyek melewati target`,
      breaches,
    },
    trend,
    trendNote,
    attention: attention.slice(0, 5),
    mix: {
      slices: mixSlices,
      total: mixTotal,
      subtitle: `Selesai ${monthPick ? `pada ${bLabel}` : `sepanjang ${filters.year}`}, ditambah beban aktif saat ini`,
      holdCount,
      cancelCount,
    },
    intake,
    teamLoad,
    teamMax,
    categories,
  };
}

export async function getOverviewData(
  filters: KaldevFilters,
): Promise<OverviewData> {
  return unstable_cache(
    async () => getOverviewRaw(filters),
    ["kaldev-overview", filters.year, filters.month, filters.from],
    { revalidate: 300, tags: ["kaldev-overview"] },
  )();
}
