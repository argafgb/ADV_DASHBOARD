"use client";

import { useState } from "react";
import { Check, ChevronDown, Clock } from "lucide-react";
import { TopbarPortal } from "@/components/dashboard-panel/topbar-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useItRepairFilters } from "../context/ItRepairFilterContext";
import {
  getMaxSelectableMonth,
  getNextMonthFilter,
  parseMonthFilter,
} from "@/lib/month-filter";
import { MONTHS_SHORT } from "../utils/format";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  value: string;
  opts?: { v: string; t: string }[];
  onChange: (value: string) => void;
  active?: boolean;
  disabled?: boolean;
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
  customContent,
  displayValue,
}: FilterChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = opts.find((option) => option.v === value) || opts[0];
  const renderedValue = displayValue || (selectedOpt ? selectedOpt.t : value);

  if (disabled) {
    return (
      <button
        disabled
        type="button"
        aria-label={`${label}: ${renderedValue}`}
        className="flex h-8 min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg border text-xs font-semibold bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800/40 dark:border-zinc-800/80 dark:text-zinc-500"
      >
        <span className="hidden shrink-0 text-zinc-400 dark:text-zinc-500 font-normal sm:inline">
          {label}:
        </span>
        <span className="max-w-24 truncate sm:max-w-none">{renderedValue}</span>
      </button>
    );
  }

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
          <span className="max-w-24 truncate sm:max-w-none">{renderedValue}</span>
          <ChevronDown size={12} className="shrink-0 text-zinc-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        sideOffset={4}
        align="start"
        className="z-50 min-w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md ring-1 ring-black/5 dark:ring-white/10"
      >
        {customContent ? (
          customContent(() => setIsOpen(false))
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-0.5">
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

export function ItRepairTopbarFilters() {
  const {
    year,
    setYear,
    yearOptions,
    month,
    setMonth,
    location,
    setLocation,
    locationOptions,
    ownership,
    setOwnership,
    ownershipOptions,
    lastUpdated,
  } = useItRepairFilters();

  const { start, end } = parseMonthFilter(month);
  const isAllMonths = month === "ALL" || start === null;
  const monthDisplayLabel = isAllMonths
    ? "All Months"
    : start === end
      ? MONTHS_SHORT[(start ?? 1) - 1]
      : `${MONTHS_SHORT[(start ?? 1) - 1]} - ${MONTHS_SHORT[(end ?? 1) - 1]}`;

  const maxMonth = getMaxSelectableMonth(year);

  const handleMonthClick = (mNum: number) => {
    const nextVal = getNextMonthFilter(month, mNum);
    setMonth(nextVal);
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
          "mb-2 h-7 w-full cursor-pointer rounded-md border py-1 text-center text-xs font-semibold transition-all",
          isAllMonths
            ? "bg-blue-600 text-white border-blue-600"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800",
        )}
      >
        All Months
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS_SHORT.map((name, idx) => {
          const mNum = idx + 1;
          const disabled = maxMonth > 0 && mNum > maxMonth;
          const isSelected =
            !isAllMonths &&
            start !== null &&
            end !== null &&
            mNum >= start &&
            mNum <= end;
          const isEdge =
            !isAllMonths && (mNum === start || mNum === end);

          return (
            <button
              key={name}
              type="button"
              disabled={disabled}
              onClick={() => handleMonthClick(mNum)}
              className={cn(
                "flex h-8 items-center justify-center rounded-md p-0 text-center text-xs font-medium transition-all",
                disabled
                  ? "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700"
                  : isEdge
                    ? "bg-blue-600 text-white font-bold cursor-pointer"
                    : isSelected
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 cursor-pointer"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );

  const yearOpts = yearOptions.map((y) => ({ v: y, t: y }));
  const locationOpts = [
    { v: "Semua", t: "Semua" },
    ...locationOptions.map((loc) => ({ v: loc, t: loc })),
  ];
  const ownershipOpts = [
    { v: "Semua", t: "Semua" },
    ...ownershipOptions.map((own) => ({ v: own, t: own })),
  ];

  return (
    <TopbarPortal>
      {lastUpdated && (
        <div className="hidden max-w-37.5 shrink-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-zinc-400 dark:text-zinc-500 lg:flex xl:max-w-none">
          <Clock size={13} className="shrink-0" />
          <span className="flex min-w-0 flex-col xl:flex-row xl:items-center xl:gap-1">
            <span className="shrink-0">Terakhir diperbarui:</span>
            <span className="truncate text-zinc-500 dark:text-zinc-400">
              {lastUpdated}
            </span>
          </span>
        </div>
      )}

      <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto overflow-y-visible py-1">
        <FilterChip
          label="Tahun"
          value={year}
          opts={yearOpts}
          onChange={setYear}
        />

        <FilterChip
          label="Bulan"
          value={month}
          displayValue={monthDisplayLabel}
          onChange={setMonth}
          customContent={monthPopoverContent}
          active={!isAllMonths}
        />

        <FilterChip
          label="Location"
          value={location}
          opts={locationOpts}
          onChange={setLocation}
          active={location !== "Semua"}
        />

        <FilterChip
          label="Ownership"
          value={ownership}
          opts={ownershipOpts}
          onChange={setOwnership}
          active={ownership !== "Semua"}
        />
      </div>
    </TopbarPortal>
  );
}
