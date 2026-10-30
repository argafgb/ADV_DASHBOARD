import { SHORT_MONTH_NAMES, getMaxSelectableMonth } from "./month-filter";

export function formatDeptLabel(dept?: string): string {
  if (!dept || dept.trim().toUpperCase() === "ALL") {
    return "All Departments";
  }
  return dept.trim();
}

export function formatPeriodLabel(filters: {
  year?: string | number;
  month?: string;
  quarter?: string;
}): string {
  const yearStr = String(filters.year || new Date().getFullYear());
  const quarterClean = (filters.quarter || "").trim().toUpperCase();

  // If Quarter is active (Q1, Q2, Q3, Q4)
  if (quarterClean && quarterClean !== "ALL") {
    switch (quarterClean) {
      case "Q1":
        return `Jan-Mar ${yearStr}`;
      case "Q2":
        return `Apr-Jun ${yearStr}`;
      case "Q3":
        return `Jul-Sep ${yearStr}`;
      case "Q4":
        return `Oct-Dec ${yearStr}`;
      default:
        break;
    }
  }

  const monthClean = (filters.month || "").trim();

  if (!monthClean || monthClean.toUpperCase() === "ALL") {
    const maxM = getMaxSelectableMonth(yearStr);
    const endName = SHORT_MONTH_NAMES[Math.max(0, Math.min(11, maxM - 1))];
    if (maxM <= 1) {
      return `Jan ${yearStr}`;
    }
    return `Jan-${endName} ${yearStr}`;
  }

  // Check single or range month format like "3" or "3-4"
  const rangeMatch = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(monthClean);
  if (rangeMatch) {
    const startIdx = parseInt(rangeMatch[1], 10) - 1;
    const endIdx = rangeMatch[2] ? parseInt(rangeMatch[2], 10) - 1 : startIdx;

    if (startIdx >= 0 && startIdx < 12 && endIdx >= 0 && endIdx < 12) {
      const startName = SHORT_MONTH_NAMES[startIdx];
      const endName = SHORT_MONTH_NAMES[endIdx];

      if (startIdx === endIdx) {
        return `${startName} ${yearStr}`;
      }
      return `${startName}-${endName} ${yearStr}`;
    }
  }

  return `${yearStr}`;
}
