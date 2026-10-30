"use client";

import { Icon, type IconName } from "../ui/icons";
import { cn } from "@/lib/utils";
import { useCountUp } from "../../hooks/useCountUp";
import { useTooltip } from "../../context/tooltip-provider";

interface KpiCardProps {
  icon: IconName;
  iconFg: string;
  iconBg: string;
  label: string;
  value: number;
  suffix?: string;
  sub: string;
  tipLines?: string[];
  delayClass?: string;
  variant?: "default" | "primary";
}

/** Overview KPI tile: tinted icon, count-up value, one-line sub-label. */
export function KpiCard({
  icon,
  iconFg,
  iconBg,
  label,
  value,
  suffix,
  sub,
  tipLines,
  delayClass,
  variant = "default",
}: KpiCardProps) {
  const displayed = useCountUp(value);
  const { bind } = useTooltip();
  return (
    <div
      {...(tipLines ? bind(label, tipLines) : {})}
      className={cn(
        "dh-fade-up dh-card-3d min-w-0 flex items-center gap-3 rounded-[14px] border px-4 py-4 sm:gap-[13px] sm:px-[19px] sm:py-[17px]",
        variant === "primary"
          ? "border-blue-700 bg-blue-700 text-white hover:border-blue-900 dark:border-blue-500 dark:bg-blue-800"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200 dark:hover:border-zinc-700",
        delayClass,
      )}
    >
      <span
        className={cn(
          "inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] sm:h-[42px] sm:w-[42px]",
          variant === "primary" && "bg-white/15 text-white",
        )}
        style={variant === "default" ? { background: iconBg, color: iconFg } : undefined}
      >
        <Icon name={icon} size={19} />
      </span>
      <div className="min-w-0">
        <div
          className={cn(
            "text-[12.5px] font-semibold",
            variant === "primary" ? "text-white/90" : "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {label}
        </div>
        <div
          className={cn(
            "text-[28px] leading-[1.15] font-semibold tabular-nums sm:text-[32px]",
            variant === "primary" ? "text-white" : "text-zinc-900 dark:text-zinc-50",
          )}
        >
          {displayed}
          {suffix && (
            <span
              className={cn(
                "ml-[1px] text-[18px] font-medium",
                variant === "primary" ? "text-white/80" : "text-zinc-500 dark:text-zinc-400",
              )}
            >
              {suffix}
            </span>
          )}
        </div>
        <div
          className={cn(
            "mt-[2px] truncate text-[11px] leading-tight font-medium sm:text-[11.5px]",
            variant === "primary" ? "text-white/80" : "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}
