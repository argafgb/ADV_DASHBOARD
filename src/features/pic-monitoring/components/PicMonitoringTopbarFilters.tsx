"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, ChevronDown, Check } from "lucide-react";
import { YEAR_OPTIONS } from "../utils/dashboard-config";
import {
  formatMonthSelection,
  isMonthFilterAvailable,
  maxMonthForYear,
  MONTH_FILTER_UNAVAILABLE_REASON,
  MONTH_OPTIONS,
  monthWindowOf,
  nextMonthSelection,
} from "../utils/period-filter";
import { useFilters } from "../context/FilterContext";
import { TopbarPortal } from "@/components/dashboard-panel/topbar-portal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DataToolbar } from "./DataToolbar";

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
          ? "pointer-events-none bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800/80 dark:text-zinc-500"
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
            <div className="cursor-not-allowed">{triggerButton}</div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={4}>
            <p className="text-xs">{tooltipText}</p>
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

export function PicMonitoringTopbarFilters() {
  const { year, setYear, month, setMonth, lastUpdated } = useFilters();
  const pathname = usePathname();

  const monthFilterAvailable = isMonthFilterAvailable(pathname);
  const selectedWindow = monthWindowOf(month);
  const maxMonth = maxMonthForYear(year);

  const handleMonthClick = (m: number) => {
    setMonth(nextMonthSelection(month, m));
  };

  const isSelected = (m: number) =>
    selectedWindow !== null &&
    m >= selectedWindow.startMonth &&
    m <= selectedWindow.endMonth;

  const isEdge = (m: number) =>
    selectedWindow !== null &&
    (m === selectedWindow.startMonth || m === selectedWindow.endMonth);

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
            ? "bg-blue-600 text-white"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800",
        )}
      >
        All Months
      </DropdownMenuItem>
      <div className="grid grid-cols-4 gap-1.5">
        {MONTH_OPTIONS.map((monthOption) => {
          const activeEdge = isEdge(monthOption.value);
          const activeSel = isSelected(monthOption.value);
          const disabled = monthOption.value > maxMonth;
          return (
            <DropdownMenuItem
              key={monthOption.value}
              disabled={disabled}
              aria-disabled={disabled}
              title={
                disabled
                  ? "Bulan mendatang belum tersedia"
                  : monthOption.shortLabel
              }
              onSelect={() => {
                handleMonthClick(monthOption.value);
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
              {monthOption.shortLabel}
            </DropdownMenuItem>
          );
        })}
      </div>
    </div>
  );

  return (
    <TopbarPortal>
      {pathname === "/dashboard/pic-monitoring" && <DataToolbar />}

      <div className="hidden max-w-37.5 shrink-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-zinc-400 dark:text-zinc-500 lg:flex xl:max-w-none">
        <Clock size={13} className="shrink-0" />
        <span className="flex min-w-0 flex-col xl:flex-row xl:items-center xl:gap-1">
          <span className="shrink-0">Terakhir diperbarui:</span>
          <span className="truncate text-zinc-500 dark:text-zinc-400">
            {lastUpdated}
          </span>
        </span>
      </div>

      <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto py-1">
        <FilterChip
          label="Tahun"
          value={year}
          opts={YEAR_OPTIONS as unknown as { v: string; t: string }[]}
          onChange={setYear}
        />

        <FilterChip
          label="Bulan"
          value={month}
          onChange={setMonth}
          displayValue={
            monthFilterAvailable
              ? formatMonthSelection(month)
              : "All Months"
          }
          customContent={monthPopoverContent}
          active={monthFilterAvailable && month !== "ALL"}
          disabled={!monthFilterAvailable}
          tooltipText={MONTH_FILTER_UNAVAILABLE_REASON}
        />
      </div>
    </TopbarPortal>
  );
}

export default PicMonitoringTopbarFilters;
