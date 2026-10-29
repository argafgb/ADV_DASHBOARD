"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CustomRadioProps {
  checked: boolean;
  disabled?: boolean;
  className?: string;
}

export function CustomRadio({ checked, disabled = false, className }: CustomRadioProps) {
  return (
    <span
      className={cn(
        "inline-flex aspect-square h-4 w-4 min-h-4 min-w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors bg-white dark:bg-zinc-900",
        checked
          ? "border-blue-600 dark:border-blue-500"
          : "border-zinc-300 dark:border-zinc-600",
        disabled && "opacity-50",
        className
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "aspect-square h-2 w-2 min-h-2 min-w-2 shrink-0 rounded-full transition-colors",
          checked ? "bg-blue-600 dark:bg-blue-500" : "bg-transparent"
        )}
      />
    </span>
  );
}
