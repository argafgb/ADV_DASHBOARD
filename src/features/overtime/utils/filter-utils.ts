export function parseMonthToken(token: string): number | null {
  const num = parseInt(token, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;

  const lower = token.toLowerCase();
  const months = [
    "jan", "feb", "mar", "apr", "mei", "may", "jun",
    "jul", "agu", "aug", "sep", "okt", "oct", "nov", "des", "dec",
  ];
  const idx = months.findIndex((m) => lower.startsWith(m));
  if (idx !== -1) {
    if (idx === 5) return 5; // may -> mei
    if (idx > 5 && idx <= 8) return idx; // agu -> agu
    if (idx > 8) return idx - 1; // handling english aliases approx
    return idx + 1;
  }
  return null;
}

export function parseMonthFilter(monthFilter: string = "ALL"): {
  months: number[];
  isAll: boolean;
  startMonth: number;
  endMonth: number;
} {
  const clean = monthFilter.trim();
  if (!clean || clean.toUpperCase() === "ALL") {
    return {
      months: [],
      isAll: true,
      startMonth: 1,
      endMonth: 12,
    };
  }

  const normalized = clean.replace(/\s+/g, "").toLowerCase();

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

    return {
      months,
      isAll: false,
      startMonth: safeStart,
      endMonth: safeEnd,
    };
  }

  const single = parseMonthToken(normalized);
  if (single !== null) {
    return {
      months: [single],
      isAll: false,
      startMonth: single,
      endMonth: single,
    };
  }

  return {
    months: [],
    isAll: true,
    startMonth: 1,
    endMonth: 12,
  };
}
