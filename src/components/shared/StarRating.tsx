"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export {
  calculateAssetFeedbackScore,
  calculateAssetRatingSummary,
  type AssetRatingSummaryResult,
} from "@/lib/rating-utils";

export interface StarRatingProps {
  /** Numeric rating value (e.g. 0.0 to 5.0). Values are clamped between 0 and maxStars. */
  value: number;
  /** Total number of stars to display (default: 5). */
  maxStars?: number;
  /** Size of each star icon in pixels (default: 16). */
  size?: number;
  /** Whether to render the formatted numeric score next to the stars (e.g. "4.85"). */
  showValue?: boolean;
  /** Optional container class name. */
  className?: string;
  /** Optional class name for the numeric value text. */
  valueClassName?: string;
}

/**
 * Single fractional star unit with precision layer clipping.
 */
function FractionalStarItem({
  fillPercent,
  size,
}: {
  fillPercent: number;
  size: number;
}) {
  const clamped = Math.max(0, Math.min(100, fillPercent));

  return (
    <div
      className="relative inline-block shrink-0 select-none overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Base unshaded star */}
      <Star
        size={size}
        className="fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
      />

      {/* Clipped golden star overlay */}
      {clamped > 0 && (
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${clamped}%` }}
        >
          <Star
            size={size}
            className="fill-amber-400 text-amber-400 shrink-0"
            style={{ width: size, minWidth: size }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Five-star rating row supporting smooth fractional star fills (e.g. 4.85 / 5.0)
 * and accessible aria labels.
 */
export default function StarRating({
  value = 0,
  maxStars = 5,
  size = 16,
  showValue = false,
  className,
  valueClassName,
}: StarRatingProps) {
  const safeValue = Math.max(0, Math.min(maxStars, Number(value) || 0));

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rating: ${safeValue.toFixed(2)} dari ${maxStars} bintang`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          let fillPercent = 0;
          if (safeValue >= i + 1) {
            fillPercent = 100;
          } else if (safeValue > i) {
            fillPercent = (safeValue - i) * 100;
          }

          return (
            <FractionalStarItem
              key={i}
              fillPercent={fillPercent}
              size={size}
            />
          );
        })}
      </div>

      {showValue && (
        <span
          className={cn(
            "text-xs font-bold tabular-nums text-zinc-700 dark:text-zinc-300",
            valueClassName,
          )}
        >
          {safeValue.toFixed(2)}
        </span>
      )}
    </div>
  );
}
