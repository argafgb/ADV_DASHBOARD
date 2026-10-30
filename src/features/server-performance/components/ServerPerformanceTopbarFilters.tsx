"use client";

import { useState } from "react";
import { YEAR_OPTIONS } from "@/lib/dashboard-config";
import { useServerPerformanceFilters } from "../context/ServerPerformanceFilterContext";
import {
  isMonthSelectable,
  nextMonthSelection,
  normalizeMonthRange,
  MONTHS,
  FULL_MONTH_NAMES,
} from "../utils/month-filter";
import { Clock, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { TopbarPortal } from "@/components/dashboard-panel/topbar-portal";

interface FilterChipProps {
  label: string;
  value: string;
  opts?: { v: string; t: string }[];
  onChange: (value: string) => void;
  active?: boolean;
  disabled?: boolean;
  tooltipText?: string;
  customContent?: React.ReactNode | ((close: () => void) => React.ReactNode);
  displayValue?: string;
}

function FilterChip({
  label,
  value,
  opts = [],
  onChange,
  active = false,
  disabled = false,
  tooltipText,
  customContent,
  displayValue,
}: FilterChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = opts.find((o) => o.v === value) || opts[0];
  const renderedValue = displayValue || (selectedOpt ? selectedOpt.t : value);

  const triggerButton = (
    <button
      disabled={disabled}
      type="button"
      aria-label={`${label}: ${renderedValue}`}
      className={cn(
        "flex h-8 min-w-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all",
        disabled
          ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800/40 dark:border-zinc-800/80 dark:text-zinc-500"
          : active
            ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/55 dark:text-blue-400 cursor-pointer"
            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80 cursor-pointer",
      )}
    >
      <span className="hidden shrink-0 text-zinc-400 dark:text-zinc-500 font-normal sm:inline">
        {label}:
      </span>
      <span className="min-w-0 truncate">{renderedValue}</span>
      <ChevronDown size={12} className="shrink-0 text-zinc-400" />
    </button>
  );

  const wrappedTrigger =
    disabled && tooltipText ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{triggerButton}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      triggerButton
    );

  if (disabled) {
    return wrappedTrigger;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{wrappedTrigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        sideOffset={4}
        align="end"
        className="z-50 min-w-36 rounded-lg p-1"
      >
        {customContent ? (
          typeof customContent === "function" ? (
            customContent(() => setIsOpen(false))
          ) : (
            customContent
          )
        ) : (
          <div className="w-44 space-y-0.5">
            {opts.map((opt) => {
              const isSelected = opt.v === value;
              return (
                <DropdownMenuItem
                  key={opt.v}
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => {
                    onChange(opt.v);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer",
                    isSelected
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  )}
                >
                  <span className="truncate">{opt.t}</span>
                  {isSelected && (
                    <Check
                      size={13}
                      className="shrink-0 text-blue-600 dark:text-blue-400"
                    />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const MONTHS_GRID = [
  { v: 1, t: "Jan" },
  { v: 2, t: "Feb" },
  { v: 3, t: "Mar" },
  { v: 4, t: "Apr" },
  { v: 5, t: "Mei" },
  { v: 6, t: "Jun" },
  { v: 7, t: "Jul" },
  { v: 8, t: "Ags" },
  { v: 9, t: "Sep" },
  { v: 10, t: "Okt" },
  { v: 11, t: "Nov" },
  { v: 12, t: "Des" },
];

function getMonthLabel(value: string) {
  if (value === "ALL") return "All Months";
  const parts = value.split("-");
  if (parts.length === 2) {
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (start === end) return FULL_MONTH_NAMES[start - 1] || value;
    return `${FULL_MONTH_NAMES[start - 1] || start} - ${FULL_MONTH_NAMES[end - 1] || end}`;
  }
  const single = parseInt(value, 10);
  return FULL_MONTH_NAMES[single - 1] || value;
}

export function ServerPerformanceTopbarFilters() {
  const { year, setYear, month, setMonth, lastUpdated } =
    useServerPerformanceFilters();

  const monthRange = normalizeMonthRange(month, Number(year));
  const { start, end } = monthRange;

  const handleMonthClick = (selected: number) => {
    setMonth(nextMonthSelection(monthRange, selected));
  };

  const isSelected = (m: number) => {
    if (month === "ALL") return false;
    if (start === null) return false;
    if (end === null) return m === start;
    return m >= start && m <= end;
  };

  const isEdge = (m: number) => {
    if (month === "ALL") return false;
    if (start === null) return false;
    if (end === null) return m === start;
    return m === start || m === end;
  };

  const monthPopoverContent = (close: () => void) => (
    <div className="w-64 p-2">
      <DropdownMenuItem
        onSelect={() => {
          setMonth("ALL");
          close();
        }}
        className={cn(
          "mb-2 flex h-7 w-full cursor-pointer items-center justify-center rounded-md border py-1 text-center text-xs font-semibold transition-all",
          month === "ALL"
            ? "bg-blue-600 text-white border-blue-600"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800",
        )}
      >
        All Months
      </DropdownMenuItem>
      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS_GRID.map((m) => {
          const disabled = !isMonthSelectable(Number(year), m.v);
          const activeEdge = isEdge(m.v);
          const activeSel = isSelected(m.v);
          return (
            <DropdownMenuItem
              key={m.v}
              disabled={disabled}
              aria-disabled={disabled}
              title={disabled ? "Bulan mendatang belum tersedia" : m.t}
              onSelect={() => {
                handleMonthClick(m.v);
              }}
              className={cn(
                "flex h-8 items-center justify-center rounded-md p-0 text-center text-xs font-medium transition-all",
                disabled
                  ? "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700"
                  : activeEdge
                    ? "cursor-pointer bg-blue-600 text-white font-bold"
                    : activeSel
                      ? "cursor-pointer bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : "cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              {m.t}
            </DropdownMenuItem>
          );
        })}
      </div>
    </div>
  );

  return (
    <TopbarPortal>
      <div className="hidden max-w-37.5 shrink-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-zinc-400 dark:text-zinc-500 lg:flex xl:max-w-none">
        <Clock size={13} className="shrink-0" />
        <span className="flex min-w-0 flex-col xl:flex-row xl:items-center xl:gap-1">
          <span className="shrink-0">Terakhir diperbarui:</span>
          <span className="truncate text-zinc-500 dark:text-zinc-400">
            {lastUpdated}
          </span>
        </span>
      </div>

      <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto overflow-y-visible py-1">
        <FilterChip
          label="Tahun"
          value={year}
          opts={YEAR_OPTIONS.map((o) => ({ v: o.v, t: o.t }))}
          onChange={setYear}
        />

        <FilterChip
          label="Bulan"
          value={month}
          onChange={setMonth}
          displayValue={getMonthLabel(month)}
          customContent={(close) => monthPopoverContent(close)}
          active={month !== "ALL"}
        />
      </div>
    </TopbarPortal>
  );
}
