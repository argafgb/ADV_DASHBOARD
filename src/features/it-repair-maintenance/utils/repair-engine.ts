import "server-only";

/**
 * Mesin hitung seluruh angka dashboard IT Repair: port setia skrip desain
 * (dc-script.js), dipakai dua sumber yang sama persis aturannya:
 * - record `it_repair_maintenance.log_repair` dari PostgreSQL (service FASE 9);
 * - dataset desain di blok `catch` service (mock saat DB tidak terjangkau).
 *
 * Turunan per record (status, result, work type, turnaround) sudah dihitung
 * ETL n8n dan disimpan sebagai kolom. Di sini hanya penyaringan, penghitungan,
 * top-N, dan paginasi atas ±400 record setahun.
 */

import {
  MONTHS_FULL,
  MONTHS_SHORT,
  fmt,
  fmtDays,
  fmtPct,
  formatDateId,
  pct,
} from "./format";
import {
  RESULTS,
  RESULT_COLOR,
  STATUSES,
  STATUS_COLOR,
  type BranchSlice,
  type DeltaChipData,
  type DonutSlice,
  type FilterOptions,
  type GoldenData,
  type GoldenQuery,
  type ItrFilters,
  type ModalData,
  type ModalQuery,
  type OverviewData,
  type OverviewSeg,
  type RankedRow,
  type RepairData,
  type RepairQuery,
  type RepairRecord,
  type RepairResult,
  type StackedRow,
  type TablePage,
  type TableRow,
  type WorkloadRow,
} from "../types/it-repair.types";

export interface EngineInput {
  /** Record sumber; yang dipakai hanya record pada tahun terpilih. */
  records: RepairRecord[];
  /**
   * Batas data tahun terpilih, "YYYY-MM-DD": dasar label periode
   * ("1 Januari - 29 September 2026") dan kuartal berjalan pada delta KPI.
   */
  asOf: string;
  /** "Hari ini", "YYYY-MM-DD": umur record yang masih terbuka. */
  today: string;
}

const PER_PAGE = 12;
const NO_BRANCH = "";

/* ── Helper dasar (port dari desain) ───────────────────────────────────── */

const monthIdx = (r: RepairRecord) => Number(r.date.slice(5, 7)) - 1;
const yearOf = (r: RepairRecord) => r.date.slice(0, 4);
const quarterOf = (m: number) => Math.floor(m / 3) + 1;
/** Selesai = hasil bukan "In process" (status Done atau Not usable). */
const isDone = (r: RepairRecord) => r.result !== "In process";
const pics = (r: RepairRecord) =>
  r.pic ? r.pic.split(",").map((s) => s.trim()).filter(Boolean) : [];

