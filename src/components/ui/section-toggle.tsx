"use client";

import { ChevronDownIcon } from "lucide-react";

/** Collapsible section header with rotating chevron (Overview sections). */
export default function SectionToggle({
  open,
  onToggle,
  label,
  hint,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <div
      onClick={onToggle}
      className="mb-3 flex cursor-pointer select-none items-center gap-1.75"
    >
      <span
        className="inline-flex text-zinc-900 dark:text-zinc-50 transition-transform duration-150"
        style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
      >
        <ChevronDownIcon size={20} />
      </span>
      <span className="text-[13px] font-bold tracking-[-0.01em] text-primary">
        {label}
      </span>
      {hint && (
        <span className="text-[11px] font-medium text-placeholder">{hint}</span>
      )}
    </div>
  );
}
