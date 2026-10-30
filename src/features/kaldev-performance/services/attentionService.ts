import "server-only";
import { unstable_cache } from "next/cache";

import { sql } from "@/lib/db";
import {
  formatDateShort,
  formatTimestamp,
} from "../utils/sql-helpers";
import type {
  AttentionData,
  AttentionTab,
  DueRow,
  NoDevRow,
  IdleRow,
  HoldItem,
  KaldevFilters,
} from "../types/kaldev.types";

// ── Row shapes returned by each SQL query ────────────────────────────

interface DueDbRow {
  project_id: string;
  project_name: string;
  programmer_name: string | null;
  planing_date: Date | null;
  days: number;
}

interface NoDevDbRow {
  project_id: string;
  project_name: string;
  programmer_name: string | null;
  basis: string;
  kategori: string;
  created_at: Date | null;
  created_by_name: string | null;
  wait_days: number;
}

interface IdleDbRow {
  project_id: string;
  project_name: string;
  implementor_name: string | null;
  programmer_name: string | null;
  source_modified_at: Date | null;
  idle_days: number;
}

interface HoldDbRow {
  project_id: string;
  project_name: string;
  programmer_name: string | null;
  basis: string;
  hold_since: Date | null;
  start_date: Date | null;
  leader_name: string | null;
  hold_reason: string | null;
}

interface CountDbRow {
  sla: number;
  noprog: number;
  idle: number;
  hold: number;
}

// ── Source filter fragment ────────────────────────────────────────────

function sourceFilter(from: string) {
  return from !== "Semua" ? sql`AND source = ${from}` : sql``;
}

// ── Core implementation ──────────────────────────────────────────────

export async function getAttentionRaw(filters: KaldevFilters): Promise<AttentionData> {
  const src = sourceFilter(filters.from);

  const [countRows, dueRows, noDevRows, idleRows, holdRows] = await Promise.all(
    [
      // ── Counts ───────────────────────────────────────────────────
      sql<CountDbRow[]>`
        SELECT
          COUNT(*) FILTER (
            WHERE start_date IS NOT NULL
              AND planing_date IS NOT NULL
              AND status IN ('Antrean','Dikerjakan','Planned')
              AND ((CURRENT_DATE > planing_date::date) OR (planing_date::date - CURRENT_DATE <= 3))
          )::int AS sla,
          COUNT(*) FILTER (
            WHERE status IN ('Antrean','Planned')
              AND (programmer_name IS NULL OR programmer_name ILIKE '%Jeremy Vincent%')
          )::int AS noprog,
          COUNT(*) FILTER (
            WHERE status = 'Dikerjakan'
              AND start_date IS NOT NULL
              AND start_date::date <= CURRENT_DATE
              AND (CURRENT_DATE - COALESCE(source_modified_at, created_at)::date) > 7
          )::int AS idle,
          COUNT(*) FILTER (WHERE status = 'Ditahan')::int AS hold
        FROM kaldev_performance.kaldev_projects
        WHERE 1=1 ${src};
      `,

      // ── Tab 1: SLA (due / near-due: hanya berdasar start_date & planing_date riil) ──
      sql<DueDbRow[]>`
        SELECT
          project_id,
          project_name,
          programmer_name,
          planing_date,
          (CURRENT_DATE - planing_date::date)::int AS days
        FROM kaldev_performance.kaldev_projects
        WHERE start_date IS NOT NULL
          AND planing_date IS NOT NULL
          AND status IN ('Antrean','Dikerjakan','Planned')
          AND ((CURRENT_DATE > planing_date::date) OR (planing_date::date - CURRENT_DATE <= 3))
          ${src}
        ORDER BY (CURRENT_DATE - planing_date::date) DESC;
      `,

      // ── Tab 2: No Programmer (belum ditugaskan / atas nama Mas Jeremy) ──
      sql<NoDevDbRow[]>`
        SELECT
          project_id,
          project_name,
          programmer_name,
          basis,
          kategori,
          created_at,
          created_by_name,
          COALESCE(wait_days, (CURRENT_DATE - created_at::date)::int) AS wait_days
        FROM kaldev_performance.kaldev_projects
        WHERE status IN ('Antrean','Planned')
          AND (programmer_name IS NULL OR programmer_name ILIKE '%Jeremy Vincent%')
          ${src}
        ORDER BY created_at DESC NULLS LAST;
      `,

      // ── Tab 3: Idle (hanya yang sudah mulai/berjalan & idle > 7 hari) ──
      sql<IdleDbRow[]>`
        SELECT
          project_id,
          project_name,
          implementor_name,
          programmer_name,
          COALESCE(source_modified_at, created_at) AS source_modified_at,
          (CURRENT_DATE - COALESCE(source_modified_at, created_at)::date)::int AS idle_days
        FROM kaldev_performance.kaldev_projects
        WHERE status = 'Dikerjakan'
          AND start_date IS NOT NULL
          AND start_date::date <= CURRENT_DATE
          AND (CURRENT_DATE - COALESCE(source_modified_at, created_at)::date) > 7
          ${src}
        ORDER BY idle_days DESC;
      `,

      // ── Tab 4: Hold ─────────────────────────────────────────────
      sql<HoldDbRow[]>`
        SELECT
          project_id,
          project_name,
          programmer_name,
          basis,
          hold_since,
          start_date,
          leader_name,
          hold_reason
        FROM kaldev_performance.kaldev_projects
        WHERE status = 'Ditahan'
          ${src}
        ORDER BY hold_since ASC NULLS LAST;
      `,
    ],
  );

  // ── Map DB rows → typed UI rows ─────────────────────────────────

  const counts: Record<AttentionTab, number> = {
    sla: countRows[0]?.sla ?? 0,
    noprog: countRows[0]?.noprog ?? 0,
    idle: countRows[0]?.idle ?? 0,
    hold: countRows[0]?.hold ?? 0,
  };

  const due: DueRow[] = dueRows.map((r) => ({
    id: r.project_id,
    name: r.project_name,
    programmer: r.programmer_name,
    target: formatDateShort(r.planing_date),
    days: r.days,
  }));

  const noDev: NoDevRow[] = noDevRows.map((r) => ({
    id: r.project_id,
    name: r.project_name,
    basis: r.basis,
    kategori: r.kategori,
    dibuat: formatDateShort(r.created_at),
    createdBy: r.created_by_name ?? null,
    programmer: r.programmer_name ?? "Belum ditugaskan",
    wait: r.wait_days,
  }));

  const idle: IdleRow[] = idleRows.map((r) => ({
    id: r.project_id,
    name: r.project_name,
    implementer: r.implementor_name,
    dev: r.programmer_name,
    last: formatTimestamp(r.source_modified_at),
    idle: r.idle_days,
  }));

  const holds: HoldItem[] = holdRows.map((r) => ({
    id: r.project_id,
    name: r.project_name,
    programmer: r.programmer_name,
    basis: r.basis,
    since: formatDateShort(r.hold_since ?? r.start_date),
    approver: r.leader_name,
    reason: r.hold_reason,
  }));

  return { counts, due, noDev, idle, holds };
}

// ── Cached export ────────────────────────────────────────────────────

export async function getAttentionData(
  filters: KaldevFilters,
): Promise<AttentionData> {
  return unstable_cache(
    async () => getAttentionRaw(filters),
    ["kaldev-attention", filters.from],
    { revalidate: 300, tags: ["kaldev-attention"] },
  )();
}
