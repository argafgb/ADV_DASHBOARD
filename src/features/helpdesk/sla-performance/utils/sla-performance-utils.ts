import { SHORT_MONTH_NAMES, getMonthName } from "@/lib/helpdesk/month-filter";
import { formatPeriodLabel } from "@/lib/helpdesk/period-formatter";

export const monthNames = SHORT_MONTH_NAMES;

export function getMonthShortName(monthNumber: number): string {
  return getMonthName(monthNumber, true);
}

export function getPeriodLabel(year: string, month: string): string {
  return formatPeriodLabel({ year, month });
}
