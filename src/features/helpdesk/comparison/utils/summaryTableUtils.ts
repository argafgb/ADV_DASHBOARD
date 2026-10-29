export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  startIndex: number;
  endIndex: number;
}

export function paginateSummary<T>(
  data: T[],
  page: number = 1,
  limit: number = 12,
): PaginatedResult<T> {
  const totalItems = data ? data.length : 0;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const validPage = Math.max(1, Math.min(page, totalPages));

  const start = (validPage - 1) * limit;
  const end = Math.min(start + limit, totalItems);
  const items = data ? data.slice(start, end) : [];

  return {
    items,
    totalItems,
    totalPages,
    currentPage: validPage,
    startIndex: totalItems > 0 ? start + 1 : 0,
    endIndex: end,
  };
}

/**
 * Calculates Year-over-Year (YoY) growth percentage.
 * - If previous is 0 and current is 0 -> 0%
 * - If previous is 0 and current > 0 -> 100% (new appearance / full increase)
 * - If previous is 0 and current < 0 -> -100%
 * - Otherwise: ((current - previous) / previous) * 100
 */
export function calculateGrowthPercentage(
  previous: number,
  current: number,
): number {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0 && current > 0) return 100;
  if (previous === 0 && current < 0) return -100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}
