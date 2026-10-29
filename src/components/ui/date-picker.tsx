"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // Format: YYYY-MM-DD
  onChange?: (date: string) => void;
  minDate?: string; // Format: YYYY-MM-DD
  maxDate?: string; // Format: YYYY-MM-DD
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MONTH_NAMES = [
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
];

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function DatePicker({
  value = "",
  onChange,
  minDate,
  maxDate,
  placeholder = "Pilih tanggal...",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse initial view year and month
  const initialDate = value ? new Date(value) : new Date();
  const validInitial = !Number.isNaN(initialDate.getTime()) ? initialDate : new Date();

  const [viewYear, setViewYear] = React.useState(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(validInitial.getMonth());

  // Keep view aligned if value changes (React render state adjustment)
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Days matrix for the calendar
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 12 : viewMonth;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    days.push({
      day: d,
      dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const m = viewMonth + 1;
    days.push({
      day: d,
      dateStr: `${viewYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete grid (up to 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 1 : viewMonth + 2;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    days.push({
      day: d,
      dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      isCurrentMonth: false,
    });
  }

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${MONTH_NAMES[m]?.slice(0, 3)} ${y}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const isDateDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const handleSelectDate = (dateStr: string) => {
    if (isDateDisabled(dateStr)) return;
    onChange?.(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const todayStr = (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  })();
  const isTodayDisabled = isDateDisabled(todayStr);

  const handleToday = () => {
    if (!isTodayDisabled) {
      handleSelectDate(todayStr);
    }
  };

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 shadow-xs transition-colors hover:bg-zinc-50 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/80 dark:focus:ring-zinc-300",
            !value && "text-zinc-400 dark:text-zinc-500",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="ml-auto rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          sideOffset={4}
          align="start"
          className="z-50 w-64 rounded-xl border border-zinc-200 bg-white p-3 text-zinc-950 shadow-lg animate-in fade-in-80 zoom-in-95 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
            {DAY_LABELS.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {days.map((item, idx) => {
              const isSelected = item.dateStr === value;
              const isToday =
                item.dateStr ===
                new Date().toISOString().split("T")[0];
              const disabledDay = isDateDisabled(item.dateStr);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => !disabledDay && handleSelectDate(item.dateStr)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md font-medium transition-colors mx-auto",
                    disabledDay && "cursor-not-allowed bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",
                    !disabledDay && !item.isCurrentMonth && "text-zinc-300 dark:text-zinc-600",
                    !disabledDay && item.isCurrentMonth && "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    !disabledDay && isToday && !isSelected && "border border-blue-500 text-blue-600 font-bold",
                    !disabledDay && isSelected && "bg-blue-600 text-white font-bold hover:bg-blue-700 dark:bg-blue-600 dark:text-white",
                  )}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Bottom Shortcuts */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <button
              type="button"
              disabled={isTodayDisabled}
              onClick={handleToday}
              className={cn(
                "font-semibold",
                isTodayDisabled
                  ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed pointer-events-none"
                  : "text-blue-600 hover:underline dark:text-blue-400 cursor-pointer",
              )}
            >
              Hari Ini
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              >
                Hapus
              </button>
            )}
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
