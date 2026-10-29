"use client";

import {
  AlertTriangle,
  Bug,
  DatabaseZap,
  GraduationCap,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  RootCauseItem,
  RootCauseColor,
  RootCauseIconKey,
} from "../types/rootCause.types";
import { formatNumber } from "../utils/rating-root-cause-utils";

const colorHexMap: Record<RootCauseColor, string> = {
  violet: "#6D28D9",
  red: "#EF4444",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  emerald: "#10B981",
  blue: "#6366F1",
};

const iconMap: Record<RootCauseIconKey, LucideIcon> = {
  human: UserRoundX,
  bug: Bug,
  data: DatabaseZap,
  education: GraduationCap,
  improvement: ShieldCheck,
  software: AlertTriangle,
};

interface TopRootCauseCardProps {
  item: RootCauseItem;
  onClick: () => void;
}

export default function TopRootCauseCard({
  item,
  onClick,
}: TopRootCauseCardProps) {
  const IconComponent = iconMap[item.iconKey];
  const color = colorHexMap[item.color];

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-colors"
    >
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-slate-50"
        style={{
          borderColor: `${color}55`,
          color,
        }}
      >
        <IconComponent size={23} />
      </div>

      <div className="mt-3 text-base font-bold uppercase leading-tight text-slate-950">
        {item.name}
      </div>

      <div className="mt-1 text-xs font-bold uppercase text-slate-500">
        Rank #{item.rank}
      </div>

      <div className="my-3 h-px bg-slate-200" />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase text-slate-500">
            Tickets
          </div>
          <div className="mt-1 text-xl font-bold text-slate-950">
            {formatNumber(item.tickets)}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase text-slate-500">
            Contribute (%)
          </div>
          <div className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
            {(item.sharePercentage ?? 0).toFixed(1)}%
          </div>
        </div>
      </div>
    </button>
  );
}
