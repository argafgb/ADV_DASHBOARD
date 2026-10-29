import { INDONESIAN_MONTH_NAMES, getMonthName } from "@/lib/helpdesk/month-filter";

export const LEADERBOARD_MONTHS = INDONESIAN_MONTH_NAMES.map((name, idx) => ({
  v: String(idx + 1),
  t: name,
}));

export function getLeaderboardMonthLabel(
  monthValue: string,
  fallbackMonth?: number | string,
): string {
  const num = parseInt(monthValue, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return getMonthName(num, false);
  }
  if (fallbackMonth !== undefined) {
    const fallbackNum =
      typeof fallbackMonth === "number"
        ? fallbackMonth
        : parseInt(fallbackMonth, 10);
    if (!isNaN(fallbackNum) && fallbackNum >= 1 && fallbackNum <= 12) {
      return getMonthName(fallbackNum, false);
    }
  }
  return "September";
}
