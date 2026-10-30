"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { TopbarPortal } from "@/components/dashboard-panel/topbar-portal";
import { useLearningGrowth } from "../context/LearningGrowthFilterContext";
import { monthFilterAvailability, yearFilterAvailability } from "../utils/filter-availability";
import {
  formatMonthFilter,
  getNextMonthFilter,
  isMonthSelectable,
  MONTH_OPTIONS,
  parseNormalizedMonth,
} from "../utils/month-filter";
import { YEAR_OPTIONS } from "../utils/year-filter";
import { formatSyncTimestamp, cn } from "@/lib/utils";
import type { YearFilter } from "../types/dashboard.types";
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

interface FilterChipProps {
  label: string;
  value: string;
  opts?: { v: string; t: string }[];
  onChange: (value: string) => void;
  active?: boolean;
  disabled?: boolean;
  tooltipText?: string;
  customContent?: (close: () => void) => React.ReactNode;
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
          <TooltipContent side="bottom" sideOffset={4}>
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
          customContent(() => setIsOpen(false))
        ) : (
          <div className="w-44 space-y-0.5">
            {opts.map((opt) => {
              const isSelected = opt.v === value;
              return (
                <DropdownMenuItem
                  key={opt.v}
                  onClick={() => {
                    onChange(opt.v);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center px-2.5 py-1.5 text-xs rounded-md cursor-pointer",
                    isSelected
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                  )}
                >
                  {opt.t}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LearningGrowthTopbarFilters() {
  const { year, setYear, month, setMonth, updatedAt } = useLearningGrowth();
  const pathname = usePathname();

  const yearAvailability = yearFilterAvailability(pathname);
  const monthAvailability = monthFilterAvailability(pathname);

  const { start, end } = parseNormalizedMonth(month);

  const handleMonthClick = (m: number, close: () => void) => {
    setMonth(getNextMonthFilter(month, m));
    close();
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
      <button
        type="button"
        onClick={() => {
          setMonth("ALL");
          close();
        }}
        className={cn(
          "mb-2 flex h-7 w-full cursor-pointer items-center justify-center rounded-md border text-xs font-semibold transition-all",
          month === "ALL"
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800",
        )}
      >
        All Months
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {MONTH_OPTIONS.map((m) => {
          const activeEdge = isEdge(m.value);
          const activeSel = isSelected(m.value);
          const disabled = !isMonthSelectable(m.value, year);
          return (
            <button
              key={m.value}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              title={disabled ? "Bulan mendatang belum tersedia" : undefined}
              onClick={() => handleMonthClick(m.value, close)}
              className={cn(
                "flex h-8 items-center justify-center rounded-md p-0 text-xs font-medium transition-all",
                disabled
                  ? "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700"
                  : activeEdge
                    ? "cursor-pointer bg-blue-600 text-white font-bold"
                    : activeSel
                      ? "cursor-pointer bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : "cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              {m.label}
            </button>
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
            {formatSyncTimestamp(updatedAt)}
          </span>
        </span>
      </div>

      <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto overflow-y-visible py-1">
        <FilterChip
          label="Tahun"
          value={year}
          opts={YEAR_OPTIONS}
          onChange={(next) => setYear(next as YearFilter)}
          displayValue={yearAvailability.available ? undefined : "All Years"}
          disabled={!yearAvailability.available}
          tooltipText={yearAvailability.reason}
        />

        <FilterChip
          label="Bulan"
          value={month}
          onChange={setMonth}
          displayValue={monthAvailability.available ? formatMonthFilter(month) : "All Months"}
          customContent={monthPopoverContent}
          active={monthAvailability.available && month !== "ALL"}
          disabled={!monthAvailability.available}
          tooltipText={monthAvailability.reason}
        />
      </div>
    </TopbarPortal>
  );
}

export default LearningGrowthTopbarFilters;
