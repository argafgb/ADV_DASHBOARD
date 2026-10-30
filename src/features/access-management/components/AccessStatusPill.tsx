import * as React from "react";
import { cn } from "@/lib/utils";

interface AccessStatusPillProps {
  status: "active" | "suspended" | "pending";
  className?: string;
}

export function AccessStatusPill({ status, className }: AccessStatusPillProps) {
  let label = "Aktif";
  let classes = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";

  if (status === "suspended") {
    label = "Suspended";
    classes = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800";
  } else if (status === "pending") {
    label = "Belum Terdaftar";
    classes = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        classes,
        className,
      )}
    >
      {label}
    </span>
  );
}

export function CustomBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
        className,
      )}
    >
      Custom
    </span>
  );
}
