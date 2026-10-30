"use client";

import React, { useState } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";
import { TopbarPortal } from "@/components/dashboard-panel/topbar-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useKaldevFilters } from "../context/KaldevFilterContext";
import {
  getMaxSelectableMonth,
  nextMonthFilter,
  parseMonthRange,
  getMonthFilterLabel,
  SHORT_MONTH_NAMES,
} from "../utils/month-filter";
import { SyncButton } from "./overview/sync-button";

interface FilterChipProps {
  label: string;
  value: string;
  opts?: { v: string; t: string }[];
  onChange: (value: string) => void;
  active?: boolean;
  customContent?: (close: () => void) => React.ReactNode;
  displayValue?: string;
}

function FilterChip({
  label,
  value,
  opts = [],
  onChange,
  active = false,
  customContent,
  displayValue,
}: FilterChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = opts.find((o) => o.v === value) || opts[0];
  const renderedValue = displayValue || (selectedOpt ? selectedOpt.t : value);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${renderedValue}`}
          className={cn(
            "flex h-8 min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
            active
              ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/55 dark:text-blue-400"
              : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
          )}
        >
          <span className="hidden shrink-0 text-zinc-400 dark:text-zinc-500 font-normal sm:inline">
            {label}:
          </span>
          <span className="max-w-28 truncate sm:max-w-none">{renderedValue}</span>
          <ChevronDown size={12} className="shrink-0 text-zinc-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        sideOffset={4}
        align="start"
        className="z-50 min-w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md ring-1 ring-black/5 dark:ring-white/10 duration-150 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-1.5"
      >
        {customContent ? (
          customContent(() => setIsOpen(false))
        ) : (
          <div className="w-44 max-h-64 overflow-y-auto space-y-0.5">
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
                    "w-full flex items-center justify-between rounded-md py-1.5 pl-2.5 pr-8 text-xs font-medium cursor-pointer transition-colors text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                    isSelected &&
                      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold",
                  )}
                >
                  <span className="truncate">{opt.t}</span>
                  {isSelected && (
                    <Check size={13} className="shrink-0 text-blue-600 dark:text-blue-400" />
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

const MONTHS_GRID = SHORT_MONTH_NAMES.map((t, idx) => ({
  v: idx + 1,
  t,
}));

export function KaldevTopbarFilters() {
  const { year, setYear, yearOptions, month, setMonth, from, setFrom, lastUpdated } =
    useKaldevFilters();

  const { start, end } = parseMonthRange(month);
  const maxSelectableMonth = getMaxSelectableMonth(year);

  const handleMonthClick = (m: number, close: () => void) => {
    setMonth(nextMonthFilter(month, m));
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
            ? "bg-blue-600 text-white"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800",
        )}
      >
        All Months
      </DropdownMenuItem>
      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS_GRID.map((m) => {
          const disabled = m.v > maxSelectableMonth;
          const activeEdge = isEdge(m.v);
          const activeSel = isSelected(m.v);
          return (
            <button
              key={m.v}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              title={disabled ? "Bulan mendatang belum tersedia" : m.t}
              onClick={() => handleMonthClick(m.v, close)}
              className={cn(
                "flex h-8 items-center justify-center rounded-md p-0 text-center text-xs font-medium transition-all cursor-pointer",
                disabled &&
                  "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700",
                !disabled &&
                  (activeEdge
                    ? "bg-blue-600 text-white font-bold"
                    : activeSel
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"),
              )}
            >
              {m.t}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <TopbarPortal>
      <div className="shrink-0">
        <SyncButton />
      </div>

      <div className="hidden max-w-37.5 shrink-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-zinc-400 dark:text-zinc-500 lg:flex xl:max-w-none">
        <Clock size={13} className="shrink-0" />
        <span className="flex min-w-0 flex-col xl:flex-row xl:items-center xl:gap-1">
          <span className="shrink-0">Terakhir diperbarui:</span>
          <span className="truncate text-zinc-500 dark:text-zinc-400">{lastUpdated}</span>
        </span>
      </div>

      <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto overflow-y-visible py-1">
        <FilterChip
          label="Project dari"
          value={from}
          opts={[
            { v: "Semua", t: "Semua" },
            { v: "Bizdev", t: "Bizdev" },
            { v: "PIC", t: "PIC" },
          ]}
          onChange={(v) => setFrom(v as "Semua" | "Bizdev" | "PIC")}
          active={from !== "Semua"}
        />

        <FilterChip
          label="Tahun"
          value={year}
          opts={yearOptions.map((y) => ({ v: y, t: y }))}
          onChange={setYear}
        />

        <FilterChip
          label="Bulan"
          value={month}
          onChange={setMonth}
          displayValue={getMonthFilterLabel(month)}
          customContent={(close) => monthPopoverContent(close)}
          active={month !== "ALL"}
        />
      </div>
    </TopbarPortal>
  );
}
