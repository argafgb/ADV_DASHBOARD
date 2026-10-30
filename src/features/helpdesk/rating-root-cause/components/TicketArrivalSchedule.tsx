"use client";

import EmptyState from "@/components/shared/EmptyState";
import { useFilters } from "@/context/HelpdeskFilterContext";
import { useQuarterFilter } from "@/features/helpdesk/comparison/hooks/useQuarterFilter";
import { INDONESIAN_MONTH_NAMES, getMaxSelectableMonth } from "@/lib/helpdesk/month-filter";
import { parseMonthFilter } from "@/lib/filter-utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { fetchTicketArrivalSchedule } from "../actions";
import type { TicketArrivalHourRow } from "../types/ticketSchedule.types";
import { formatNumber } from "../utils/rating-root-cause-utils";
import { summarizeBusyDates } from "../utils/ticket-arrival";

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DAY_NAMES_FULL = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];
const FIXED_NATIONAL_HOLIDAYS: Record<string, string> = {
  "01-01": "Tahun Baru Masehi",
  "05-01": "Hari Buruh Internasional",
  "06-01": "Hari Lahir Pancasila",
  "08-17": "Hari Kemerdekaan Republik Indonesia",
  "12-25": "Hari Raya Natal",
};

const BANDS = [
  { start: 0, end: 6, label: "00:00–06:00", short: "00–06" },
  { start: 6, end: 12, label: "06:00–12:00", short: "06–12" },
  { start: 12, end: 18, label: "12:00–18:00", short: "12–18" },
  { start: 18, end: 24, label: "18:00–00:00", short: "18–00" },
] as const;

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function percentage(value: number, total: number) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : "0%";
}

function getRedDateInfo(year: number, month: number, day: number) {
  const fixedKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const holiday = FIXED_NATIONAL_HOLIDAYS[fixedKey];
  if (holiday) return { isRedDate: true, name: holiday };

  const dayOfWeek = new Date(year, month - 1, day).getDay();
  if (dayOfWeek === 0) return { isRedDate: true, name: "Hari Minggu" };
  if (dayOfWeek === 6) return { isRedDate: true, name: "Hari Sabtu" };
  return { isRedDate: false, name: "" };
}

function heatClass(value: number, maxValue: number) {
  if (!value)
    return "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500";
  const intensity = value / maxValue;
  if (intensity < 0.25)
    return "border-blue-100 bg-blue-50 text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200";
  if (intensity < 0.5)
    return "border-blue-200 bg-blue-200 text-blue-950 dark:border-blue-900 dark:bg-blue-900/50 dark:text-blue-100";
  if (intensity < 0.75)
    return "border-blue-500 bg-blue-500 text-white dark:border-blue-600 dark:bg-blue-600";
  return "border-blue-800 bg-blue-700 text-white dark:border-blue-700 dark:bg-blue-700";
}

function weeklyHeatClass(value: number, maxValue: number) {
  if (!value)
    return "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500";
  const intensity = value / maxValue;
  if (intensity < 0.25)
    return "border-blue-100 bg-blue-50 text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200";
  if (intensity < 0.5)
    return "border-blue-200 bg-blue-200 text-blue-950 dark:border-blue-900 dark:bg-blue-900/50 dark:text-blue-100";
  if (intensity < 0.75)
    return "border-blue-500 bg-blue-500 text-white dark:border-blue-600 dark:bg-blue-600";
  return "border-blue-800 bg-blue-700 text-white dark:border-blue-700 dark:bg-blue-700";
}

