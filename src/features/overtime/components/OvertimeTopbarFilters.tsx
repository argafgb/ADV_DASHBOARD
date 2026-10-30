"use client";

import { useState } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";
import { TopbarPortal } from "@/components/dashboard-panel/topbar-portal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useFilters, ALL_UNITS, type DeptKey } from "../context/FilterContext";
import { toYearOptions } from "../utils/constants";
import {
  getMaxSelectableMonth,
  nextMonthFilter,
  parseMonthRange,
  getMonthFilterLabel,
  SHORT_MONTH_NAMES,
} from "../utils/month-filter";
import { cn } from "@/lib/utils";

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
  const isStatic = !customContent && opts.length <= 1;

  const triggerButton = (
    <button
      type="button"
      disabled={disabled || isStatic}
      aria-label={`${label}: ${renderedValue}`}
      className={cn(
        "flex h-8 min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all",
        disabled
          ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800/40 dark:border-zinc-800/80 dark:text-zinc-500"
          : isStatic
            ? "bg-white border-zinc-200 text-zinc-700 cursor-default dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
            : active
              ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/55 dark:text-blue-400 cursor-pointer"
              : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80 cursor-pointer",
      )}
    >
      <span className="hidden shrink-0 text-zinc-400 dark:text-zinc-500 font-normal sm:inline">
        {label}:
      </span>
      <span className="max-w-28 truncate sm:max-w-none">{renderedValue}</span>
      {!isStatic && (
        <ChevronDown size={12} className="shrink-0 text-zinc-400" />
      )}
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

  if (disabled || isStatic) {
    return wrappedTrigger;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{wrappedTrigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        sideOffset={4}
        align="start"
        className="z-50 min-w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md ring-1 ring-black/5 dark:ring-white/10 duration-150 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-1.5"
      >
        {customContent ? (
          customContent(() => setIsOpen(false))
        ) : (
          <div className="w-44 max-h-64 overflow-y-auto">
            {opts.map((opt) => (
              <DropdownMenuItem
                key={opt.v}
                onClick={() => {
                  onChange(opt.v);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-md py-1.5 pl-2.5 pr-2.5 text-xs font-medium cursor-pointer transition-colors",
                  opt.v === value
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                )}
              >
                <span className="truncate">{opt.t}</span>
                {opt.v === value && (
                  <Check size={14} className="ml-2 shrink-0 text-blue-600 dark:text-blue-400" />
                )}
              </DropdownMenuItem>
            ))}
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

export function OvertimeTopbarFilters() {
  const {
    dept,
    setDept,
    year,
    setYear,
    yearOptions,
    month,
    setMonth,
    level1,
    setLevel1,
    level1Options,
    level1Label,
    level2,
    setLevel2,
    level2Options,
    level2Label,
    orgUnitFilterApplicable,
    departmentFilterApplicable,
    lastUpdated,
  } = useFilters();

  const level1Disabled = level1Options.length === 0;
  const level2Disabled = level2Options.length === 0;

  const unitTooltip = (hasOptions: boolean, unitName: string) =>
    hasOptions
      ? undefined
      : `Tidak ada ${unitName} dengan lembur di periode ini`;

  const withAllOption = (
    opts: { v: string; t: string }[],
    allLabel: string,
  ) => [{ v: ALL_UNITS, t: allLabel }, ...opts];

  const { start, end } = parseMonthRange(month);
  const maxSelectableMonth = getMaxSelectableMonth(year);

  const handleMonthClick = (m: number, close: () => void) => {
    const next = nextMonthFilter(month, m);
    setMonth(next);
    // If range selection complete or single month clicked again, keep open or close
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
              type="button"
              key={m.v}
              disabled={disabled}
              title={disabled ? "Bulan mendatang belum tersedia" : m.t}
              onClick={() => handleMonthClick(m.v, close)}
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
            {lastUpdated}
          </span>
        </span>
      </div>

      <div className="no-scrollbar flex min-w-0 max-w-full items-center gap-1.5 overflow-x-auto overflow-y-visible py-1">
        <FilterChip
          label="Tahun"
          value={year}
          opts={toYearOptions(yearOptions)}
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

        {departmentFilterApplicable && (
          <FilterChip
            label="Area"
            value={dept}
            opts={[
              { v: "ALL", t: "All Areas" },
              { v: "OPS", t: "OPS" },
              { v: "HO", t: "HO" },
            ]}
            onChange={(v) => setDept(v as DeptKey)}
            active={dept !== "ALL"}
          />
        )}

        {orgUnitFilterApplicable && (
          <>
            <FilterChip
              label={level1Label}
              value={level1 ?? ALL_UNITS}
              opts={withAllOption(level1Options, `Semua ${level1Label}`)}
              onChange={(v) => setLevel1(v === ALL_UNITS ? null : v)}
              active={level1 !== null}
              disabled={level1Disabled}
              tooltipText={unitTooltip(level1Options.length > 0, level1Label)}
            />

            <FilterChip
              label={level2Label}
              value={level2 ?? ALL_UNITS}
              opts={withAllOption(level2Options, `Semua ${level2Label}`)}
              onChange={(v) => setLevel2(v === ALL_UNITS ? null : v)}
              active={level2 !== null}
              disabled={level2Disabled}
              tooltipText={unitTooltip(level2Options.length > 0, level2Label)}
            />
          </>
        )}
      </div>
    </TopbarPortal>
  );
}
