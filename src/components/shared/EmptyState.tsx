"use client";

import { ReactNode } from "react";
import { LucideIcon, FolderX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  height?: number | string;
}

/**
 * Standard Purpose-Driven Empty State Component.
 * Displays a clean icon badge, title, description, and optional action.
 */
export function EmptyState({
  icon: Icon = FolderX,
  title,
  description,
  action,
  className,
  height = "220px",
}: EmptyStateProps) {
  const containerStyle =
    typeof height === "number" ? { height: `${height}px` } : { height };

  return (
    <div
      style={containerStyle}
      className={cn(
        "flex w-full flex-col items-center justify-center p-4 text-center transition-all",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-center rounded-2xl bg-zinc-100 p-3 text-zinc-400 dark:bg-zinc-800/70 dark:text-zinc-500">
        <Icon className="h-6 w-6 stroke-[1.75]" />
      </div>

      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
        {title}
      </h4>

      {description && (
        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