/** Hitung per nilai dengan urutan kemunculan pertama (seperti objek di desain). */
function countBy(arr: RepairRecord[], f: (r: RepairRecord) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of arr) {
    const k = f(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** PIC multi-nilai dihitung ke tiap nama; tanpa PIC dicatat pada kunci "". */
function countPic(arr: RepairRecord[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of arr) {
    const p = pics(r);
    if (!p.length) m.set("", (m.get("") ?? 0) + 1);
    for (const x of p) m.set(x, (m.get(x) ?? 0) + 1);
  }
  return m;
}

function top(m: Map<string, number>, n: number): RankedRow[] {
  return [...m.entries()]
    .filter(([k]) => k !== "")
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

const withTA = (arr: RepairRecord[]) => arr.filter((r) => r.turnaround != null);
const avgTA = (arr: RepairRecord[]) => {
  const v = withTA(arr);
  return v.length ? v.reduce((s, r) => s + (r.turnaround ?? 0), 0) / v.length : 0;
};
const sortDesc = (arr: RepairRecord[]) =>
  [...arr].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.seq - a.seq));

const dayMs = 86400000;
const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Umur sejak input: sampai selesai/serah terima (tertutup) atau sampai hari ini (terbuka). */
function ageOf(r: RepairRecord, today: string): number {
  const end = isDone(r) ? (r.done ?? r.returned ?? r.date) : today;
  return Math.max(0, Math.round((toUtc(end) - toUtc(r.date)) / dayMs));
}

function toRow(r: RepairRecord, today: string): TableRow {
  const last = [r.date, r.start, r.done, r.returned].filter((d): d is string => Boolean(d)).sort().pop() ?? null;
  return {
    id: r.id,
    workType: r.workType,
    ticket: r.ticket,
    barcode: r.barcode,
    problem: r.problem,
    item: r.item,
    model: r.model,
    branch: r.branch,
    location: r.location,
    ownership: r.ownership,
    owner: r.owner,
    adminPic: r.adminPic,
    pic: r.pic,
    status: r.status,
    result: r.result,
    dateText: formatDateId(r.date) ?? r.date,
    startText: formatDateId(r.start),
    doneText: formatDateId(r.done),
    returnedText: formatDateId(r.returned),
    lastUpdateText: formatDateId(last),
    turnaround: r.turnaround,
    handling: r.handling,
    parts: r.parts,
    resultNote: r.resultNote,
    ageDays: ageOf(r, today),
    open: !isDone(r),
  };
}

function paginate(items: RepairRecord[], page: number, unit: string, today: string): TablePage {
  const totalPages = Math.max(Math.ceil(items.length / PER_PAGE), 1);
  const p = Math.min(Math.max(1, page), totalPages);
  const start = (p - 1) * PER_PAGE;
  const rows = items.slice(start, start + PER_PAGE).map((r) => toRow(r, today));
  return {
    rows,
    count: `${fmt(items.length)} ${unit}`,
    rangeLabel: items.length
      ? `Menampilkan ${start + 1}-${Math.min(start + PER_PAGE, items.length)} dari ${fmt(items.length)} ${unit}`
      : `Tidak ada ${unit}`,
    page: p,
    totalPages,
  };
}

/* ── Periode & filter global ───────────────────────────────────────────── */

function parseMonths(month: string): number[] {
  if (!month || month.toUpperCase() === "ALL") return [];
  const m = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(month);
  if (!m) return [];
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : start;
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) if (i >= 1 && i <= 12) out.push(i - 1);
  return out;
}

interface Scope {
  /** Indeks bulan yang punya data pada tahun ini (sumbu chart bulanan). */
  months: number[];
  /** Seluruh record setelah filter header (Bulan, Location, Ownership). */
  base: RepairRecord[];
  ur: RepairRecord[];
  gu: RepairRecord[];
  periodLabel: string;
  asOfLabel: string;
  /** Kuartal berjalan dan bulan-bulannya yang sudah lewat (untuk teks KPI). */
  curQ: number;
  qStart: number;
  qEnd: number;
  today: string;
}

function makeScope(input: EngineInput, f: ItrFilters): Scope {
  const yearRecs = input.records.filter((r) => yearOf(r) === f.year);
  const maxM = yearRecs.reduce((m, r) => Math.max(m, monthIdx(r)), -1);
  const months = maxM < 0 ? [] : Array.from({ length: maxM + 1 }, (_, i) => i);
  const sel = parseMonths(f.month);
  const base = yearRecs.filter(
    (r) =>
      (sel.length === 0 || sel.includes(monthIdx(r))) &&
      (f.location === "Semua" || r.location === f.location) &&
      (f.ownership === "Semua" || r.ownership === f.ownership),
  );
  const asOfMonth = Number(input.asOf.slice(5, 7)) - 1;
  const curQ = quarterOf(asOfMonth);
  const asOfLabel = formatDateId(input.asOf) ?? input.asOf;
  return {
    months,
    base,
    ur: base.filter((r) => r.workType === "User repair"),
    gu: base.filter((r) => r.workType === "Golden Unit"),
    periodLabel: `1 Januari - ${asOfLabel}`,
    asOfLabel,
    curQ,
    qStart: (curQ - 1) * 3,
    qEnd: asOfMonth,
    today: input.today,
  };
}

/** Opsi filter Location/Ownership dari data (urut terbanyak); nilai kosong tidak ditawarkan. */
export function filterOptionsFrom(records: RepairRecord[]): FilterOptions {
  return {
    locations: top(countBy(records, (r) => r.location ?? ""), 99).map((d) => d.label),
    ownerships: top(countBy(records, (r) => r.ownership ?? ""), 99).map((d) => d.label),
  };
}

/* ── Delta kuartal ─────────────────────────────────────────────────────── */

function delta(cur: number, prev: number, meaningUp: "up" | "down" | "flat"): DeltaChipData | null {
  if (!prev) return null;
  const ch = pct(cur - prev, prev);
  const dir: DeltaChipData["dir"] = ch >= 0 ? "up" : "down";
  const tone: DeltaChipData["tone"] =
    meaningUp === "flat" ? "flat" : (ch >= 0) === (meaningUp === "up") ? "up" : "down";
  return { text: fmtPct(Math.abs(ch)), dir, tone };
}

