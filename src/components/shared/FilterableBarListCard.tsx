"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import BarList from "@/components/shared/BarList";
import FilterSelect from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import type { BarDatum } from "@/types/asset-pm.types";

export interface FilterTabOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterableBarListCardProps<T extends string = string> {
  title: string;
  subtitle?: string;
  items: BarDatum[];
  tabs?: FilterTabOption<T>[];
  activeTab?: T;
  onTabChange?: (tab: T) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  valueFormatter?: (value: number) => string;
  color?: string;
  maxHeight?: string;
  className?: string;
}

export default function FilterableBarListCard<T extends string = string>({
  title,
  subtitle,
  items,
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari site...",
  emptyMessage,
  valueFormatter,
  color,
  maxHeight = "max-h-full",
  className,
}: FilterableBarListCardProps<T>) {
  const [uncontrolledQuery, setUncontrolledQuery] = useState("");
  const internalQuery = searchValue ?? uncontrolledQuery;
  const debouncedQuery = useDebounce(internalQuery, 300);

  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  });

  const hasFiredInitialSearch = useRef(false);
  useEffect(() => {
    if (!hasFiredInitialSearch.current) {
      hasFiredInitialSearch.current = true;
      if (!debouncedQuery) return;
    }
    onSearchChangeRef.current?.(debouncedQuery);
  }, [debouncedQuery]);

  const hasSearchChange = Boolean(onSearchChange);
  const filtered = useMemo(() => {
    if (hasSearchChange) return items;
    const q = internalQuery.trim().toLowerCase();
    return q ? items.filter((it) => it.label.toLowerCase().includes(q)) : items;
  }, [items, internalQuery, hasSearchChange]);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      className={cn("h-full flex flex-col min-h-0 overflow-hidden", className)}
      contentClassName="flex flex-1 flex-col min-h-0"
      action={
        tabs && tabs.length > 0 && activeTab && onTabChange ? (
          <>
            {/* Segmented tabs on wider screens */}
            <div
              role="tablist"
              aria-label="Filter kategori"
              className="hidden items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 sm:flex"
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onTabChange(tab.value)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Collapses to a dropdown on small screens */}
            <div className="sm:hidden">
              <FilterSelect
                aria-label="Filter kategori"
                value={activeTab}
                onValueChange={(v) => onTabChange(v as T)}
                options={tabs.map((tab) => ({
                  value: tab.value,
                  label: tab.label,
                }))}
              />
            </div>
          </>
        ) : undefined
      }
    >
      {/* Search */}
      <div className="relative mb-4 shrink-0">
        <span className="pointer-events-none absolute left-3 top-1/2 inline-flex -translate-y-1/2 text-zinc-400">
          <Search size={15} />
        </span>
        <input
          type="text"
          value={internalQuery}
          onChange={(e) => {
            if (onSearchChange) {
              onSearchChange(e.target.value);
            } else {
              setUncontrolledQuery(e.target.value);
            }
          }}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-4 text-xs text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 dark:focus:bg-zinc-900"
        />
      </div>

      {/* Bars */}
      {filtered.length > 0 ? (
        <div className={cn("flex-1 min-h-0 overflow-y-auto px-1", maxHeight)}>
          <BarList
            items={filtered}
            valueFormatter={valueFormatter}
            color={color}
          />
        </div>
      ) : (
        <p className="py-8 text-center text-xs text-zinc-400 shrink-0">
          {emptyMessage || `Tidak ada hasil untuk "${internalQuery.trim()}"`}
        </p>
      )}
    </ChartCard>
  );
}
