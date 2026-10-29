"use client";

import { cn } from "@/lib/utils";

export default function SlaStatusPill({
  achieved,
  onPrimary = false,
}: {
  achieved: boolean;
  onPrimary?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-4 py-1.5 text-sm font-semibold",
        onPrimary
          ? achieved
            ? "border-emerald-200/70 bg-emerald-400/15 text-emerald-50"
            : "border-red-200/70 bg-red-400/15 text-red-50"
          : achieved
            ? "border-emerald-500 text-emerald-600 dark:border-emerald-500/60 dark:text-emerald-400"
            : "border-red-500 text-red-600 dark:border-red-500/60 dark:text-red-400",
      )}
    >
      {achieved ? "Achieved" : "Not Achieved"}
    </span>
  );
}