/* ── Overview ──────────────────────────────────────────────────────────── */

function resultDonut(arr: RepairRecord[], order: readonly RepairResult[]): DonutSlice[] {
  const rc = countBy(arr.filter(isDone), (r) => r.result);
  return order
    .map((k) => ({ label: k, value: rc.get(k) ?? 0, color: RESULT_COLOR[k] }))
    .filter((d) => d.value > 0);
}

function computeModal(S: Scope, q: ModalQuery): ModalData {
  let title = "";
  let chips: string[] = [];
  let rows: RepairRecord[] = [];
  switch (q.kind) {
    case "work":
      title = `Work type: ${q.value}`;
      chips = [`Work type: ${q.value}`];
      rows = S.base.filter((r) => r.workType === q.value);
      break;
    case "status":
      title = `Status: ${q.value}`;
      chips = [`Status: ${q.value}`];
      rows = S.base.filter((r) => r.status === q.value);
      break;
    case "item":
      title = `Item: ${q.value}`;
      chips = [`Item: ${q.value}`];
      rows = S.base.filter((r) => r.item === q.value);
      break;
    case "pic":
      title = `Repair PIC: ${q.value}`;
      chips = [`Repair PIC: ${q.value}`];
      rows = S.base.filter((r) => pics(r).includes(q.value));
      break;
    case "result":
      title = `Result: ${q.value}`;
      chips = [`Result: ${q.value}`];
      rows = S.base.filter((r) => r.result === q.value);
      break;
    case "month": {
      const i = Number.parseInt(q.value, 10);
      const name = MONTHS_FULL[i] ?? q.value;
      title = `Bulan: ${name}`;
      chips = [`Bulan: ${name}`];
      rows = S.base.filter((r) => monthIdx(r) === i);
      break;
    }
    case "age":
      title = "User repairs · umur sejak input";
      chips = ["Work type: User repair", "Diurutkan: terbuka dulu, umur terlama"];
      rows = [...S.ur].sort(
        (a, b) => Number(isDone(a)) - Number(isDone(b)) || ageOf(b, S.today) - ageOf(a, S.today),
      );
      return { kind: q.kind, title, chips, table: paginate(rows, q.page, "record", S.today) };
  }
  return { kind: q.kind, title, chips, table: paginate(sortDesc(rows), q.page, "record", S.today) };
}

export function buildOverview(
  input: EngineInput,
  f: ItrFilters,
  seg: OverviewSeg,
  modal: ModalQuery | null,
): OverviewData {
  const S = makeScope(input, f);
  const { base, ur, gu } = S;
  const qCur = base.filter((r) => quarterOf(monthIdx(r)) === S.curQ);
  const qPrev = base.filter((r) => quarterOf(monthIdx(r)) === S.curQ - 1);
  const done = base.filter(isDone);

  const sc = countBy(base, (r) => r.status);
  const statusMix = STATUSES.map((k) => ({ label: k, value: sc.get(k) ?? 0, color: STATUS_COLOR[k] })).filter(
    (d) => d.value > 0,
  );

  const items = countBy(base, (r) => r.item);
  const picM = countPic(base);
  const ranked = seg === "item" ? top(items, 6) : top(picM, 6);

  const monthly = {
    categories: S.months.map((i) => MONTHS_SHORT[i]),
    fullMonths: S.months.map((i) => MONTHS_FULL[i]),
    series: [
      {
        key: "ur",
        label: "User repair",
        color: "var(--chart-blue-primary)",
        data: S.months.map((i) => ur.filter((r) => monthIdx(r) === i).length),
      },
      {
        key: "gu",
        label: "Golden Unit",
        color: "var(--chart-blue-light)",
        data: S.months.map((i) => gu.filter((r) => monthIdx(r) === i).length),
      },
    ],
  };

  return {
    periodLabel: S.periodLabel,
    infoText: `Kuartal ${S.curQ} dihitung sampai ${S.asOfLabel}`,
    kpi: {
      total: fmt(base.length),
      totalSub: `${fmt(base.filter((r) => r.status === "Done").length)} berstatus Done`,
      totalDelta: delta(qCur.length, qPrev.length, "flat"),
      ur: fmt(ur.length),
      urSub: `${fmt(ur.filter((r) => !isDone(r)).length)} masih terbuka`,
      urDelta: delta(
        qCur.filter((r) => r.workType === "User repair").length,
        qPrev.filter((r) => r.workType === "User repair").length,
        "down",
      ),
      ta: fmtDays(avgTA(base)),
      taSub: `dari ${fmt(withTA(base).length)} pekerjaan bertanggal lengkap`,
      taDelta: delta(avgTA(qCur), avgTA(qPrev), "down"),
    },
    monthly,
    statusMix,
    statusTotal: fmt(base.length),
    seg,
    ranked,
    resultDonut: resultDonut(base, RESULTS),
    resultTotal: fmt(done.length),
    modal: modal ? computeModal(S, modal) : null,
  };
}

