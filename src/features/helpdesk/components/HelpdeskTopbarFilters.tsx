"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { YEAR_OPTIONS } from "@/lib/dashboard-config";
import {
  useHelpdeskFilters,
  type DeptKey,
} from "@/context/HelpdeskFilterContext";
import {
  getMaxSelectableMonth,
  getMonthFilterLabel,
  nextMonthFilter,
  parseMonthRange,
} from "@/lib/helpdesk/month-filter";
import { isDepartmentFilterApplicable } from "@/lib/helpdesk/dashboard-navigation";
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
      className={`flex h-8 min-w-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
        disabled
          ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800/40 dark:border-zinc-800/80 dark:text-zinc-500"
          : active
            ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/55 dark:text-blue-400 cursor-pointer"
            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80 cursor-pointer"
      }`}
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

const DEPT_OPTIONS = [
  { v: "ALL", t: "All Departments" },
  { v: "IT Support", t: "IT Support" },
  { v: "DCT Support", t: "DCT Support" },
];

export function HelpdeskTopbarFilters() {
  const {
    year,
    setYear,
    month,
    setMonth,
    dept,
    setDept,
    lastUpdated,
  } = useHelpdeskFilters();

  const pathname = usePathname();
  const departmentFilterApplicable = isDepartmentFilterApplicable(pathname);
  const isLeaderboard =
    pathname === "/dashboard/helpdesk/leaderboard" ||
    pathname === "/dashboard/leaderboard";

  const maxSelectable = getMaxSelectableMonth(year, new Date());
  const { start, end } = parseMonthRange(month);

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
    <div className="w-64 p-1.5">
      <button
        type="button"
        aria-current={month === "ALL" ? "true" : undefined}
        onClick={() => {
          setMonth("ALL");
          close();
        }}
        className={cn(
          "mb-2 h-7.5 w-full cursor-pointer rounded-md border py-1 text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
          month === "ALL"
            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50",
        )}
      >
        <span>All Months</span>
        {month === "ALL" && <Check size={13} />}
      </button>

      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS_GRID.map((m) => {
          const disabled = m.v > maxSelectable;
          const activeEdge = isEdge(m.v);
          const activeSel = isSelected(m.v);
          return (
            <button
              key={m.v}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              aria-current={activeEdge ? "true" : undefined}
              title={disabled ? "Bulan mendatang belum tersedia" : m.t}
              onClick={() => {
                if (isLeaderboard) {
                  setMonth(String(m.v));
                  close();
                } else {
                  const next = nextMonthFilter(month, m.v);
                  setMonth(next);
                  if (next.includes("-")) {
                    close();
                  }
                }
              }}
              className={cn(
                "h-8 rounded-md text-xs font-medium transition-all flex items-center justify-center",
                disabled
                  ? "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700"
                  : activeEdge
                    ? "cursor-pointer bg-blue-600 text-white font-bold shadow-xs"
                    : activeSel
                      ? "cursor-pointer bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
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
          opts={YEAR_OPTIONS}
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

        <FilterChip
          label="Dept"
          value={dept}
          opts={DEPT_OPTIONS}
          onChange={(v) => setDept(v as DeptKey)}
          displayValue={
            DEPT_OPTIONS.find((o) => o.v === dept)?.t || dept
          }
          active={dept !== "ALL"}
          disabled={!departmentFilterApplicable}
          tooltipText={
            !departmentFilterApplicable
              ? "Halaman ini menampilkan gabungan semua departemen"
              : undefined
          }
        />
      </div>
    </TopbarPortal>
  );
}
