import { SHORT_MONTH_NAMES } from "@/lib/helpdesk/month-filter";
import { formatPeriodLabel } from "@/lib/helpdesk/period-formatter";

export const shortMonthNames = SHORT_MONTH_NAMES;

export function getPeriodLabel(m: string, y: string | number): string {
  return formatPeriodLabel({ year: y, month: m });
}
