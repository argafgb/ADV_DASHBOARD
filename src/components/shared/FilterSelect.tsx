"use client";

import { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  label?: string; // e.g. "Tahun", "Bulan", "Site", "Region", "Tipe"
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  /** Optional leading icon rendered inside the trigger. */
  icon?: ReactNode;
  className?: string;
  "aria-label"?: string;
  /** Force active state visual style */
  active?: boolean;
}

/**
 * Controlled filter dropdown component styled matching the design system
 * pill dropdown (label: value ∨).
 */
export default function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  icon,
  className,
  "aria-label": ariaLabel,
  active,
}: FilterSelectProps) {
  const isSelected =
    active !== undefined
      ? active
      : value !== "ALL" && value !== "all" && value !== "";

  return (
    <Select value={value} onValueChange={(v) => onValueChange(String(v))}>
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(
          "flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shadow-none focus:ring-1 focus:ring-blue-500",
          isSelected
            ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/55 dark:bg-blue-950/30 dark:text-blue-400"
            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
          className,
        )}
      >
        {icon}
        {label && (
          <span className="shrink-0 text-zinc-400 dark:text-zinc-500 font-normal">
            {label}:
          </span>
        )}
        <SelectValue placeholder={placeholder}>
          {(val) => {
            const found = options.find((o) => o.value === String(val ?? ""));
            const displayLabel = found
              ? found.label
              : placeholder ?? String(val ?? "");
            return (
              <span
                className={cn(
                  "font-bold truncate",
                  isSelected && "text-blue-600 dark:text-blue-400",
                )}
              >
                {displayLabel}
              </span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        side="bottom"
        sideOffset={4}
        align="start"
        alignItemWithTrigger={false}
        className="min-w-36 rounded-lg"
      >
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
