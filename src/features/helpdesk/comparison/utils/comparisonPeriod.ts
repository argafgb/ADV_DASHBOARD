import { parseMonthFilter } from "@/lib/filter-utils";

export function parseQuarter(quarter = "ALL"): number | null {
  const match = /^Q?([1-4])$/.exec(quarter.trim().toUpperCase());
  return match ? Number(match[1]) : null;
}

export function comparisonPeriodMonths(month = "ALL", quarter = "ALL"): number[] {
  const parsed = parseMonthFilter(month === "0" ? "ALL" : month);
  const quarterNumber = parseQuarter(quarter);
  return (parsed.isAll ? Array.from({ length: 12 }, (_, i) => i + 1) : parsed.months)
    .filter(value => quarterNumber === null || Math.ceil(value / 3) === quarterNumber);
}

export function comparisonPeriodLabel(month = "ALL", quarter = "ALL"): string {
  const months = comparisonPeriodMonths(month, quarter);
  if (!months.length) return "Tidak ada bulan dalam filter";
  if (months.length === 12) return "Semua Bulan";
  const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return months.map(value => names[value - 1]).join(", ");
}
