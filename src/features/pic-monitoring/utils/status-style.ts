import { normalizeStatus, statusGroupOf } from "./parser";

/**
 * Satu sumber warna status untuk seluruh dashboard.
 *
 * Nilai hex dan kelas Tailwind di bawah ini diambil dari palet yang sudah
 * dipakai tabel status di TabCategory, supaya chart, legend, dan badge tidak
 * lagi memakai warna sendiri-sendiri.
 */
export interface StatusPalette {
  /** Warna solid untuk chart SVG (pie, bar). */
  hex: string;
  /** Kelas badge/pill: background + teks + border. */
  pill: string;
  /** Kelas background untuk titik indikator kecil. */
  dot: string;
}

/**
 * Palet per nilai mentah kolom `Last Status`.
 *
 * Legend "Status Distribution" memakai nilai mentah, bukan status group, jadi
 * pemetaan per group membuat `Dev On Progress`, `FSD On Progress`, dan
 * `SIT On Progress` tampil dengan hex yang sama persis. Tabel di bawah memberi
 * tiap status warnanya sendiri dengan dua aturan supaya tetap terbaca:
 *
 * 1. Hue mengikuti urutan tahap pipeline. Makin dekat ke Live, makin hijau:
 *    FSD ungu -> DEV biru -> SIT sky -> UAT cyan -> Monitoring teal -> Live hijau.
 * 2. Dalam satu tahap, `On Progress` memakai warna pekat dan `On Queue` memakai
 *    warna pucat dari hue yang sama, sehingga "sedang jalan" dan "masih antre"
 *    langsung terbaca tanpa perlu membaca labelnya.
 *
 * Status di luar pipeline tetap memakai warna semantiknya sendiri: amber untuk
 * antrean yang belum masuk tahap, abu untuk hold, merah untuk canceled.
 */
const STATUS_PALETTE_BY_SOURCE: Readonly<Record<string, StatusPalette>> = {
  // Tahap FSD - ungu.
  fps: {
    hex: "#7C3AED",
    pill: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-500",
  },
  fsd: {
    hex: "#7C3AED",
    pill: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-500",
  },
  "fps on progress": {
    hex: "#7C3AED",
    pill: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-500",
  },
  "fsd on progress": {
    hex: "#7C3AED",
    pill: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-500",
  },

  // Tahap DEV - biru.
  dev: {
    hex: "#2563EB",
    pill: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  development: {
    hex: "#2563EB",
    pill: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  "dev on progress": {
    hex: "#2563EB",
    pill: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  "development on progress": {
    hex: "#2563EB",
    pill: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  "dev on queue": {
    hex: "#93C5FD",
    pill: "bg-blue-50 text-blue-600 border-blue-100",
    dot: "bg-blue-300",
  },
  "dev pending estimation": {
    hex: "#6366F1",
    pill: "bg-indigo-50 text-indigo-700 border-indigo-100",
    dot: "bg-indigo-500",
  },
  "pending estimation": {
    hex: "#6366F1",
    pill: "bg-indigo-50 text-indigo-700 border-indigo-100",
    dot: "bg-indigo-500",
  },

  // Tahap SIT - sky.
  sit: {
    hex: "#0EA5E9",
    pill: "bg-sky-50 text-sky-700 border-sky-100",
    dot: "bg-sky-500",
  },
  "sit on progress": {
    hex: "#0EA5E9",
    pill: "bg-sky-50 text-sky-700 border-sky-100",
    dot: "bg-sky-500",
  },

  // Tahap UAT - cyan.
  "uat on progress": {
    hex: "#06B6D4",
    pill: "bg-cyan-50 text-cyan-700 border-cyan-100",
    dot: "bg-cyan-500",
  },
  "uat on queue": {
    hex: "#67E8F9",
    pill: "bg-cyan-50 text-cyan-600 border-cyan-100",
    dot: "bg-cyan-300",
  },

  // Menjelang dan sesudah Live - teal lalu hijau.
  "live on queue": {
    hex: "#5EEAD4",
    pill: "bg-teal-50 text-teal-600 border-teal-100",
    dot: "bg-teal-300",
  },
  "live monitoring": {
    hex: "#14B8A6",
    pill: "bg-teal-50 text-teal-700 border-teal-100",
    dot: "bg-teal-500",
  },
  "live on monitoring": {
    hex: "#14B8A6",
    pill: "bg-teal-50 text-teal-700 border-teal-100",
    dot: "bg-teal-500",
  },
  "monitoring after live": {
    hex: "#14B8A6",
    pill: "bg-teal-50 text-teal-700 border-teal-100",
    dot: "bg-teal-500",
  },
  live: {
    hex: "#10B981",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },

  // Di luar alur tahap.
  "change request on progress": {
    hex: "#EC4899",
    pill: "bg-pink-50 text-pink-700 border-pink-100",
    dot: "bg-pink-500",
  },
  "on queue": {
    hex: "#F59E0B",
    pill: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  "hold by owner": {
    hex: "#64748B",
    pill: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  "hold by client/vendor": {
    hex: "#64748B",
    pill: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  "hold by it": {
    hex: "#64748B",
    pill: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  canceled: {
    hex: "#EF4444",
    pill: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-500",
  },
  cancelled: {
    hex: "#EF4444",
    pill: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-500",
  },
};

const STATUS_PALETTE_BY_GROUP: Readonly<Record<string, StatusPalette>> = {
  Live: {
    hex: "#10B981",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  Monitoring: {
    hex: "#14B8A6",
    pill: "bg-teal-50 text-teal-700 border-teal-100",
    dot: "bg-teal-500",
  },
  UAT: {
    hex: "#06B6D4",
    pill: "bg-cyan-50 text-cyan-700 border-cyan-100",
    dot: "bg-cyan-500",
  },
  "Dalam Proses": {
    hex: "#2563EB",
    pill: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-500",
  },
  "Change Request": {
    hex: "#EC4899",
    pill: "bg-pink-50 text-pink-700 border-pink-100",
    dot: "bg-pink-500",
  },
  Queue: {
    hex: "#F59E0B",
    pill: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
  Hold: {
    hex: "#64748B",
    pill: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
  Canceled: {
    hex: "#EF4444",
    pill: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-500",
  },
};

const FALLBACK_PALETTE: StatusPalette = {
  hex: "#94A3B8",
  pill: "bg-gray-50 text-gray-600 border-gray-200",
  dot: "bg-gray-400",
};

/** Palet berdasarkan status group hasil `statusGroupOf`. */
export function getStatusGroupPalette(group: string): StatusPalette {
  return STATUS_PALETTE_BY_GROUP[group] ?? FALLBACK_PALETTE;
}

/**
 * Palet berdasarkan nilai mentah kolom `Last Status`.
 *
 * Dicari per status dulu supaya tahap yang berbeda tidak tertimpa satu warna,
 * lalu jatuh ke palet group untuk status yang belum punya entri sendiri.
 */
export function getStatusPalette(status: unknown): StatusPalette {
  const raw = String(status ?? "");
  const bySource = STATUS_PALETTE_BY_SOURCE[normalizeStatus(raw)];

  if (bySource) {
    return bySource;
  }

  return getStatusGroupPalette(statusGroupOf(raw));
}
