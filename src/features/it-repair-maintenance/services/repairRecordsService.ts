import "server-only";
import { unstable_cache } from "next/cache";

import { sql } from "@/lib/db";
import type { EngineInput } from "../utils/repair-engine";
import type {
  RepairRecord,
  RepairStatus,
  ResultValue,
  WorkType,
} from "../types/it-repair.types";

/** Label nilai kosong, sama dengan `NR` di record-cells (item dipakai sebagai kunci grup chart). */
const NOT_RECORDED = "Tidak tercatat";

interface LogRepairRow {
  id: string;
  source_tab: string;
  row_number: number | null;
  date: string;
  work_type: string;
  ticket: string | null;
  problem: string | null;
  barcode: string | null;
  owner: string | null;
  branch: string | null;
  ownership: string | null;
  location: string | null;
  item: string | null;
  model: string | null;
  admin_pic: string | null;
  pic: string | null;
  start: string | null;
  done: string | null;
  returned: string | null;
  status: string;
  result: string;
  result_note: string | null;
  handling: string | null;
  parts: string | null;
  turnaround_days: number | null;
}

export interface YearSnapshot {
  year: string;
  records: RepairRecord[];
  /** Tanggal input terbaru pada tahun ini, "YYYY-MM-DD". */
  maxDate: string | null;
}

function toRecord(r: LogRepairRow): RepairRecord {
  return {
    id: r.id,
    seq: Number(r.source_tab) * 100000 + (r.row_number ?? 0),
    date: r.date,
    workType: r.work_type as WorkType,
    ticket: r.ticket,
    problem: r.problem,
    barcode: r.barcode,
    owner: r.owner,
    branch: r.branch,
    ownership: r.ownership,
    location: r.location,
    item: r.item ?? NOT_RECORDED,
    model: r.model,
    adminPic: r.admin_pic,
    pic: r.pic,
    start: r.start,
    done: r.done,
    returned: r.returned,
    status: r.status as RepairStatus,
    result: r.result as ResultValue,
    resultNote: r.result_note,
    handling: r.handling,
    parts: r.parts,
    turnaround: r.turnaround_days,
  };
}

/**
 * Seluruh record satu tahun (±400 baris) dalam satu query. Tanggal diambil
 * sebagai teks `YYYY-MM-DD` supaya tidak digeser zona waktu oleh driver.
 * Baris yang diarsip ETL (halaman dihapus di Notion) tidak ikut.
 */
async function getYearSnapshotRaw(year: string): Promise<YearSnapshot> {
  const start = performance.now();
  const rows = await sql<LogRepairRow[]>`
    SELECT notion_page_id::text   AS id,
           source_tab,
           row_number,
           input_date::text       AS date,
           work_type, ticket, problem, barcode, owner,
           branch, ownership, location, item, model,
           admin_pic, pic,
           start_date::text       AS start,
           done_date::text        AS done,
           returned_date::text    AS returned,
           status, result, result_note, handling, parts,
           turnaround_days
    FROM it_repair_maintenance.log_repair
    WHERE archived_at IS NULL
      AND year = ${Number(year)}
  `;
  const records = rows.map(toRecord);
  const maxDate = records.reduce<string | null>((m, r) => (m === null || r.date > m ? r.date : m), null);
  console.log(`[DB] getYearSnapshot(${year}) ${records.length} baris in ${(performance.now() - start).toFixed(2)}ms`);
  return { year, records, maxDate };
}

/**
 * Dibagi ketiga halaman: satu fetch per tahun melayani semua kombinasi filter,
 * pencarian, dan paginasi. Tag-nya tag ketiga dataset, jadi revalidate dari
 * n8n untuk dataset mana pun ikut membuang cache ini.
 */
export async function getYearSnapshot(year: string): Promise<YearSnapshot> {
  return unstable_cache(() => getYearSnapshotRaw(year), ["itrm-year-records", year], {
    revalidate: 300,
    tags: ["itrm-overview", "itrm-repair-tickets", "itrm-golden-unit"],
  })();
}

/** Tanggal hari ini di Asia/Jakarta, "YYYY-MM-DD". */
function wibToday(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * Batas data untuk label periode dan kuartal berjalan:
 * - tahun yang sudah lewat dihitung setahun penuh (31 Desember);
 * - tahun berjalan dihitung sampai tanggal input terakhir (tidak melewati
 *   hari ini), seperti desain "Kuartal 3 dihitung sampai 22 September 2026".
 *   Memakai tanggal data, bukan hari ini, supaya awal kuartal baru yang belum
 *   berisi data tidak membuat delta KPI langsung -100%.
 */
function resolveAsOf(year: string, maxDate: string | null, today: string): string {
  const thisYear = today.slice(0, 4);
  if (year < thisYear) return `${year}-12-31`;
  if (!maxDate) return year === thisYear ? today : `${year}-12-31`;
  return year === thisYear && maxDate > today ? today : maxDate;
}

/**
 * Input tanpa record untuk keadaan query gagal: halaman tampil kosong (nol),
 * bukan data karangan, supaya kegagalan terlihat — sama dengan dashboard lain.
 */
export function emptyEngineInput(year: string): EngineInput {
  const today = wibToday();
  return { records: [], asOf: resolveAsOf(year, null, today), today };
}

export function engineInputFrom(snapshot: YearSnapshot): EngineInput {
  const today = wibToday();
  return {
    records: snapshot.records,
    asOf: resolveAsOf(snapshot.year, snapshot.maxDate, today),
    today,
  };
}