function TicketDayModal({
  date,
  hours,
  selectedBand,
  onClose,
}: {
  date: string | null;
  hours: number[];
  selectedBand: string | null;
  onClose: () => void;
}) {
  if (!date || typeof document === "undefined") return null;
  const parsed = new Date(`${date}T00:00:00`);
  const total = hours.reduce((sum, value) => sum + value, 0);
  const bands = BANDS.map((band) => ({
    ...band,
    tickets: hours
      .slice(band.start, band.end)
      .reduce((sum, value) => sum + value, 0),
  }));
  const peak = bands.reduce(
    (best, item) => (item.tickets > best.tickets ? item : best),
    bands[0],
  );
  const max = Math.max(...bands.map((item) => item.tickets), 1);
  const mondayIndex = (parsed.getDay() + 6) % 7;
  const redDate = getRedDateInfo(
    parsed.getFullYear(),
    parsed.getMonth() + 1,
    parsed.getDate(),
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-950 dark:text-white">
                {DAY_NAMES_FULL[mondayIndex]}, {parsed.getDate()}{" "}
                {INDONESIAN_MONTH_NAMES[parsed.getMonth()]}{" "}
                {parsed.getFullYear()}
              </h3>
              {redDate.isRedDate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <Flag className="h-3 w-3 fill-current" />
                  {redDate.name}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Rincian kemunculan tiket per 6 jam
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Tutup detail"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div
          className={`grid gap-3 border-b border-slate-200 p-5 dark:border-zinc-800 ${selectedBand ? "grid-cols-3" : "grid-cols-2"}`}
        >
          <div className="rounded-xl border border-slate-200 p-4 dark:border-zinc-700">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Tiket
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
              {formatNumber(total)}
            </p>
          </div>
          {selectedBand && (
            <div className="rounded-xl border border-blue-600 bg-blue-600 p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                Rentang Dipilih
              </p>
              <p className="mt-1 text-lg font-black">{selectedBand}</p>
              <p className="text-xs text-blue-100">
                {formatNumber(
                  bands.find((band) => band.label === selectedBand)?.tickets ??
                    0,
                )}{" "}
                tiket
              </p>
            </div>
          )}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
              Blok Tersibuk
            </p>
            <p className="mt-1 text-xl font-black text-blue-600">
              {peak.label}
            </p>
            <p className="text-xs text-blue-500">
              {formatNumber(peak.tickets)} tiket
            </p>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {bands.map((band) => (
            <div
              key={band.label}
              className={`rounded-xl border p-3 ${band.label === selectedBand ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/30 dark:ring-blue-900/30" : "border-slate-200 dark:border-zinc-800"}`}
            >
              <div className="flex items-center gap-2 text-xs">
                <strong className="text-slate-700 dark:text-zinc-200">
                  {band.label}
                </strong>
                {band.label === peak.label && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950/50">
                    Tertinggi
                  </span>
                )}
                <span className="ml-auto font-bold text-slate-950 dark:text-white">
                  {formatNumber(band.tickets)} tiket
                </span>
                <span className="w-11 text-right text-slate-400">
                  {percentage(band.tickets, total)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className={`h-full min-w-1 rounded-full ${band.label === peak.label ? "bg-blue-600" : "bg-blue-300"}`}
                  style={{ width: `${(band.tickets / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TicketArrivalScheduleSkeleton({ view }: { view: "month" | "week" }) {
  const pulse = "animate-pulse rounded bg-slate-200 dark:bg-zinc-800";
  return (
    <div aria-label="Memuat jadwal tiket">
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-950/40">
          <div className={`h-3 w-24 ${pulse}`} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={`h-18 rounded-xl ${pulse}`} />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[90px_1fr_36px] items-center gap-3"
              >
                <div className={`h-3 ${pulse}`} />
                <div className={`h-2 ${pulse}`} />
                <div className={`h-3 ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`h-24 rounded-xl ${pulse}`} />
          <div className={`h-24 rounded-xl ${pulse}`} />
          <div className={`col-span-2 h-24 rounded-xl ${pulse}`} />
        </div>
      </div>
      {view === "week" ? (
        <div className="mt-6 min-w-0 overflow-hidden">
          <div className="grid grid-cols-[104px_repeat(7,minmax(0,1fr))] gap-1">
            <div />
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className={`mx-auto h-8 w-14 ${pulse}`} />
            ))}
            {Array.from({ length: 5 }).flatMap((_, row) => [
              <div
                key={`label-${row}`}
                className={`h-3 self-center ${pulse}`}
              />,
              ...Array.from({ length: 7 }).map((__, column) => (
                <div
                  key={`${row}-${column}`}
                  className={`h-12 rounded-lg ${pulse}`}
                />
              )),
            ])}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className={`h-31 rounded-lg ${pulse}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TicketArrivalSchedule() {
  const { year, month, dept } = useFilters();
  const { quarter } = useQuarterFilter();
  const [rows, setRows] = useState<TicketArrivalHourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week">("month");
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBand, setSelectedBand] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.resolve()
      .then(() => {
        if (mounted) setLoading(true);
        return fetchTicketArrivalSchedule({ year, month, dept, quarter });
      })
      .then((result) => {
        if (!mounted) return;
        setRows(result.rows);
        setWeekIndex(0);
      })
      .catch((error) => console.error("Gagal memuat jadwal tiket:", error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [year, month, dept, quarter]);

  const availableMonths = useMemo(
    () =>
      [...new Set(rows.map((row) => Number(row.date.slice(5, 7))))].sort(
        (a, b) => a - b,
      ),
    [rows],
  );

  const activeMonth = useMemo(() => {
    const { months, isAll, endMonth } = parseMonthFilter(month);
    if (!isAll && months.length > 0) {
      return endMonth;
    }
    if (availableMonths.length > 0) {
      return availableMonths[availableMonths.length - 1];
    }
    const maxM = getMaxSelectableMonth(year);
    return Math.min(Math.max(1, maxM), 12);
  }, [month, availableMonths, year]);

  const byDate = useMemo(() => {
    const map = new Map<string, number[]>();
    rows.forEach((row) => {
      const hours = map.get(row.date) ?? Array(24).fill(0);
      hours[row.hour] = (hours[row.hour] || 0) + row.tickets;
      map.set(row.date, hours);
    });
    return map;
  }, [rows]);

  const daysInMonth = activeMonth
    ? new Date(Number(year), activeMonth, 0).getDate()
    : 0;
  const firstDayOffset = activeMonth
    ? (new Date(Number(year), activeMonth - 1, 1).getDay() + 6) % 7
    : 0;
  const calendarCells = useMemo(() => {
    const cells: Array<number | null> = Array(firstDayOffset).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [firstDayOffset, daysInMonth]);
  const weekCount = Math.max(1, calendarCells.length / 7);
  const firstCalendarDate = activeMonth
    ? new Date(Number(year), activeMonth - 1, 1 - firstDayOffset)
    : new Date(Number(year), 0, 1);
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstCalendarDate);
    date.setDate(firstCalendarDate.getDate() + weekIndex * 7 + index);
    return date;
  });
  const visibleDates =
    view === "week"
      ? weekDates
      : Array.from(
          { length: daysInMonth },
          (_, index) => new Date(Number(year), activeMonth - 1, index + 1),
        );

  const summary = useMemo(() => {
    const hourTotals = Array(24).fill(0) as number[];
    const dayTotals = new Map<string, number>();
    visibleDates.forEach((date) => {
      const key = dateKey(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      );
      const hours = byDate.get(key) ?? Array(24).fill(0);
      hours.forEach((value, hour) => {
        hourTotals[hour] += value;
      });
      dayTotals.set(
        key,
        hours.reduce((sum, value) => sum + value, 0),
      );
    });
    const total = hourTotals.reduce((sum, value) => sum + value, 0);
    const peaks = hourTotals
      .map((tickets, hour) => ({ hour, tickets }))
      .sort((a, b) => b.tickets - a.tickets || a.hour - b.hour)
      .slice(0, 3);
    const bands = BANDS.map((band) => ({
      ...band,
      tickets: hourTotals
        .slice(band.start, band.end)
        .reduce((sum, value) => sum + value, 0),
    }));
    const topBand = bands.reduce(
      (best, item) => (item.tickets > best.tickets ? item : best),
      bands[0],
    );
    const topDay =
      [...dayTotals].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )[0] ?? (["", 0] as [string, number]);
    const topDate = topDay[0] ? new Date(`${topDay[0]}T00:00:00`) : null;
    return {
      total,
      maxDayTotal: Math.max(1, ...dayTotals.values()),
      peaks,
      bands,
      topBand,
      topDay,
      topDate,
      average: visibleDates.length
        ? Math.round(total / visibleDates.length)
        : 0,
    };
  }, [visibleDates, byDate]);

  const maxBand = Math.max(...summary.bands.map((band) => band.tickets), 1);
  const maxWeeklySlot = Math.max(
    1,
    ...BANDS.flatMap((band) =>
      weekDates.map((date) => {
        const key = dateKey(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate(),
        );
        const hours = byDate.get(key) ?? Array(24).fill(0);
        return hours
          .slice(band.start, band.end)
          .reduce((sum, value) => sum + value, 0);
      }),
    ),
  );

  const topBusyDates = useMemo(() => {
    const dates = visibleDates.map((date) =>
      dateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()),
    );
    return summarizeBusyDates(rows, dates, 3);
  }, [rows, visibleDates]);

  const topDateDetails = useMemo(() => {
    return topBusyDates.map((item) => {
      const parsed = new Date(`${item.date}T00:00:00`);
      const dayOfWeekIndex = (parsed.getDay() + 6) % 7;
      const dayName = DAY_NAMES_FULL[dayOfWeekIndex];
      const redInfo = getRedDateInfo(
        parsed.getFullYear(),
        parsed.getMonth() + 1,
        parsed.getDate(),
      );
      const formattedDate = `${parsed.getDate()} ${INDONESIAN_MONTH_NAMES[parsed.getMonth()] ?? ""} ${parsed.getFullYear()}`;
      const dayOnly = `${parsed.getDate()} ${INDONESIAN_MONTH_NAMES[parsed.getMonth()]?.slice(0, 3) ?? ""}`;
      return {
        ...item,
        dayName,
        redInfo,
        formattedDate,
        dayOnly,
      };
    });
  }, [topBusyDates]);

  const mainTopDate = topDateDetails[0] ?? null;
  const otherTopDates = topDateDetails.slice(1, 3);

  const selectedHours = selectedDate
    ? (byDate.get(selectedDate) ?? Array(24).fill(0))
    : Array(24).fill(0);
  const periodLabel =
    view === "month"
      ? `${INDONESIAN_MONTH_NAMES[activeMonth - 1] ?? ""} ${year}`
      : `${weekDates[0].getDate()} ${INDONESIAN_MONTH_NAMES[weekDates[0].getMonth()]}${weekDates[0].getFullYear() !== weekDates[6].getFullYear() ? ` ${weekDates[0].getFullYear()}` : ""} – ${weekDates[6].getDate()} ${INDONESIAN_MONTH_NAMES[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Ticket Arrival Schedule</h2>
            <p className="mt-1 text-sm text-slate-400">Sebaran tiket masuk menurut hari dan jam.</p>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-1 dark:border-zinc-700">
            {(["month", "week"] as const).map((item) => (
              <button key={item} onClick={() => setView(item)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${view === item ? "bg-blue-600 text-white" : "text-slate-500"}`}>
                {item === "month" ? "Bulan" : "Minggu"}
              </button>
            ))}
          </div>
        </div>
        <TicketArrivalScheduleSkeleton view={view} />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">
            Ticket Arrival Schedule
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Sebaran tiket masuk menurut hari dan jam.
          </p>
        </div>
        {availableMonths.length > 0 && (
          <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
            {view === "week" ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  disabled={weekIndex === 0}
                  onClick={() => setWeekIndex((value) => Math.max(0, value - 1))}
                  aria-label="Minggu sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-44 text-center text-sm font-bold text-slate-800 dark:text-zinc-100">
                  {periodLabel}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  disabled={weekIndex >= weekCount - 1}
                  onClick={() =>
                    setWeekIndex((value) => Math.min(weekCount - 1, value + 1))
                  }
                  aria-label="Minggu berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="px-2 py-1 text-sm font-bold text-slate-800 dark:text-zinc-100">
                {periodLabel}
              </span>
            )}
            <div className="ml-1 flex rounded-lg border border-slate-200 p-1 dark:border-zinc-700">
              {(["month", "week"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setView(item);
                    setWeekIndex(0);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${view === item ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200"}`}
                >
                  {item === "month" ? "Bulan" : "Minggu"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!rows.length ? (
        <EmptyState
          className="mt-5 min-h-52"
          icon={CalendarDays}
          title="Data Jadwal Tiket Tidak Ditemukan"
          description="Tidak ada time_input untuk periode dan departemen yang dipilih."
        />
      ) : (
        <>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Jam Tersibuk
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {summary.peaks.map((peak, index) => (
                  <div
                    key={peak.hour}
                    className={`rounded-xl border p-3 ${index === 0 ? "border-blue-600 bg-blue-600 text-white" : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40"}`}
                  >
                    <p className="text-xs font-bold opacity-75">#{index + 1}</p>
                    <p className="font-bold">
                      {String(peak.hour).padStart(2, "0")}:00–
                      {String((peak.hour + 1) % 24).padStart(2, "0")}:00
                    </p>
                    <p className="text-xs opacity-80">
                      {formatNumber(peak.tickets)} tiket ·{" "}
                      {percentage(peak.tickets, summary.total)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {summary.bands.map((band) => (
                  <div
                    key={band.label}
                    className="grid grid-cols-[110px_1fr_48px_54px] items-center gap-2 text-sm"
                  >
                    <span className="font-semibold text-slate-600 dark:text-zinc-300">
                      {band.label}
                    </span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                      <div
                        className={`h-full min-w-1 rounded-full ${band.label === summary.topBand.label ? "bg-blue-600" : "bg-blue-300"}`}
                        style={{ width: `${(band.tickets / maxBand) * 100}%` }}
                      />
                    </div>
                    <strong className="text-right">
                      {formatNumber(band.tickets)}
                    </strong>
                    <span className="text-right text-slate-400">
                      {percentage(band.tickets, summary.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Total Tiket
                </p>
                <p className="mt-1 text-2xl font-black">
                  {formatNumber(summary.total)}
                </p>
                <p className="text-xs text-slate-400">
                  Rata-rata {formatNumber(summary.average)} tiket/hari
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rentang 6 Jam Tersibuk
                </p>
                <p className="mt-1 text-lg font-black text-blue-600">
                  {summary.topBand.label}
                </p>
                <p className="text-xs text-slate-400">
                  {percentage(summary.topBand.tickets, summary.total)} dari total ({formatNumber(summary.topBand.tickets)} tiket)
                </p>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Hari & Tanggal Tersibuk
                  </p>
                  {mainTopDate && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                      <Flame className="h-3 w-3" /> Paling Ramai
                    </span>
                  )}
                </div>

                {mainTopDate ? (
                  <div className="mt-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(mainTopDate.date);
                            setSelectedBand(null);
                          }}
                          className="group text-left cursor-pointer"
                        >
                          <span className="text-lg font-black text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {mainTopDate.dayName}, {mainTopDate.formattedDate}
                          </span>
                        </button>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                          Puncak tiket di jam{" "}
                          <strong className="text-slate-800 dark:text-zinc-200">
                            {String(mainTopDate.peakHour).padStart(2, "0")}:00–
                            {String((mainTopDate.peakHour + 1) % 24).padStart(2, "0")}:00
                          </strong>{" "}
                          ({mainTopDate.peakTickets} tiket)
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                          {formatNumber(mainTopDate.total)} tiket
                        </span>
                        <p className="text-xs text-slate-400">
                          {percentage(mainTopDate.total, summary.total)} dari total
                        </p>
                      </div>
                    </div>

                    {otherTopDates.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2.5 text-xs dark:border-zinc-800">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Tanggal ramai lainnya:
                        </span>
                        {otherTopDates.map((item, idx) => (
                          <button
                            key={item.date}
                            type="button"
                            onClick={() => {
                              setSelectedDate(item.date);
                              setSelectedBand(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 cursor-pointer"
                            title={`Klik untuk rincian ${item.formattedDate}`}
                          >
                            <span className="text-[10px] font-bold text-slate-400">
                              #{idx + 2}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {item.dayName}, {item.dayOnly}
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {item.total} tkt
                            </span>
                            <span className="text-[11px] text-slate-400">
                              (jam {String(item.peakHour).padStart(2, "0")}:00)
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">—</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400">
            <span className="mr-1">Intensitas:</span>
            {["<25%", "25-49%", "50-74%", "75-100%"].map((label, index) => {
              const colors = [
                "bg-blue-50 ring-blue-100",
                "bg-blue-200 ring-blue-200",
                "bg-blue-500 ring-blue-500 text-white",
                "bg-blue-700 ring-blue-700 text-white",
              ];
              return (
                <span
                  key={label}
                  className={`inline-flex items-center rounded-full px-2.5 py-1 ring-1 ring-inset ${colors[index]}`}
                >
                  {label}
                </span>
              );
            })}
          </div>

          <div
            className={
              view === "month" ? "mt-2 overflow-x-auto" : "mt-5 overflow-x-auto"
            }
          >
            {view === "month" ? (
              <div className="min-w-[820px]">
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_NAMES.map((name, index) => (
                    <div
                      key={name}
                      className={`py-2.5 text-center text-sm font-bold uppercase tracking-wide ${index >= 5 ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-zinc-300"}`}
                    >
                      {name}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarCells.map((day, index) => {
                    if (!day)
                      return (
                        <div
                          key={`empty-${index}`}
                          aria-hidden
                          className="min-h-31 rounded-lg border border-dashed border-slate-200 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_7px,rgba(148,163,184,0.06)_7px,rgba(148,163,184,0.06)_9px)] dark:border-zinc-800 dark:bg-[repeating-linear-gradient(135deg,transparent_0,transparent_7px,rgba(113,113,122,0.08)_7px,rgba(113,113,122,0.08)_9px)]"
                        />
                      );
                    const key = dateKey(Number(year), activeMonth, day);
                    const hours = byDate.get(key) ?? Array(24).fill(0);
                    const total = hours.reduce((sum, value) => sum + value, 0);
                    const redDate = getRedDateInfo(
                      Number(year),
                      activeMonth,
                      day,
                    );
                    const maxH = Math.max(...hours);
                    const peakH = hours.indexOf(maxH);
                    const isTopDay = summary.topDay[0] === key && total > 0;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDate(key);
                          setSelectedBand(null);
                        }}
                        className={`min-h-31 rounded-lg border p-2 text-left ${heatClass(total, summary.maxDayTotal)}`}
                        title={redDate.isRedDate ? redDate.name : undefined}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          {/* Date Badge: Visual kalender penanggalan yang tegas */}
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className={`inline-flex h-6 min-w-6 px-1.5 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                                redDate.isRedDate
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-400/40 font-extrabold"
                                  : total / summary.maxDayTotal >= 0.75
                                    ? "bg-white/25 text-white shadow-2xs font-extrabold"
                                    : "bg-white/90 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-2xs ring-1 ring-slate-900/5 dark:ring-white/10"
                              }`}
                            >
                              {day}
                              {redDate.isRedDate && (
                                <Flag
                                  className="h-2.5 w-2.5 ml-0.5 fill-current text-rose-600 dark:text-rose-400 shrink-0"
                                  aria-label={redDate.name}
                                />
                              )}
                            </span>
                            {isTopDay && (
                              <span className="shrink-0 rounded bg-amber-400/95 px-1 py-0.5 text-[8px] font-black uppercase tracking-tight text-amber-950 shadow-2xs">
                                Teramai
                              </span>
                            )}
                          </div>

                          {/* Total Ticket: Angka metrik dengan label unit jelas */}
                          <div className="flex items-baseline gap-0.5 shrink-0 text-right">
                            <span className="text-base font-black tracking-tight leading-none">
                              {formatNumber(total)}
                            </span>
                            <span className="text-[10px] font-semibold opacity-75 uppercase tracking-wide">
                              tkt
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {BANDS.map((band) => (
                            <div
                              key={band.label}
                              className="flex rounded bg-white/20 px-1.5 py-0.5 text-xs font-bold leading-none"
                            >
                              <span>{band.short}</span>
                              <span className="ml-auto">
                                {formatNumber(
                                  hours
                                    .slice(band.start, band.end)
                                    .reduce((sum, value) => sum + value, 0),
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        {total > 0 && maxH > 0 && (
                          <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold opacity-90">
                            <span className="opacity-75">Puncak:</span>
                            <span>
                              {String(peakH).padStart(2, "0")}:00 ({maxH} tkt)
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[104px_repeat(7,minmax(96px,1fr))] gap-0.75">
                  <div className="flex items-end px-1 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Waktu
                  </div>
                  {weekDates.map((date, index) => {
                    const day = date.getDate();
                    const redDate = getRedDateInfo(
                      date.getFullYear(),
                      date.getMonth() + 1,
                      day,
                    );
                    return (
                      <div
                        key={date.toISOString()}
                        className={`px-1 pb-2 text-center ${redDate.isRedDate ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-zinc-200"}`}
                        title={redDate.name || undefined}
                      >
                        <div className="text-xs font-extrabold uppercase tracking-wide">
                          {DAY_NAMES[index]}
                        </div>
                        <div className="mt-0.5 flex items-center justify-center gap-1 text-base font-black">
                          {day}
                          {redDate.isRedDate && (
                            <Flag
                              className="h-3.5 w-3.5 fill-current"
                              aria-label={redDate.name}
                            />
                          )}
                        </div>
                        <div className="text-[10px] font-semibold opacity-75">
                          {INDONESIAN_MONTH_NAMES[date.getMonth()].slice(0, 3)}
                        </div>
                      </div>
                    );
                  })}
                  {BANDS.map((band) => (
                    <div key={band.label} className="contents">
                      <div className="flex min-h-12 items-center px-1 text-xs font-bold text-slate-600 dark:text-zinc-300">
                        {band.label}
                      </div>
                      {weekDates.map((date, index) => {
                        const day = date.getDate();
                        const key = dateKey(
                          date.getFullYear(),
                          date.getMonth() + 1,
                          day,
                        );
                        const hours = byDate.get(key) ?? Array(24).fill(0);
                        const tickets = hours
                          .slice(band.start, band.end)
                          .reduce((sum, value) => sum + value, 0);
                        return (
                          <button
                            key={`${band.label}-${key}`}
                            onClick={() => {
                              setSelectedDate(key);
                              setSelectedBand(band.label);
                            }}
                            className={`flex min-h-12 items-center justify-center rounded-lg px-1.5 py-2 text-center text-base font-black ring-1 ring-inset ring-blue-100/70 dark:ring-blue-900/30 ${weeklyHeatClass(tickets, maxWeeklySlot)}`}
                            aria-label={`${DAY_NAMES_FULL[index]}, ${day} ${INDONESIAN_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}, ${band.label}: ${formatNumber(tickets)} tiket`}
                          >
                            {formatNumber(tickets)}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex min-h-11 items-center px-1 text-xs font-black uppercase text-slate-700 dark:text-zinc-200">
                    Total
                  </div>
                  {weekDates.map((date, index) => {
                    const day = date.getDate();
                    const key = dateKey(
                      date.getFullYear(),
                      date.getMonth() + 1,
                      day,
                    );
                    const hours = byDate.get(key) ?? Array(24).fill(0);
                    const total = hours.reduce((sum, value) => sum + value, 0);
                    const isTopDay = summary.topDay[0] === key && total > 0;
                    return (
                      <button
                        key={`total-${key}`}
                        onClick={() => {
                          setSelectedDate(key);
                          setSelectedBand(null);
                        }}
                        className={`flex min-h-11 flex-col items-center justify-center rounded-lg px-1.5 py-1 text-base font-black ring-1 ring-inset ${
                          isTopDay
                            ? "bg-amber-50 text-amber-900 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800"
                            : "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/40"
                        }`}
                        aria-label={`Total ${DAY_NAMES_FULL[index]}, ${day} ${INDONESIAN_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}: ${formatNumber(total)} tiket`}
                      >
                        <span>{formatNumber(total)}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            isTopDay
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-blue-500 dark:text-blue-400"
                          }`}
                        >
                          {isTopDay ? "teramai" : "tiket"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <TicketDayModal
        date={selectedDate}
        hours={selectedHours}
        selectedBand={selectedBand}
        onClose={() => {
          setSelectedDate(null);
          setSelectedBand(null);
        }}
      />
    </section>
  );
}
