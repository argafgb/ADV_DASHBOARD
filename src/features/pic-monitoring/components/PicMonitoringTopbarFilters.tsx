"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, ChevronDown, Check, Calendar } from "lucide-react";
import { YEAR_OPTIONS } from "../utils/dashboard-config";
import {
  formatMonthSelection,
  isMonthFilterAvailable,
  maxMonthForYear,
  MONTH_FILTER_UNAVAILABLE_REASON,
  MONTH_OPTIONS,
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
        "flex h-8.5 min-w-0 items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-lg border text-xs transition-all",
        disabled
          ? "pointer-events-none bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800/80 dark:text-zinc-500"
          : isOpen
            ? "bg-white border-blue-600 text-blue-600 dark:bg-zinc-900 dark:border-blue-500 dark:text-blue-400 cursor-pointer shadow-sm ring-1 ring-blue-600/20"
            : active
              ? "bg-white border-blue-600 text-blue-600 dark:bg-zinc-900 dark:border-blue-500 dark:text-blue-400 cursor-pointer shadow-sm"
              : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80 cursor-pointer",
      )}
    >
      <Calendar
        size={13}
        className={cn(
          "shrink-0",
          isOpen || active
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-400 dark:text-zinc-500",
        )}
      />
      <span
        className={cn(
          "shrink-0 font-normal hidden xl:inline",
          isOpen || active
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-500 dark:text-zinc-400",
        )}
      >
        {label}:
      </span>
      <span
        className={cn(
          "font-semibold min-w-0 truncate",
          isOpen || active
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-800 dark:text-zinc-200",
        )}
      >
        {renderedValue}
      </span>
      <ChevronDown
        size={12}
        className={cn(
          "shrink-0 transition-transform duration-200",
          isOpen && "rotate-180",
          isOpen || active
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-400",
        )}
      />
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
        sideOffset={6}
        align="end"
        className={cn(
          "z-50 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 shadow-xl shadow-zinc-900/10 rounded-2xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2",
          customContent ? "w-[240px] p-3" : "w-40 p-1.5",
        )}
      >
        {customContent ? (
          customContent(() => setIsOpen(false))
        ) : (
          <div className="space-y-1">
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
                    "w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors",
                    isSelected
                      ? "bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold focus:bg-blue-50/80 focus:text-blue-600"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 focus:bg-zinc-100 dark:focus:bg-zinc-800/80 font-normal",
                  )}
                >
                  <span className="truncate">{opt.t}</span>
                  {isSelected && (
                    <Check
                      size={14}
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
  const maxMonth = maxMonthForYear(year);

  const monthPopoverContent = (close: () => void) => (
    <div>
      <DropdownMenuItem
        onSelect={() => {
          setMonth("ALL");
          close();
        }}
        className={cn(
          "w-full h-8 flex items-center justify-center rounded-xl text-xs font-medium transition-colors mb-2.5 cursor-pointer",
          month === "ALL"
            ? "bg-blue-600 text-white font-semibold focus:bg-blue-600 focus:text-white shadow-sm"
            : "bg-zinc-100/90 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/80 focus:bg-zinc-200/70",
        )}
      >
        Semua bulan
      </DropdownMenuItem>

      <div className="grid grid-cols-4 gap-1.5">
        {MONTH_OPTIONS.map((monthOption) => {
          const isMonthActive = month === String(monthOption.value);
          const disabled = monthOption.value > maxMonth;

          return (
            <DropdownMenuItem
              key={monthOption.value}
              disabled={disabled}
              onSelect={(e) => {
                if (disabled) {
                  e.preventDefault();
                  return;
                }
                setMonth(String(monthOption.value));
                close();
              }}
              className={cn(
                "h-8 rounded-xl flex items-center justify-center text-xs transition-colors",
                disabled
                  ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-40 focus:bg-transparent"
                  : isMonthActive
                    ? "bg-blue-600 text-white font-semibold focus:bg-blue-600 focus:text-white shadow-sm"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 focus:bg-zinc-100 dark:focus:bg-zinc-800/80 cursor-pointer font-normal",
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

      {lastUpdated && (
        <div className="hidden shrink-0 items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 md:flex">
          <Clock size={13} className="shrink-0 text-zinc-400" />
          <span className="flex items-center gap-1">
            <span className="shrink-0">Terakhir diperbarui:</span>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {lastUpdated}
            </span>
          </span>
        </div>
      )}

      <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-2 overflow-x-auto py-1">
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
            monthFilterAvailable ? formatMonthSelection(month) : "Semua"
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
