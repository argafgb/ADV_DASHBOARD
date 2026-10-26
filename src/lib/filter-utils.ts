export function parseMonthFilter(monthFilter: string = "ALL"): {
  months: number[];
  cumulativeMonths: number[];
  isAll: boolean;
  startMonth: number;
  endMonth: number;
} {
  const clean = monthFilter.trim();
  if (!clean || clean.toUpperCase() === "ALL") {
    const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    return {
      months: allMonths,
      cumulativeMonths: allMonths,
      isAll: true,
      startMonth: 1,
      endMonth: 12,
    };
  }

  const normalized = clean.replace(/\s+/g, "").toLowerCase();

  // Try parsing range like "6-7"
  const rangeParts = normalized.split(/[-–—]/);
  if (rangeParts.length === 2) {
    const start = parseMonthToken(rangeParts[0]) || 1;
    const end = parseMonthToken(rangeParts[1]) || 12;
    const safeStart = Math.min(start, end);
    const safeEnd = Math.max(start, end);

    const months = Array.from(
      { length: safeEnd - safeStart + 1 },
      (_, index) => safeStart + index,
    );

    const cumulativeMonths = Array.from(
      { length: safeEnd },
      (_, index) => index + 1,
    );

    return {
      months,
      cumulativeMonths,
      isAll: false,
      startMonth: safeStart,
      endMonth: safeEnd,
    };
  }

  // Try parsing comma-separated like "6,7"
  const commaParts = normalized.split(",");
  if (commaParts.length > 1) {
    const months = commaParts
      .map(parseMonthToken)
      .filter((m): m is number => m !== null);

    if (months.length > 0) {
      const sorted = [...new Set(months)].sort((a, b) => a - b);
      const end = sorted[sorted.length - 1];
      const cumulativeMonths = Array.from(
        { length: end },
        (_, index) => index + 1,
      );
      return {
        months: sorted,
        cumulativeMonths,
        isAll: false,
        startMonth: sorted[0],
        endMonth: end,
      };
    }
  }

  const singleMonth = parseMonthToken(normalized) || 1;
  const cumulativeMonths = Array.from(
    { length: singleMonth },
    (_, index) => index + 1,
  );
  return {
    months: [singleMonth],
    cumulativeMonths,
    isAll: false,
    startMonth: singleMonth,
    endMonth: singleMonth,
  };
}

const monthNameMap: Record<string, number> = {
  jan: 1,
  january: 1,
  januari: 1,
  feb: 2,
  february: 2,
  februari: 2,
  mar: 3,
  march: 3,
  maret: 3,
  apr: 4,
  april: 4,
  may: 5,
  mei: 5,
  jun: 6,
  june: 6,
  juni: 6,
  jul: 7,
  july: 7,
  juli: 7,
  aug: 8,
  agustus: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  okt: 10,
  october: 10,
  oktober: 10,
  nov: 11,
  november: 11,
  dec: 12,
  des: 12,
  december: 12,
  desember: 12,
};

function parseMonthToken(token: string): number | null {
  const clean = token.trim().toLowerCase();
  if (!clean) return null;
  const asNumber = parseInt(clean, 10);
  if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= 12) {
    return asNumber;
  }
  return monthNameMap[clean] ?? null;
}

const MONTH_SHORT_NAMES = [
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
 * Formats user's month filter (single month "1", range "1-6", or "ALL")
 * into a clean Indonesian label, e.g. "Jan 2026", "Jan – Jun 2026", or "Jan – Des 2026".
 */
export function formatMonthRangeLabel(
  monthFilter: string = "ALL",
  year: string,
): string {
  const parsed = parseMonthFilter(monthFilter);

  if (parsed.isAll) {
    return `Jan – Des ${year}`;
  }

  if (parsed.months.length === 1) {
    const mName =
      MONTH_SHORT_NAMES[parsed.months[0] - 1] ?? `Bln ${parsed.months[0]}`;
    return `${mName} ${year}`;
  }

  const startName =
    MONTH_SHORT_NAMES[parsed.startMonth - 1] ?? `Bln ${parsed.startMonth}`;
  const endName =
    MONTH_SHORT_NAMES[parsed.endMonth - 1] ?? `Bln ${parsed.endMonth}`;

  if (parsed.startMonth === parsed.endMonth) {
    return `${startName} ${year}`;
  }

  return `${startName} – ${endName} ${year}`;
}
