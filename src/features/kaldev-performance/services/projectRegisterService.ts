import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";
import { fmt } from "../utils/format";
import {
  statusTone,
  STATUS_EN,
  PROJECT_STATUSES,
  type ProjectStatus,
} from "../types/kaldev.types";
import {
  PAGE_SIZE,
  LANE_SIZE,
  formatTimestamp,
  parseMonthIndices,
} from "../utils/sql-helpers";
import type {
  KaldevFilters,
  RegisterData,
  RegisterQuery,
  Project,
  KanbanCard,
  KanbanLane,
} from "../types/kaldev.types";

/* ── DB row shape ────────────────────────────────────────────────────── */

interface ProjectRow {
  project_id: string;
  project_name: string;
  project_desc?: string | null;
  project_note?: string | null;
  basis: string;
  kategori: string;
  status: string;
  progress: number | null;
  programmer_name: string | null;
  implementor_name: string | null;
  source: string;
  created_at: Date | string | null;
  start_date: Date | string | null;
  planing_date: Date | string | null;
  finish_date: Date | string | null;
  achieved: boolean | null;
  late_days: number | null;
  idle_days: number | null;
  wait_days: number | null;
  flag: string | null;
  hold_reason: string | null;
  hold_since: Date | string | null;
  leader_name: string | null;
  source_modified_at: Date | string | null;
  month_index: number;
}

interface CountRow {
  status: string;
  cnt: string | number;
}

