"use client";

import { useState } from "react";
import { YEAR_OPTIONS } from "@/lib/dashboard-config";
import { useBugTrackerFilters } from "../context/BugTrackerFilterContext";
import type { FilterOption } from "../types/filter.types";
import { Clock, ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  getMaxSelectableMonth,
  getNextMonthFilter,
  parseMonthFilter,
} from "@/lib/month-filter";
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
        align="start"
        className="z-50 min-w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md ring-1 ring-black/5 dark:ring-white/10"
      >
        {customContent ? (
          typeof customContent === "function" ? (
            customContent(() => setIsOpen(false))
          ) : (
            customContent
          )
        ) : (
          <div className="w-44 max-h-60 overflow-y-auto">
            {opts.map((opt) => (
              <DropdownMenuItem
                key={opt.v}
                onClick={() => {
                  onChange(opt.v);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between rounded-md py-1.5 pl-2.5 pr-2 text-xs font-medium cursor-pointer transition-colors",
                  opt.v === value
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                )}
              >
                <span>{opt.t}</span>
                {opt.v === value && <Check size={12} className="shrink-0 text-blue-600 dark:text-blue-400" />}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchablePopoverContent({
  options,
  currentValue,
  onSelect,
  placeholder = "Cari...",
}: {
  options: FilterOption[];
  currentValue: string;
  onSelect: (val: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase().trim()),
  );

  return (
    <div className="w-56 p-1">
      <div className="relative mb-2 px-1 pt-1">
        <Search
          size={13}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 pl-8 pr-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-all text-left truncate cursor-pointer",
                opt.value === currentValue
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === currentValue && <Check size={12} className="shrink-0 text-blue-600 dark:text-blue-400 ml-1" />}
            </button>
          ))
        ) : (
          <div className="px-2.5 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Tidak ditemukan
          </div>
        )}
      </div>
    </div>
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
  const monthNames = [
    "",
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
  if (parts.length === 2) {
    const start = parseInt(parts[0]);
    const end = parseInt(parts[1]);
    if (start === end) return monthNames[start];
    return `${monthNames[start]} - ${monthNames[end]}`;
  }
  const single = parseInt(value);
  return monthNames[single] || value;
}

export function BugTrackerTopbarFilters() {
  const {
    year,
    setYear,
    month,
    setMonth,
    project,
    setProject,
    projectOptions,
    role,
    setRole,
    roleOptions,
    lastUpdated,
  } = useBugTrackerFilters();

  const { start, end } = parseMonthFilter(month);
  const maxSelectableMonth = getMaxSelectableMonth(year);

  const handleMonthClick = (m: number) =>
    setMonth(getNextMonthFilter(month, m));

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

  const monthPopoverContent = (close?: () => void) => (
    <div className="w-64 p-2">
      <button
        type="button"
        onClick={() => {
          setMonth("ALL");
          if (close) close();
        }}
        className={cn(
          "mb-2 h-7 w-full cursor-pointer rounded-md border py-1 text-xs font-semibold transition-all",
          month === "ALL"
            ? "bg-blue-600 text-white"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800",
        )}
      >
        All Months
      </button>
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
              onClick={() => {
                handleMonthClick(m.v);
                if (close) close();
              }}
              className={cn(
                "h-8 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center justify-center",
                disabled
                  ? "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700"
                  : activeEdge
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : activeSel
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
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
      {/* Last Updated info */}
      <div className="hidden max-w-37.5 shrink-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-zinc-400 dark:text-zinc-500 lg:flex xl:max-w-none">
        <Clock size={13} className="shrink-0" />
        <span className="flex min-w-0 flex-col xl:flex-row xl:items-center xl:gap-1">
          <span className="shrink-0">Terakhir diperbarui:</span>
          <span className="truncate text-zinc-500 dark:text-zinc-400">
            {lastUpdated}
          </span>
        </span>
      </div>

      {/* Global Filters */}
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
          displayValue={getMonthLabel(month)}
          customContent={(close) => monthPopoverContent(close)}
          active={month !== "ALL"}
        />

        <FilterChip
          label="Project"
          value={project}
          opts={projectOptions.map((p) => ({ v: p.value, t: p.label }))}
          onChange={setProject}
          displayValue={
            projectOptions.find((o) => o.value === project)?.label || project
          }
          customContent={(close) => (
            <SearchablePopoverContent
              options={projectOptions}
              currentValue={project}
              placeholder="Cari project..."
              onSelect={(v) => {
                setProject(v);
                close();
              }}
            />
          )}
          active={project !== "ALL"}
        />

        <FilterChip
          label="Role"
          value={role}
          opts={roleOptions.map((r) => ({ v: r.value, t: r.label }))}
          onChange={setRole}
          displayValue={
            roleOptions.find((o) => o.value === role)?.label || role
          }
          customContent={(close) => (
            <SearchablePopoverContent
              options={roleOptions}
              currentValue={role}
              placeholder="Cari role..."
              onSelect={(v) => {
                setRole(v);
                close();
              }}
            />
          )}
          active={role !== "ALL"}
        />
      </div>
    </TopbarPortal>
  );
}
