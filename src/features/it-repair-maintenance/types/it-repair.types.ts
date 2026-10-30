/**
 * Tipe bersama seluruh fitur IT Repair & Maintenance.
 *
 * Bentuknya mengikuti artefak desain:
 * semua tanggal pada baris tabel sudah berupa teks tampilan ("22 September 2026")
 * karena service layer yang memformat, komponen hanya menampilkan.
 */

export const WORK_TYPES = ["User repair", "Golden Unit"] as const;
export type WorkType = (typeof WORK_TYPES)[number];

/** Urutan status pada donut, filter, dan legenda (ST_ORDER di desain). */
export const STATUSES = ["Done", "On progress", "On queue", "Not usable"] as const;
export type RepairStatus = (typeof STATUSES)[number];

/** Urutan hasil pada donut dan filter (RES_ORDER di desain). */
export const RESULTS = ["Usable", "Ready to sell", "Damaged", "Unclassified"] as const;
export type RepairResult = (typeof RESULTS)[number];

/** "In process" bukan nilai sumber: pekerjaan yang belum selesai (status terbuka). */
export type ResultValue = RepairResult | "In process";

export type Tone = "green" | "blue" | "amber" | "red" | "gray";

export const RESULT_TONE: Record<RepairResult, Tone> = {
  Usable: "green",
  "Ready to sell": "blue",
  Damaged: "red",
  Unclassified: "gray",
};

export const STATUS_TONE: Record<RepairStatus, Tone> = {
  Done: "green",
  "On progress": "blue",
  "On queue": "amber",
  "Not usable": "red",
};

export const RESULT_COLOR: Record<RepairResult, string> = {
  Usable: "var(--chart-green)",
  "Ready to sell": "var(--chart-blue-primary)",
  Damaged: "var(--chart-red)",
  Unclassified: "var(--chart-neutral)",
};

export const STATUS_COLOR: Record<RepairStatus, string> = {
  Done: "var(--chart-green)",
  "On progress": "var(--chart-blue-primary)",
  "On queue": "var(--chart-amber)",
  "Not usable": "var(--chart-red)",
};

/** Satu record pekerjaan (repair user atau pengecekan Golden Unit). */
export interface RepairRecord {
  /** Kunci unik: id halaman Notion (data nyata) atau nomor record desain (mock). */
  id: string;
  /** Urutan tampil saat tanggal input sama (desain: nomor record; DB: tab + nomor baris Notion). */
  seq: number;
  /** Tanggal input record, "YYYY-MM-DD". Basis semua periode. */
  date: string;
  workType: WorkType;
  ticket: string | null;
  problem: string | null;
  /** Bisa lebih dari satu, dipisah koma. */
  barcode: string | null;
  owner: string | null;
  branch: string | null;
  ownership: string | null;
  location: string | null;
  item: string;
  model: string | null;
  adminPic: string | null;
  /** Bisa lebih dari satu, dipisah koma. */
  pic: string | null;
  start: string | null;
  done: string | null;
  returned: string | null;
  status: RepairStatus;
  result: ResultValue;
  resultNote: string | null;
  handling: string | null;
  parts: string | null;
  /** done − start, hari kalender; null bila belum selesai. */
  turnaround: number | null;
}

/** Filter global dari URL: chip shell (Tahun, Bulan) + filter lokal Location & Ownership. */
export interface ItrFilters {
  year: string;
  /** "ALL" | "N" | "N-N" (1-based), format shell fleet. */
  month: string;
  /** "Semua" atau nilai lokasi persis seperti di data. */
  location: string;
  /** "Semua" atau nilai kepemilikan persis seperti di data. */
  ownership: string;
}

