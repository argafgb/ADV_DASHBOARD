"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SheetMenu } from "@/components/dashboard-panel/sheet-menu";
import { maxMonthForYear } from "@/lib/period-filter";
import { DASHBOARD_CONFIG, YEAR_OPTIONS } from "@/lib/dashboard-config";
import { useFilters, type SiteFilterValue } from "@/context/FilterContext";
import {
  COMPANY_OPTIONS,
  type CompanyCode,
  type CompanyFilterValue,
  type SiteOption,
} from "@/types/asset-pm.types";
import { parseCompanyFilter } from "@/lib/company-filter";
import { Clock, ChevronDown, Search, Check } from "lucide-react";
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

function getMonthLabel(value: string) {
  if (value === "ALL") return "All Months";
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
  const single = parseInt(value, 10);
  return monthNames[single] || value;
}

function CompanyPopoverContent({
  currentCompany,
  onToggle,
  onResetAll,
}: {
  currentCompany: CompanyFilterValue;
  onToggle: (code: CompanyCode) => void;
  onResetAll: () => void;
}) {
  const parsed = parseCompanyFilter(currentCompany);

  return (
    <div className="w-52 p-1 space-y-0.5">
      <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Pilih Perusahaan
      </div>

      {/* Option: Semua Perusahaan */}
      <button
        type="button"
        onClick={onResetAll}
        className={cn(
          "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-all text-left cursor-pointer",
          parsed.isAll
            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        )}
      >
        <span>Semua Perusahaan</span>
        {parsed.isAll && (
          <Check size={13} className="shrink-0 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Options: Advantage, Wisesa, Etrama with checkboxes */}
      {COMPANY_OPTIONS.map((opt) => {
        const isChecked = parsed.codes.includes(opt.code);
        return (
          <button
            key={opt.code}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggle(opt.code);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-all text-left cursor-pointer",
              isChecked
                ? "bg-blue-50/70 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 font-medium"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-3.5 items-center justify-center rounded border transition-colors",
                  isChecked
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
                )}
              >
                {isChecked && <Check size={10} strokeWidth={3} />}
              </span>
              <span>{opt.label}</span>
            </div>
            <span className="font-mono text-[10.5px] font-semibold text-zinc-400 dark:text-zinc-500">
              {opt.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SitePopoverContent({
  siteOptions,
  currentSite,
  onSelect,
}: {
  siteOptions: SiteOption[];
  currentSite: string;
  onSelect: (val: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filteredOptions = siteOptions.filter((opt) =>
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
          placeholder="Cari site..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 pl-8 pr-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => {
            const isSelected = opt.value === currentSite;
            return (
              <button
                key={opt.value}
                type="button"
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelect(opt.value)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-all text-left truncate cursor-pointer",
                  isSelected
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check
                    size={13}
                    className="shrink-0 text-blue-600 dark:text-blue-400"
                  />
                )}
              </button>
            );
          })
        ) : (
          <div className="px-2.5 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
            Tidak ditemukan
          </div>
        )}
      </div>
    </div>
  );
}

interface NavbarProps {
  onOpenDashModal?: () => void;
}

export function Navbar({ onOpenDashModal }: NavbarProps = {}) {
  const {
    site,
    setSite,
    siteOptions,
    company,
    setCompany,
    toggleCompany,
    year,
    setYear,
    month,
    setMonth,
    lastUpdated,
  } = useFilters();
  const pathname = usePathname();
  const isHelpdesk = pathname.startsWith("/dashboard/helpdesk");
  const pageTitle = isHelpdesk
    ? "Helpdesk & Ticketing"
    : "IT Asset & PM Dashboard";

  const maxMonth = maxMonthForYear(year);
  const selectedMonthNum = month === "ALL" ? null : parseInt(month, 10);
  const parsedCompany = parseCompanyFilter(company);

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
          const isCurrentSelected = selectedMonthNum === m.v;
          const disabled = m.v > maxMonth;
          return (
            <button
              key={m.v}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              aria-current={isCurrentSelected ? "true" : undefined}
              title={disabled ? "Bulan mendatang belum tersedia" : m.t}
              onClick={() => {
                setMonth(String(m.v));
                close();
              }}
              className={`h-8 rounded-md text-xs font-medium transition-all ${
                disabled
                  ? "cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700"
                  : isCurrentSelected
                    ? "cursor-pointer bg-blue-600 text-white font-bold"
                    : "cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {m.t}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 isolate w-full shrink-0 overflow-visible border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-zinc-950/60 shadow-sm">
      <div className="mx-3 flex h-14 min-w-0 items-center justify-between gap-2 sm:mx-6 sm:gap-3">
        {/* Left Side: Navigation Sheet & Page Header */}
        <div className="flex min-w-0 items-center space-x-3 shrink-0">
          <SheetMenu onOpenDashModal={onOpenDashModal} />
          <h2 className="hidden md:block font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
            {pageTitle}
          </h2>
        </div>

        {/* Right Side: Global Filters & Metadata */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden max-w-37.5 shrink-0 items-center gap-1.5 text-[11px] font-medium leading-tight text-zinc-400 dark:text-zinc-500 lg:flex xl:max-w-none">
            <Clock size={13} className="shrink-0" />
            <span className="flex min-w-0 flex-col xl:flex-row xl:items-center xl:gap-1">
              <span className="shrink-0">Terakhir diperbarui:</span>
              <span className="truncate text-zinc-500 dark:text-zinc-400">
                {lastUpdated}
              </span>
            </span>
          </div>

          {/* Global Filters (Scrollable horizontally on small screens) */}
          {!isHelpdesk ? (
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
              label="Perusahaan"
              value={company}
              onChange={(v) => setCompany(v as CompanyFilterValue)}
              displayValue={parsedCompany.displayLabel}
              customContent={() => (
                <CompanyPopoverContent
                  currentCompany={company}
                  onToggle={toggleCompany}
                  onResetAll={() => setCompany("ALL")}
                />
              )}
              active={!parsedCompany.isAll}
            />

            <FilterChip
              label="Site"
              value={site}
              opts={siteOptions.map((s) => ({ v: s.value, t: s.label }))}
              onChange={(v) => setSite(v as SiteFilterValue)}
              displayValue={
                siteOptions.find((o) => o.value === site)?.label || site
              }
              customContent={(close) => (
                <SitePopoverContent
                  siteOptions={siteOptions}
                  currentSite={site}
                  onSelect={(v) => {
                    setSite(v as SiteFilterValue);
                    close();
                  }}
                />
              )}
              active={site !== "ALL"}
            />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <span className="text-xs text-zinc-500 font-medium px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                Helpdesk Global Scope
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