interface DistinctRow {
  val: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

const ACTIVE_STATUSES = [
  "Antrean",
  "Planned",
  "Queue",
  "Dikerjakan",
  "Ditahan",
] as const;
const PERIOD_STATUSES = [
  "Selesai",
  "Dibatalkan",
  "Cancel",
  "Cancelled",
  "canceled",
] as const;
const LANE_ORDER = PROJECT_STATUSES;

function normalizeStatus(st: string): ProjectStatus {
  if (st === "Cancel" || st === "Cancelled" || st === "canceled")
    return "Dibatalkan";
  if (st === "Planned" || st === "Queue") return "Antrean";
  if (PROJECT_STATUSES.includes(st as ProjectStatus))
    return st as ProjectStatus;
  return "Antrean";
}

function statusFilterSql(target: ProjectStatus) {
  if (target === "Dibatalkan") {
    return sql`status IN ('Dibatalkan', 'Cancel', 'Cancelled', 'canceled')`;
  }
  if (target === "Antrean") {
    return sql`status IN ('Antrean', 'Planned', 'Queue')`;
  }
  return sql`status = ${target}`;
}

/** Build the scoping WHERE fragment shared by every query. */
function scopeFragment(year: number, monthIndices: number[], source: string) {
  const hasMonths = monthIndices.length > 0;

  // Period filter for Selesai / Dibatalkan
  const periodFilter = hasMonths
    ? sql`AND year = ${year} AND month_index = ANY(${monthIndices})`
    : sql`AND year = ${year}`;

  // Active statuses always show; period statuses filtered by year+month
  const scopeWhere = sql`(
    status = ANY(${[...ACTIVE_STATUSES]})
    OR (status = ANY(${[...PERIOD_STATUSES]}) ${periodFilter})
  )`;

  // Source filter
  const sourceWhere = source !== "Semua" ? sql`AND source = ${source}` : sql``;

  return sql`${scopeWhere} ${sourceWhere}`;
}

/** Build a WHERE fragment for common filters (cat, basis, prog, q). */
function commonFragment(cat: string, basis: string, prog: string, q: string) {
  const catWhere = cat !== "Semua" ? sql`AND kategori = ${cat}` : sql``;
  const basisWhere = basis !== "Semua" ? sql`AND basis = ${basis}` : sql``;
  const progWhere =
    prog !== "Semua" ? sql`AND programmer_name = ${prog}` : sql``;
  const search = q.trim();
  const searchWhere = search
    ? sql`AND (
        project_id ILIKE ${"%" + search + "%"}
        OR project_name ILIKE ${"%" + search + "%"}
        OR programmer_name ILIKE ${"%" + search + "%"}
      )`
    : sql``;

  return sql`${catWhere} ${basisWhere} ${progWhere} ${searchWhere}`;
}

function cleanHtml(str: string | null | undefined): string | null {
  if (!str) return null;
  const text = str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

function toProject(r: ProjectRow): Project {
  const rawNote = cleanHtml(r.project_note);
  const rawDesc = cleanHtml(r.project_desc);
  const holdReason = (r.hold_reason || "").trim();

  let note = rawNote || holdReason;
  if (!note && rawDesc) {
    note = rawDesc.length > 280 ? rawDesc.slice(0, 277) + "…" : rawDesc;
  }
  if (!note) {
    if (r.status === "Ditahan") {
      note = "Proyek ditahan menunggu konfirmasi arahan pengerjaan.";
    } else if (r.status === "Selesai") {
      note = r.achieved
        ? "Selesai tepat waktu sesuai target SLA."
        : `Selesai melewati target SLA ${r.late_days ?? 0} hari.`;
    } else if (r.status === "Dikerjakan") {
      note =
        r.late_days && r.late_days > 0
          ? `Melewati target SLA ${r.late_days} hari, sedang dipercepat.`
          : "Sedang dikerjakan oleh programmer sesuai jadwal.";
    } else if (r.status === "Dibatalkan" || r.status === "Cancel") {
      note = "Proyek dibatalkan oleh pemohon atau digabung ke modul lain.";
    } else {
      note =
        !r.programmer_name || r.programmer_name.toLowerCase().includes("jeremy")
          ? "Menunggu penugasan programmer eksekutor."
          : "Menunggu antrean pengembangan programmer.";
    }
  }

  return {
    id: r.project_id,
    name: r.project_name,
    programmer: r.programmer_name ?? null,
    basis: r.basis,
    kategori: r.kategori,
    status: normalizeStatus(r.status),
    progress: r.progress,
    dibuat: formatTimestamp(r.created_at),
    mulai: r.start_date ? formatTimestamp(r.start_date) : null,
    target: r.planing_date ? formatTimestamp(r.planing_date) : null,
    selesai: r.finish_date ? formatTimestamp(r.finish_date) : null,
    late: r.late_days,
    flag: (r.flag as Project["flag"]) ?? null,
    note,
    source: r.source as "Bizdev" | "PIC",
    month: r.month_index,
    achieved: r.achieved,
    implementer: r.implementor_name ?? null,
    idle: r.idle_days ?? null,
    last: r.source_modified_at ? formatTimestamp(r.source_modified_at) : null,
    wait: r.wait_days ?? null,
    reason: r.hold_reason ?? null,
    since: r.hold_since ? formatTimestamp(r.hold_since) : null,
    approver: r.leader_name ?? null,
  };
}

function toKanbanCard(p: Project): KanbanCard {
  let flag: KanbanCard["flag"] = null;
  if (p.late != null && p.late > 0)
    flag = { text: `Terlambat ${p.late} hari`, tone: "red" };
  else if (p.late === 0 && p.status !== "Selesai")
    flag = { text: "Hari ini", tone: "amber" };
  else if (p.late != null && p.late < 0)
    flag = { text: `Sisa ${Math.abs(p.late)} hari`, tone: "amber" };
  else if (p.status === "Selesai" && p.late === 0)
    flag = { text: "Tepat waktu", tone: "green" };

  const short = (d: string | null) =>
    d ? d.split(" ").slice(0, 3).join(" ") : "—";

  const dateText =
    p.status === "Selesai"
      ? `Selesai ${short(p.selesai)}`
      : p.status === "Dikerjakan"
        ? p.target
          ? `Target ${short(p.target)}`
          : `Mulai ${short(p.mulai)}`
        : p.status === "Ditahan"
          ? `Sejak ${short(p.mulai)}`
          : `Dibuat ${short(p.dibuat)}`;

  return {
    id: p.id,
    name: p.name,
    programmer: p.programmer,
    basis: p.basis,
    kategori: p.kategori,
    dateText,
    progress: p.progress,
    showProgress: p.status === "Dikerjakan" || p.status === "Ditahan",
    flag,
  };
}

/* ── Columns selected for project rows ───────────────────────────────── */

const PROJECT_COLS = sql`
  project_id, project_name, basis, kategori, status, progress,
  programmer_name, implementor_name, source,
  created_at, start_date, planing_date, finish_date,
  achieved, late_days, idle_days, wait_days, flag,
  hold_reason, hold_since, leader_name, source_modified_at, month_index,
  project_note, project_desc
`;

/* ── Main query ──────────────────────────────────────────────────────── */

export async function getRegisterRaw(
  filters: KaldevFilters,
  query: RegisterQuery,
): Promise<RegisterData> {
  const year = Number(filters.year);
  const monthIndices = parseMonthIndices(filters.month);
  const scope = scopeFragment(year, monthIndices, filters.from);
  const common = commonFragment(query.cat, query.basis, query.prog, query.q);

  // ── 1. Status counts (scoped, no common filters) ─────────────────
  const countRows = await sql<CountRow[]>`
    SELECT
      CASE
        WHEN status IN ('Cancel', 'Cancelled', 'canceled', 'Dibatalkan') THEN 'Dibatalkan'
        WHEN status IN ('Planned', 'Queue', 'Antrean') THEN 'Antrean'
        ELSE status
      END AS status,
      COUNT(*)::int AS cnt
    FROM kaldev_performance.kaldev_projects
    WHERE ${scope}
    GROUP BY
      CASE
        WHEN status IN ('Cancel', 'Cancelled', 'canceled', 'Dibatalkan') THEN 'Dibatalkan'
        WHEN status IN ('Planned', 'Queue', 'Antrean') THEN 'Antrean'
        ELSE status
      END
  `;

  const statusCounts = { Semua: 0 } as Record<"Semua" | ProjectStatus, number>;
  for (const st of PROJECT_STATUSES) statusCounts[st] = 0;
  for (const r of countRows) {
    const st = r.status as ProjectStatus;
    const n = Number(r.cnt);
    if (PROJECT_STATUSES.includes(st)) {
      statusCounts[st] = n;
      statusCounts.Semua += n;
    }
  }

  // ── 2. Filter options (scoped, no common filters) ────────────────
  const [catRows, basisRows, progRows] = await Promise.all([
    sql<DistinctRow[]>`
      SELECT DISTINCT kategori AS val
      FROM kaldev_performance.kaldev_projects
      WHERE ${scope} AND kategori IS NOT NULL
      ORDER BY val
    `,
    sql<DistinctRow[]>`
      SELECT DISTINCT basis AS val
      FROM kaldev_performance.kaldev_projects
      WHERE ${scope} AND basis IS NOT NULL
      ORDER BY val
    `,
    sql<DistinctRow[]>`
      SELECT DISTINCT programmer_name AS val
      FROM kaldev_performance.kaldev_projects
      WHERE ${scope} AND programmer_name IS NOT NULL
      ORDER BY val
    `,
  ]);

  const options = {
    categories: catRows.map((r) => r.val),
    bases: basisRows.map((r) => r.val),
    programmers: progRows.map((r) => r.val),
  };

  // ── 3. Table view ────────────────────────────────────────────────
  const statusWhere =
    query.status !== "Semua"
      ? sql`AND ${statusFilterSql(query.status)}`
      : sql``;

  // Total count for pagination
  const [{ cnt: totalFiltered }] = await sql<[{ cnt: number }]>`
    SELECT COUNT(*)::int AS cnt
    FROM kaldev_performance.kaldev_projects
    WHERE ${scope} ${statusWhere} ${common}
  `;

  const total = Number(totalFiltered);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const offset = (page - 1) * PAGE_SIZE;

  const tableRows = await sql<ProjectRow[]>`
    SELECT ${PROJECT_COLS}
    FROM kaldev_performance.kaldev_projects
    WHERE ${scope} ${statusWhere} ${common}
    ORDER BY created_at DESC NULLS LAST
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const rows = tableRows.map(toProject);
  const rangeText = total
    ? `Menampilkan ${fmt(offset + 1)}–${fmt(offset + rows.length)} dari ${fmt(total)} proyek`
    : "Tidak ada proyek pada filter ini";

  // ── 4. Kanban view ───────────────────────────────────────────────
  // Each lane = scoped + common filters, split by status, limited
  const lanePromises = LANE_ORDER.map(async (st) => {
    const lim = query.laneLimits[st] ?? LANE_SIZE;
    const cond = statusFilterSql(st);

    // Count for this lane
    const [{ cnt: laneCount }] = await sql<[{ cnt: number }]>`
      SELECT COUNT(*)::int AS cnt
      FROM kaldev_performance.kaldev_projects
      WHERE ${scope} AND ${cond} ${common}
    `;
    const count = Number(laneCount);

    // Fetch cards (limit + 0 extra — we already have count)
    const cardRows = await sql<ProjectRow[]>`
      SELECT ${PROJECT_COLS}
      FROM kaldev_performance.kaldev_projects
      WHERE ${scope} AND ${cond} ${common}
      ORDER BY created_at DESC NULLS LAST
      LIMIT ${lim}
    `;

    const cards = cardRows.map(toProject).map(toKanbanCard);
    const remaining = count - lim;

    return {
      status: st,
      label: STATUS_EN[st],
      tone: statusTone(st),
      count,
      cards,
      hasMore: remaining > 0,
      moreText:
        remaining > 0
          ? `Tampilkan ${fmt(Math.min(LANE_SIZE, remaining))} lagi · sisa ${fmt(remaining)}`
          : "",
      nextLimit: lim + LANE_SIZE,
    } satisfies KanbanLane;
  });

  const lanes = await Promise.all(lanePromises);
  const kanbanTotal = lanes.reduce((sum, l) => sum + l.count, 0);

  return {
    statusCounts,
    options,
    table: { rows, total, page, pageSize: PAGE_SIZE, totalPages, rangeText },
    kanban: { lanes, total: kanbanTotal },
  };
}

/* ── Cached export ───────────────────────────────────────────────────── */

export async function getRegisterData(
  filters: KaldevFilters,
  query: RegisterQuery,
): Promise<RegisterData> {
  const laneKey = Object.entries(query.laneLimits)
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
  return unstable_cache(
    async () => getRegisterRaw(filters, query),
    [
      "kaldev-projects",
      filters.year,
      filters.month,
      filters.from,
      query.view,
      query.status,
      query.cat,
      query.basis,
      query.prog,
      query.q,
      String(query.page),
      laneKey,
    ],
    { revalidate: 300, tags: ["kaldev-projects"] },
  )();
}
