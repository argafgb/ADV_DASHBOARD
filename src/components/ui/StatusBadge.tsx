"use client";

import { cn } from "@/lib/utils";

export interface BadgeSpec {
  variant: "success" | "error" | "warning" | "default" | string;
  label: string;
}

export default function StatusBadge({
  spec,
  uppercase = false,
}: {
  spec: BadgeSpec;
  uppercase?: boolean;
}) {
  const getColors = (v: string) => {
    switch (v) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40";
      case "error":
        return "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400 dark:border-zinc-900/40";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-0.75 rounded-full border text-[11px] font-bold select-none",
        getColors(spec.variant),
      )}
    >
      {uppercase ? spec.label.toUpperCase() : spec.label}
    </span>
  );
}
