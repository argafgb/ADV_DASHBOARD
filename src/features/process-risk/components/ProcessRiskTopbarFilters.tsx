'use client';

import { useState } from 'react';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { TopbarPortal } from '@/components/dashboard-panel/topbar-portal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isMonthSelectable, useFilters } from '../context/ProcessRiskFilterContext';
import { useDashboardData } from '../data/workplans';
import { nextMonthSelection } from '../utils/month-filter';
import { MONTH_NAMES, MONTH_SHORT, YEAR_OPTIONS } from '../utils/constants';
import { MONTHS_ID } from '../utils/selectors';
import type { DataYear } from '../types';
import { formatSyncTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  const selectedOpt = opts.find((option) => option.v === value) || opts[0];
  const renderedValue = displayValue || (selectedOpt ? selectedOpt.t : value);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${renderedValue}`}
          className={cn(
            'flex h-8 min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer',
            active
              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/55 dark:text-blue-400'
              : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80',
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
                    'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md cursor-pointer',
                    isSelected
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
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

const MONTHS_GRID = MONTHS_ID.map((name, index) => ({
  value: index,
  short: MONTH_SHORT[index],
  name,
}));

export function ProcessRiskTopbarFilters() {
  const { year, setYear, month, monthRange, setMonth } = useFilters();
  const { updatedAt } = useDashboardData();
  const lastUpdated = formatSyncTimestamp(updatedAt);

  const monthLabel = monthRange.isAll
    ? 'All Months'
    : monthRange.start === monthRange.end
      ? MONTH_NAMES[(monthRange.start ?? 1) - 1]
      : `${MONTH_SHORT[(monthRange.start ?? 1) - 1]} - ${MONTH_SHORT[(monthRange.end ?? 1) - 1]}`;

  const handleMonthClick = (selected: number) => {
    setMonth(nextMonthSelection(monthRange, selected));
  };

  const monthPopoverContent = (close: () => void) => (
    <div className="w-64 p-2">
      <button
        type="button"
        onClick={() => {
          setMonth('ALL');
          close();
        }}
        className={cn(
          'mb-2 h-7 w-full cursor-pointer rounded-md border py-1 text-xs font-semibold transition-all',
          monthRange.isAll
            ? 'bg-blue-600 text-white'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800',
        )}
      >
        All Months
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS_GRID.map((option) => {
          const disabled = !isMonthSelectable(year, option.value);
          const isSelected = monthRange.months.includes(option.value + 1);
          const isEdge =
            option.value + 1 === monthRange.start || option.value + 1 === monthRange.end;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              title={
                disabled
                  ? `${option.name} belum tersedia karena periodenya belum berjalan`
                  : option.name
              }
              onClick={() => handleMonthClick(option.value + 1)}
              className={cn(
                'h-8 rounded-md text-xs font-medium transition-all',
                disabled
                  ? 'cursor-not-allowed bg-zinc-50 text-zinc-300 dark:bg-zinc-900/30 dark:text-zinc-700'
                  : isSelected
                    ? isEdge
                      ? 'cursor-pointer bg-blue-600 text-white font-bold'
                      : 'cursor-pointer bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'cursor-pointer text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
              )}
            >
              {option.short}
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
          <span className="truncate text-zinc-500 dark:text-zinc-400">{lastUpdated}</span>
        </span>
      </div>

      <div className="no-scrollbar flex min-w-0 max-w-full touch-pan-x items-center justify-start gap-1 overflow-x-auto py-1 sm:justify-end sm:gap-1.5">
        <FilterChip
          label="Tahun"
          value={String(year)}
          opts={YEAR_OPTIONS as unknown as { v: string; t: string }[]}
          onChange={(next) => setYear(Number(next) as DataYear)}
        />
        <FilterChip
          label="Bulan"
          value={month}
          displayValue={monthLabel}
          onChange={() => {}}
          customContent={(close) => monthPopoverContent(close)}
          active={!monthRange.isAll}
        />
      </div>
    </TopbarPortal>
  );
}
