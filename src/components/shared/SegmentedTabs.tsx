"use client";

import FilterSelect from "@/components/shared/FilterSelect";
import { cn } from "@/lib/utils";

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedTabsProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  "aria-label": string;
  className?: string;
}

/**
 * Segmented pill tabs on wider screens that collapse to a dropdown on small
 * screens. Shared filter control used across dashboard sections.
 */
export default function SegmentedTabs({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
}: SegmentedTabsProps) {
  return (
    <>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "hidden items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 sm:flex",
          className,
        )}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="sm:hidden">
        <FilterSelect
          aria-label={ariaLabel}
          value={value}
          onValueChange={onChange}
          options={options}
        />
      </div>
    </>
  );
}