/* ── Repair tickets ────────────────────────────────────────────────────── */

function groupItems(
  arr: RepairRecord[],
  n: number,
  make: (label: string, rows: RepairRecord[]) => StackedRow,
): StackedRow[] {
  const ic = countBy(arr, (r) => r.item);
  const keys = top(ic, n).map((d) => d.label);
  return [
    ...keys.map((k) => make(k, arr.filter((r) => r.item === k))),
    make("Others", arr.filter((r) => !keys.includes(r.item))),
  ].filter((row) => row.n > 0);
}

const uniqItems = (rows: RepairRecord[]) => [...new Set(rows.map((r) => r.item))];

export function buildRepair(input: EngineInput, f: ItrFilters, q: RepairQuery): RepairData {
  const S = makeScope(input, f);
  const { ur } = S;
  const st = countBy(ur, (r) => r.status);
  const done = ur.filter(isDone);

  const statusByItem = groupItems(ur, 5, (label, rows) => {
    const m = countBy(rows, (r) => r.status);
    return {
      label,
      values: {
        done: m.get("Done") ?? 0,
        progress: m.get("On progress") ?? 0,
        queue: m.get("On queue") ?? 0,
        nu: m.get("Not usable") ?? 0,
      },
      n: rows.length,
      items: uniqItems(rows),
    };
  });

  const bc = countBy(ur, (r) => r.branch ?? NO_BRANCH);
  const bTop = top(bc, 4);
  const bCols = ["var(--chart-blue-primary)", "var(--chart-blue-light)", "var(--chart-green)", "var(--chart-amber)"];
  const bRest = [...bc.keys()].filter((k) => k !== NO_BRANCH && !bTop.some((t) => t.label === k));
  const branchDonut: BranchSlice[] = bTop.map((t, i) => ({ label: t.label, value: t.value, color: bCols[i], branches: [t.label] }));
  if (bRest.length) {
    branchDonut.push({
      label: "Other branches",
      value: bRest.reduce((a, k) => a + (bc.get(k) ?? 0), 0),
      color: "var(--chart-neutral)",
      branches: bRest,
    });
  }

  const wl = new Map<string, WorkloadRow>();
  for (const r of ur) {
    for (const p of pics(r)) {
      const row = wl.get(p) ?? { label: p, done: 0, rest: 0 };
      if (isDone(r)) row.done += 1;
      else row.rest += 1;
      wl.set(p, row);
    }
  }
  const workload = [...wl.values()].sort((a, b) => b.done + b.rest - (a.done + a.rest));

  const ql = q.q.trim().toLowerCase();
  const filtered = sortDesc(
    ur.filter(
      (r) =>
        (q.status === "Semua" || r.status === q.status) &&
        (q.item === "Semua" || r.item === q.item) &&
        (q.pic === "Semua" || pics(r).includes(q.pic)) &&
        (!q.result || r.result === q.result) &&
        (!q.branch || q.branch.includes(r.branch ?? NO_BRANCH)) &&
        (!ql || `${r.ticket ?? ""} ${r.problem ?? ""} ${r.owner ?? ""}`.toLowerCase().includes(ql)),
    ),
  );

  const queueSince = ur.filter((r) => r.status === "On queue" && monthIdx(r) >= S.qStart).length;

  return {
    periodLabel: S.periodLabel,
    kpi: {
      total: fmt(ur.length),
      totalSub: `rata-rata ${fmtDays(avgTA(ur))} pengerjaan`,
      done: fmt(st.get("Done") ?? 0),
      doneSub: fmtPct(pct(st.get("Done") ?? 0, ur.length)),
      progress: fmt(st.get("On progress") ?? 0),
      queue: fmt(st.get("On queue") ?? 0),
      queueSub: `${fmt(queueSince)} masuk ${MONTHS_FULL[S.qStart]} - ${MONTHS_FULL[S.qEnd]}`,
      notUsable: fmt(st.get("Not usable") ?? 0),
      notUsableSub: fmtPct(pct(st.get("Not usable") ?? 0, ur.length)),
    },
    resultDonut: resultDonut(ur, ["Usable", "Damaged", "Unclassified"]),
    resultTotal: fmt(done.length),
    branchDonut,
    branchTotal: fmt(ur.length - (bc.get(NO_BRANCH) ?? 0)),
    statusByItem,
    workload,
    workloadCount: `${fmt(ur.length)} repair`,
    monthly: {
      labels: S.months.map((i) => MONTHS_SHORT[i]),
      fullLabels: S.months.map((i) => MONTHS_FULL[i]),
      data: S.months.map((i) => ur.filter((r) => monthIdx(r) === i).length),
    },
    table: paginate(filtered, q.page, "repair", S.today),
    options: {
      items: top(countBy(ur, (r) => r.item), 99).map((d) => d.label),
      pics: top(countPic(ur), 99).map((d) => d.label),
    },
    dirty: q.q !== "" || q.status !== "Semua" || q.item !== "Semua" || q.pic !== "Semua" || !!q.result || !!q.branch,
  };
}

