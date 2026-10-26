"use client";

import { Router, Wifi, Network, PackageCheck, type LucideIcon } from "lucide-react";
import { cn, fmt } from "@/lib/utils";
import type {
  DeviceRequestType,
  DeviceRequestTypeFilter,
  DeviceRequestsModel,
} from "../types";
import { TYPE_META } from "../utils/deviceRequestsTransformer";

const ICONS: Record<DeviceRequestType, LucideIcon> = {
  router: Router,
  ap: Wifi,
  switch: Network,
};

const ICON_STYLE: Record<DeviceRequestType, string> = {
  router: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  ap: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
  switch: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
};

export default function DeviceRequestKpis({
  model,
  scopeLabel,
  activeType,
  onTypeToggle,
}: {
  model: DeviceRequestsModel;
  scopeLabel: string;
  activeType: DeviceRequestTypeFilter;
  onTypeToggle: (type: DeviceRequestType) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total KPI Card */}
      <div className="flex flex-col justify-between gap-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <PackageCheck size={16} /> Total Kebutuhan
          </span>
          <span className="max-w-[55%] truncate rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold">
            {scopeLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-extrabold tabular-nums leading-none">
            {fmt(model.total)}
          </span>
          <span className="text-sm font-semibold">unit</span>
        </div>
        <p className="text-xs text-blue-100">
          {model.total
            ? `${model.siteCount} cabang / unit · ${model.penambahanCount} Penambahan · ${model.pergantianCount} Pergantian`
            : "Tidak ada kebutuhan untuk filter ini"}
        </p>
      </div>

      {/* 2-4. Device Types Cards */}
      {model.typeCards.map((card) => {
        const Icon = ICONS[card.type];
        const dimmed = activeType !== "all" && activeType !== card.type;
        const selected = activeType === card.type;
        return (
          <button
            key={card.type}
            type="button"
            onClick={() => onTypeToggle(card.type)}
            title="Klik untuk memfilter jenis perangkat ini"
            className={cn(
              "flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900",
              selected
                ? "border-blue-400 ring-2 ring-blue-500/20 dark:border-blue-700"
                : "border-zinc-200 dark:border-zinc-800",
              dimmed && "opacity-45",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                    ICON_STYLE[card.type],
                  )}
                >
                  <Icon size={16} />
                </span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {card.label}
                </span>
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {card.pct}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-extrabold tabular-nums leading-none text-zinc-900 dark:text-zinc-50">
                {fmt(card.value)}
              </span>
              <span className="text-xs text-zinc-400">unit</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full min-w-[4px] rounded-full transition-all duration-500"
                style={{
                  width: `${card.pct}%`,
                  background: TYPE_META[card.type].color,
                }}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {card.value
                ? `Diminta ${card.siteCount} cabang / unit`
                : "Tidak ada permintaan"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
