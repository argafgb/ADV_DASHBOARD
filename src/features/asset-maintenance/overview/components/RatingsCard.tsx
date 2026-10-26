"use client";

import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import StarRating from "@/components/shared/StarRating";
import { cn } from "@/lib/utils";

interface RatingsCardProps {
  rating?: number;
  onClick?: () => void;
}

export default function RatingsCard({
  rating = 0,
  onClick,
}: RatingsCardProps) {
  return (
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 outline-none transition-all",
        onClick &&
          "cursor-pointer hover:border-blue-300 hover:shadow-md dark:hover:border-blue-800",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 md:text-sm">
          Rating Kondisi Aset
        </span>
        {onClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-2 py-1 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/40"
          >
            <span>Detail</span>
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-black text-zinc-950 dark:text-zinc-50 md:text-3xl">
            {rating.toFixed(1)}
          </span>
          <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500">
            /5
          </span>
        </div>
        <StarRating value={rating} size={18} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="truncate">Survei hasil PM periode berjalan</span>
        {onClick && (
          <span className="shrink-0 text-[11px] font-medium text-blue-600 dark:text-blue-400 sm:hidden">
            Klik detail
          </span>
        )}
      </div>
    </Card>
  );
}