export interface FilterOptions {
  locations: string[];
  ownerships: string[];
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface BranchSlice extends DonutSlice {
  /** Cabang yang diwakili potongan ini ("Other branches" memuat banyak). */
  branches: string[];
}

/** Baris chart batang bertumpuk (Status by item / Result by item). */
export interface StackedRow {
  label: string;
  values: Record<string, number>;
  /** Jumlah record di baris ini (untuk menyaring baris kosong). */
  n: number;
  /** Item yang diwakili baris ("Others" memuat banyak). */
  items: string[];
}

export interface RankedRow {
  label: string;
  value: number;
}

export interface WorkloadRow {
  label: string;
  done: number;
  rest: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  data: number[];
}

/** Chip delta kuartal pada KPI Overview. */
export interface DeltaChipData {
  /** "136,5%" */
  text: string;
  /** Arah pergerakan angka (ikon). */
  dir: "up" | "down";
  /** Warna: apakah pergerakan itu baik. "flat" = netral. */
  tone: "up" | "down" | "flat";
}

/** Baris tabel siap tampil (tanggal sudah diformat). */
export interface TableRow {
  id: string;
  workType: WorkType;
  ticket: string | null;
  barcode: string | null;
  problem: string | null;
  item: string;
  model: string | null;
  branch: string | null;
  location: string | null;
  ownership: string | null;
  owner: string | null;
  adminPic: string | null;
  pic: string | null;
  status: RepairStatus;
  result: ResultValue;
  dateText: string;
  startText: string | null;
  doneText: string | null;
  returnedText: string | null;
  lastUpdateText: string | null;
  turnaround: number | null;
  handling: string | null;
  parts: string | null;
  resultNote: string | null;
  /** Umur sejak input: sampai selesai (record tertutup) atau sampai hari ini (terbuka). */
  ageDays: number;
  open: boolean;
}

export interface TablePage {
  rows: TableRow[];
  /** "154 repair" */
  count: string;
  /** "Menampilkan 1-12 dari 154 repair" */
  rangeLabel: string;
  page: number;
  totalPages: number;
}

/* ── Overview ─────────────────────────────────────────────────────────── */

export type OverviewSeg = "item" | "pic";

export const MODAL_KINDS = ["work", "status", "item", "pic", "result", "month", "age"] as const;
export type ModalKind = (typeof MODAL_KINDS)[number];

export interface ModalQuery {
  kind: ModalKind;
  value: string;
  page: number;
}

export interface ModalData {
  kind: ModalKind;
  title: string;
  chips: string[];
  table: TablePage;
}

export interface OverviewData {
  periodLabel: string;
  infoText: string;
  kpi: {
    total: string;
    totalSub: string;
    totalDelta: DeltaChipData | null;
    ur: string;
    urSub: string;
    urDelta: DeltaChipData | null;
    ta: string;
    taSub: string;
    taDelta: DeltaChipData | null;
  };
  monthly: {
    categories: string[];
    fullMonths: string[];
    series: ChartSeries[];
  };
  statusMix: DonutSlice[];
  statusTotal: string;
  seg: OverviewSeg;
  ranked: RankedRow[];
  resultDonut: DonutSlice[];
  resultTotal: string;
  modal: ModalData | null;
}

/* ── Repair tickets ───────────────────────────────────────────────────── */

export interface RepairQuery {
  status: "Semua" | RepairStatus;
  item: string;
  pic: string;
  result: RepairResult | null;
  /** Daftar cabang dari klik donut; null = tanpa filter cabang. */
  branch: string[] | null;
  q: string;
  page: number;
}

export interface RepairData {
  periodLabel: string;
  kpi: {
    total: string;
    totalSub: string;
    done: string;
    doneSub: string;
    progress: string;
    queue: string;
    queueSub: string;
    notUsable: string;
    notUsableSub: string;
  };
  resultDonut: DonutSlice[];
  resultTotal: string;
  branchDonut: BranchSlice[];
  branchTotal: string;
  statusByItem: StackedRow[];
  workload: WorkloadRow[];
  workloadCount: string;
  monthly: { labels: string[]; fullLabels: string[]; data: number[] };
  table: TablePage;
  options: { items: string[]; pics: string[] };
  dirty: boolean;
}

/* ── Golden Unit ──────────────────────────────────────────────────────── */

export interface GoldenQuery {
  result: "Semua" | RepairResult;
  item: string;
  pic: string;
  status: RepairStatus | null;
  q: string;
  page: number;
}

export interface GoldenData {
  periodLabel: string;
  kpi: {
    total: string;
    totalSub: string;
    ready: string;
    readySub: string;
    usable: string;
    usableSub: string;
    damaged: string;
    damagedSub: string;
    queue: string;
    queueSub: string;
  };
  resultDonut: DonutSlice[];
  resultTotal: string;
  resultByItem: StackedRow[];
  byPic: { categories: string[]; data: number[] };
  table: TablePage;
  options: { items: string[]; pics: string[] };
  dirty: boolean;
}
