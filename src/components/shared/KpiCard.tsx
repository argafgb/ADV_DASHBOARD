"use client";

import {
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  Monitor,
  Layers,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Star,
  MapPin,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, fmt } from "@/lib/utils";
import type { KpiDatum } from "@/types/asset-pm.types";

const ICONS: Record<string, LucideIcon> = {
  grid: LayoutGrid,
  monitor: Monitor,
  layers: Layers,
  building: Building2,
  alert: AlertTriangle,
  check: CheckCircle2,
  money: Wallet,
  star: Star,
  pin: MapPin,
  doc: FileText,
};

const ICON_COLORS: Record<string, string> = {
  grid: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
  monitor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
  layers: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
  building: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20",
  alert: "text-rose-500 bg-rose-50 dark:bg-rose-950/20",
  check: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
  money: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
  star: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
  pin: "text-teal-500 bg-teal-50 dark:bg-teal-950/20",
  doc: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
};

/** Fraction units like "/55" render as a muted suffix; others (e.g. "%") inline. */
function isFractionUnit(unit?: string): boolean {
  return Boolean(unit && unit.startsWith("/"));
}

function mainValue(stat: KpiDatum): string {
  if (stat.currency) return `Rp ${fmt(stat.value)}`;
  const inlineUnit = stat.unit && !isFractionUnit(stat.unit) ? stat.unit : "";
  return `${fmt(stat.value)}${inlineUnit}`;
}

type KpiCardVariant = "default" | "primary";

interface KpiCardProps {
  stat: KpiDatum;
  variant?: KpiCardVariant;
}

/** A single KPI stat tile with an optional solid-blue primary treatment. */
export default function KpiCard({ stat, variant = "default" }: KpiCardProps) {
  const Icon = ICONS[stat.icon] ?? LayoutGrid;
  const iconColor = ICON_COLORS[stat.icon] ?? ICON_COLORS.grid;
  const isPrimary = variant === "primary";

  return (
    <Card
      className={cn(
        "flex flex-col justify-between rounded-xl border p-5 shadow-sm",
        isPrimary
          ? "border-blue-600 bg-blue-600 text-white shadow-blue-600/20 dark:border-blue-500 dark:bg-blue-700"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs md:text-sm font-semibold",
            isPrimary ? "text-blue-50" : "text-zinc-500 dark:text-zinc-400",
          )}
        >
          {stat.label}
        </span>
        <span
          className={cn(
            "rounded-lg p-2",
            isPrimary
              ? "bg-white/20 text-white ring-1 ring-white/20"
              : iconColor,
          )}
        >
          <Icon size={16} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            "text-2xl md:text-3xl font-black",
            isPrimary ? "text-white" : "text-zinc-950 dark:text-zinc-50",
          )}
        >
          {mainValue(stat)}
          {isFractionUnit(stat.unit) && (
            <span
              className={cn(
                "text-lg font-bold",
                isPrimary
                  ? "text-blue-100"
                  : "text-zinc-400 dark:text-zinc-500",
              )}
            >
              {stat.unit}
            </span>
          )}
        </span>
        {typeof stat.deltaPct === "number" &&
          (() => {
            const isNeutral = stat.deltaPct === 0;
            const isUp = stat.isUp !== undefined ? stat.isUp : stat.positive;
            const colorClass = isPrimary
              ? "text-white"
              : isNeutral
                ? "text-zinc-500 dark:text-zinc-400"
                : stat.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400";

            return (
              <span className="flex items-center gap-1.5 text-xs">
                <span className={cn("flex items-center font-bold", colorClass)}>
                  {!isNeutral &&
                    (isUp ? (
                      <ArrowUpRight size={12} className="mr-0.5" />
                    ) : (
                      <ArrowDownRight size={12} className="mr-0.5" />
                    ))}
                  {Math.abs(stat.deltaPct)}%
                </span>
                <span
                  className={cn(
                    "font-medium",
                    isPrimary
                      ? "text-blue-100"
                      : "text-zinc-400 dark:text-zinc-500",
                  )}
                >
                  {stat.periodLabel || "dibanding bulan sebelumnya"}
                </span>
              </span>
            );
          })()}
      </div>
    </Card>
  );
}
