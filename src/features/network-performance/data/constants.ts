// Konstanta global dashboard — persis sumber (app_logic.js).
//
// TARGET and YTD_MONTHS used to live here. Both now come from the data:
// the SLA target from branch_monthly_reports.target_sla_percentage, and the
// active month window from the months that actually have reports
// (see queries/periods.ts). Neither can be hardcoded without going stale.

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const MONTHS_FULL = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const TR_MONTHS = MONTHS;