/* ── Golden Unit ───────────────────────────────────────────────────────── */

export function buildGolden(input: EngineInput, f: ItrFilters, q: GoldenQuery): GoldenData {
  const S = makeScope(input, f);
  const { gu } = S;
  const rc = countBy(gu, (r) => r.result);
  const st = countBy(gu, (r) => r.status);
  const done = gu.filter(isDone);

  const qi = countBy(gu.filter((r) => r.status === "On queue"), (r) => r.item);
  const queueSub =
    [...qi.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${v} ${k.toLowerCase()}`)
      .join(", ") || "tidak ada antrean";

  const resultByItem = groupItems(gu, 5, (label, rows) => {
    const m = countBy(rows.filter(isDone), (r) => r.result);
    return {
      label,
      values: {
        usable: m.get("Usable") ?? 0,
        ready: m.get("Ready to sell") ?? 0,
        damaged: m.get("Damaged") ?? 0,
        uncl: m.get("Unclassified") ?? 0,
      },
      n: rows.filter(isDone).length,
      items: uniqItems(rows),
    };
  });

  const pm = countPic(gu);
  const byPic = top(pm, 99);

  const ql = q.q.trim().toLowerCase();
  const filtered = sortDesc(
    gu.filter(
      (r) =>
        (q.result === "Semua" || r.result === q.result) &&
        (q.item === "Semua" || r.item === q.item) &&
        (q.pic === "Semua" || pics(r).includes(q.pic)) &&
        (!q.status || r.status === q.status) &&
        (!ql || `${r.barcode ?? ""} ${r.model ?? ""} ${r.problem ?? ""}`.toLowerCase().includes(ql)),
    ),
  );

  return {
    periodLabel: S.periodLabel,
    kpi: {
      total: fmt(gu.length),
      totalSub: `rata-rata ${fmtDays(avgTA(gu))} per unit`,
      ready: fmt(rc.get("Ready to sell") ?? 0),
      readySub: fmtPct(pct(rc.get("Ready to sell") ?? 0, gu.length)),
      usable: fmt(rc.get("Usable") ?? 0),
      usableSub: fmtPct(pct(rc.get("Usable") ?? 0, gu.length)),
      damaged: fmt(rc.get("Damaged") ?? 0),
      damagedSub: fmtPct(pct(rc.get("Damaged") ?? 0, gu.length)),
      queue: fmt(st.get("On queue") ?? 0),
      queueSub,
    },
    resultDonut: resultDonut(gu, ["Ready to sell", "Usable", "Damaged", "Unclassified"]),
    resultTotal: fmt(done.length),
    resultByItem,
    byPic: { categories: byPic.map((d) => d.label), data: byPic.map((d) => d.value) },
    table: paginate(filtered, q.page, "unit", S.today),
    options: {
      items: top(countBy(gu, (r) => r.item), 99).map((d) => d.label),
      pics: byPic.map((d) => d.label),
    },
    dirty: q.q !== "" || q.result !== "Semua" || q.item !== "Semua" || q.pic !== "Semua" || !!q.status,
  };
}
