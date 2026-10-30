import type { TicketArrivalHourRow } from "../types/ticketSchedule.types";

export interface BusyDateSummary {
  date: string;
  total: number;
  peakHour: number;
  peakTickets: number;
}

export interface DepartmentArrivalSummary {
  department: string;
  total: number;
  peakHour: number | null;
  peakHourTickets: number;
  peakDate: string | null;
  peakDateTickets: number;
}

export function summarizeArrivalDepartments(
  rows: TicketArrivalHourRow[],
  dates: string[],
): DepartmentArrivalSummary[] {
  const visible = new Set(dates);
  return ["DCT Support", "IT Support"].map((department) => {
    const hours = Array<number>(24).fill(0);
    const days = new Map<string, number>();
    let total = 0;
    for (const row of rows) {
      if (row.department !== department || !visible.has(row.date)) continue;
      total += row.tickets;
      hours[row.hour] += row.tickets;
      days.set(row.date, (days.get(row.date) ?? 0) + row.tickets);
    }
    const peakHour = total ? hours.indexOf(Math.max(...hours)) : null;
    const peakDay = [...days.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0];
    return {
      department,
      total,
      peakHour,
      peakHourTickets: peakHour === null ? 0 : hours[peakHour],
      peakDate: total ? peakDay?.[0] : null,
      peakDateTickets: total ? peakDay?.[1] ?? 0 : 0,
    };
  });
}

export function summarizeBusyDates(
  rows: TicketArrivalHourRow[],
  dates: string[],
  limit = 5,
): BusyDateSummary[] {
  const visible = new Set(dates);
  const dateMap = new Map<string, { total: number; hours: number[] }>();

  for (const row of rows) {
    if (!visible.has(row.date)) continue;
    let entry = dateMap.get(row.date);
    if (!entry) {
      entry = { total: 0, hours: Array(24).fill(0) };
      dateMap.set(row.date, entry);
    }
    entry.total += row.tickets;
    entry.hours[row.hour] = (entry.hours[row.hour] || 0) + row.tickets;
  }

  return [...dateMap.entries()]
    .filter(([, data]) => data.total > 0)
    .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([date, data]) => {
      let peakHour = 0;
      let peakTickets = 0;
      data.hours.forEach((count, h) => {
        if (count > peakTickets) {
          peakTickets = count;
          peakHour = h;
        }
      });
      return {
        date,
        total: data.total,
        peakHour,
        peakTickets,
      };
    });
}
