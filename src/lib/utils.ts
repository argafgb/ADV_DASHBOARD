import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number | string): string {
  return typeof n === "number" ? n.toLocaleString("id-ID") : n;
}

/**
 * Compact formatting for large numbers or currency strings:
 * e.g., 100.6K (ribu), 156.7M (juta), 1.2B (miliar).
 * Preserves currency prefix like "Rp " if present.
 */
export function fmtCompact(val: number | string): string {
  if (val === undefined || val === null || val === "") return "";

  let prefix = "";
  let strVal = String(val).trim();

  const prefixMatch = strVal.match(/^([^\d\-\.]+)/);
  if (prefixMatch) {
    prefix = prefixMatch[1];
    strVal = strVal.slice(prefix.length).trim();
  }

  let cleaned = strVal;
  if ((cleaned.match(/\./g) || []).length > 1) {
    cleaned = cleaned.replace(/\./g, "");
  } else if ((cleaned.match(/,/g) || []).length > 1) {
    cleaned = cleaned.replace(/,/g, "");
  } else {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return String(val);

  const abs = Math.abs(num);
  let formattedNumber: string;

  if (abs >= 1_000_000_000) {
    const b = num / 1_000_000_000;
    formattedNumber = (b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)) + "B";
  } else if (abs >= 1_000_000) {
    const m = num / 1_000_000;
    formattedNumber = (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + "M";
  } else if (abs >= 1_000) {
    const k = num / 1_000;
    formattedNumber = (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "K";
  } else {
    formattedNumber = num.toLocaleString("id-ID");
  }

  return `${prefix}${formattedNumber}`;
}

/**
 * Bulan ditulis pendek dalam bahasa Indonesia supaya seluruh dashboard
 * mencetak tanggal dengan ejaan yang sama.
 */
const DISPLAY_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Jam sinkronisasi dilaporkan pada waktu Jakarta, bukan waktu pembaca, supaya
 * satu proses n8n terbaca sama oleh siapa pun yang membuka dashboard.
 */
const JAKARTA_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const JAKARTA_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Sinkronisasi yang belum pernah berjalan bukan kolom yang lupa diisi. */
const MISSING_TIMESTAMP_VALUE = "Belum tersedia";

export function formatSyncTimestamp(
  value: number | string | Date | null | undefined,
): string {
  if (value == null) return MISSING_TIMESTAMP_VALUE;

  const time =
    value instanceof Date
      ? value.getTime()
      : typeof value === "number"
        ? value
        : Date.parse(String(value));
  if (Number.isNaN(time)) return MISSING_TIMESTAMP_VALUE;

  const [year, month, day] = JAKARTA_DAY.format(time).split("-");
  const displayMonth = DISPLAY_MONTHS[Number(month) - 1];
  if (displayMonth === undefined) return MISSING_TIMESTAMP_VALUE;

  return `${Number(day)} ${displayMonth} ${year}, ${JAKARTA_CLOCK.format(time)}`;
}

/** Chart palette constants. */
export const C = {
  accent: "#2563EB",
  accentDark: "#1D4ED8",
  amber: "#F59E0B",
  green: "#10B981",
  red: "#EF4444",
  violet: "#7C3AED",
  track: "#EEF1F6",
  grid: "#E5E7EB",
  axis: "#9CA3AF",
  blue2: "#3B82F6",
  greenFg: "#059669",
  redFg: "#DC2626",
  text: "#111827",
  muted: "#6B7280",
  placeholder: "#9CA3AF",
} as const;
