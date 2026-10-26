"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Slot rendered on the right of the header (e.g. filter controls). */
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

/**
 * Standard card wrapper for every chart/table widget: a title/subtitle
 * header (with an optional right-aligned action slot) over the body.
 * Factored from the template's `SampleChartWidget` header block.
 */
export default function ChartCard({
  title,
  subtitle,
  action,
  className,
  contentClassName,
  children,
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        "relative min-w-0 max-w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <div className="mb-4 flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="min-w-0 sm:shrink-0">{action}</div>}
      </div>

      <div className={cn("relative z-0 min-w-0 max-w-full", contentClassName)}>
        {children}
      </div>
    </Card>
  );
}
