import { SHORT_MONTH_NAMES } from "./month-filter";

export function formatDelta(
  current: number,
  prev: number,
): { value: string; direction: "up" | "down"; available: boolean } {
  if (!prev) return { value: "", direction: "up", available: false };
  const pct = ((current - prev) / prev) * 100;
  return {
    value: `${Math.abs(pct).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`,
    direction: pct >= 0 ? "up" : "down",
    available: true,
  };
}

export function formatHoursDelta(
  current: number,
  prev: number,
): { value: string; direction: "up" | "down"; available: boolean } {
  if (!prev) return { value: "", direction: "up", available: false };
  const diff = current - prev;
  return {
    value: `${Math.abs(diff).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jam`,
    direction: diff >= 0 ? "up" : "down",
    available: true,
  };
}

export function formatHours(h: number): string {
  return h.toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " jam";
}

export function formatCost(c: number): string {
  const jt = c / 1_000_000;
  return `Rp${jt.toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
}

export function formatWeekLabel(weekStart: string): string {
  const [, m, d] = weekStart.split("-");
  const monthName = SHORT_MONTH_NAMES[parseInt(m, 10) - 1] ?? m;
  return `Minggu ${parseInt(d, 10)} ${monthName}`;
}

export function formatWeekShort(weekStart: string): string {
  const [, m, d] = weekStart.split("-");
  return `${parseInt(d, 10)}/${parseInt(m, 10)}`;
}

export function idNum(value: number, digits = 0) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
