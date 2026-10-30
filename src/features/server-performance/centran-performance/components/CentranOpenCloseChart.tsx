"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import TriangleDot from "@/components/ui/TriangleDot";
import SinglePointOverlay from "@/components/ui/SinglePointOverlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CentranOpenCloseData,
  MonthlyServerOpenCloseMetric,
  ServerLocationKey,
} from "../types/centranPerformanceTypes";
import { RechartsTip } from "@/components/chart-tooltip";
import { ChevronDown, Server } from "lucide-react";

interface CentranOpenCloseChartProps {
  data?: CentranOpenCloseData;
  year?: number;
  prevYear?: number;
  periodLabel?: string;
}

type TipeFilterType = "all" | "open" | "close";

const tipeFilterLabels: Record<TipeFilterType, string> = {
  all: "All total",
  open: "Open",
  close: "Close",
};

interface ServerConfig {
  key: ServerLocationKey;
  label: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  borderColor: string;
  activeBorder: string;
}

const SERVER_CONFIGS: ServerConfig[] = [
  {
    key: "server1_ampasit",
    label: "Server 1 di Data Center",
    badgeBg: "bg-blue-600 text-white shadow-xs",
    badgeText: "text-blue-600 font-semibold",
    iconBg:
      "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
    activeBorder:
      "border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/25 bg-blue-500/10 shadow-md",
  },
  {
    key: "server2_ampasit",
    label: "Server 2 di Ampasit",
    badgeBg: "bg-emerald-600 text-white shadow-xs",
    badgeText: "text-emerald-600 font-semibold",
    iconBg:
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    activeBorder:
      "border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-500/10 shadow-md",
  },
  {
    key: "dc",
    label: "Server 4 di Ampasit",
    badgeBg: "bg-rose-600 text-white shadow-xs",
    badgeText: "text-rose-600 font-semibold",
    iconBg:
      "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-500/30 hover:border-rose-500/60",
    activeBorder:
      "border-rose-600 dark:border-rose-500 ring-2 ring-rose-500/25 bg-rose-500/10 shadow-md",
  },
  {
    key: "cos_smg",
    label: "Server 3 di Semarang",
    badgeBg: "bg-amber-600 text-white shadow-xs",
    badgeText: "text-amber-600 font-semibold",
    iconBg:
      "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500/30 hover:border-amber-500/60",
    activeBorder:
      "border-amber-600 dark:border-amber-500 ring-2 ring-amber-500/25 bg-amber-500/10 shadow-md",
  },
];

const formatNumberId = (val?: number): string => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("id-ID").format(num);
};

const formatYAxis = (val: number): string => {
  const num = Number(val) || 0;
  if (num === 0) return "0";
  if (num >= 1000) {
    const kVal = num / 1000;
    return `${kVal % 1 === 0 ? kVal : kVal.toFixed(1)}k`;
  }
  return String(num);
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
    stroke?: string;
    color?: string;
    name?: string;
  }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;

  // Filter out duplicate background Area payload entries (which lack entry.stroke or have stroke="none")
  const filteredPayload = payload.filter(
    (entry) =>
      entry.value != null &&
      entry.stroke !== "none" &&
      entry.color !== "none" &&
      entry.name,
  );

  const displayPayload = filteredPayload.length > 0 ? filteredPayload : payload;

  return (
    <RechartsTip
      title={`Bulan: ${label}`}
      rows={displayPayload.map((entry) => ({
        color: entry.color || entry.stroke,
        label: entry.name,
        value: formatNumberId(entry.value),
      }))}
    />
  );
};

export function CentranOpenCloseChart({
  data,
  year = 2026,
  prevYear = 2025,
  periodLabel = "Full Year 2026",
}: CentranOpenCloseChartProps) {
  // Default selected server: Server 1 @Ampasit (as specified by user requirement)
  const [selectedServer, setSelectedServer] = useState<
    ServerLocationKey | "all"
  >("server1_ampasit");
  const [tipeFilter, setTipeFilter] = useState<TipeFilterType>("all");

  if (!data || !data.monthly) {
    return null;
  }

  // Calculate dynamic card counts for each server based on selected tipeFilter
  const serverCounts: Record<ServerLocationKey, number> = {
    server1_ampasit: 0,
    server2_ampasit: 0,
    cos_smg: 0,
    dc: 0,
  };

  data.monthly.forEach((item) => {
    SERVER_CONFIGS.forEach((cfg) => {
      const metric = item.byServer?.[cfg.key];
      if (metric) {
        if (tipeFilter === "all") {
          serverCounts[cfg.key] += Number(metric.total26) || 0;
        } else if (tipeFilter === "open") {
          serverCounts[cfg.key] += Number(metric.open26) || 0;
        } else if (tipeFilter === "close") {
          serverCounts[cfg.key] += Number(metric.close26) || 0;
        }
      }
    });
  });

  // Transform chart timeline data based on selectedServer & tipeFilter
  const chartData = data.monthly.map((item: MonthlyServerOpenCloseMetric) => {
    let val25 = 0;
    let val26 = 0;

    if (selectedServer === "all") {
      if (tipeFilter === "all") {
        val25 = Number(item.allTotal25) || 0;
        val26 = Number(item.allTotal26) || 0;
      } else if (tipeFilter === "open") {
        val25 = Number(item.allOpen25) || 0;
        val26 = Number(item.allOpen26) || 0;
      } else if (tipeFilter === "close") {
        val25 = Number(item.allClose25) || 0;
        val26 = Number(item.allClose26) || 0;
      }
    } else {
      const sMetric = item.byServer?.[selectedServer];
      if (sMetric) {
        if (tipeFilter === "all") {
          val25 = Number(sMetric.total25) || 0;
          val26 = Number(sMetric.total26) || 0;
        } else if (tipeFilter === "open") {
          val25 = Number(sMetric.open25) || 0;
          val26 = Number(sMetric.open26) || 0;
        } else if (tipeFilter === "close") {
          val25 = Number(sMetric.close25) || 0;
          val26 = Number(sMetric.close26) || 0;
        }
      }
    }

    return {
      month: item.month,
      [String(prevYear)]: val25,
      [String(year)]: val26,
    };
  });

  const activeServerObj = SERVER_CONFIGS.find((c) => c.key === selectedServer);
  const selectedServerLabel = activeServerObj
    ? activeServerObj.label
    : "All total";

  return (
    <Card className="min-w-0 overflow-hidden border-border/50 bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Total Open & Close
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
              {periodLabel} • {selectedServerLabel} (
              {tipeFilterLabels[tipeFilter]})
            </CardDescription>
          </div>

          {/* Top Controls: Tipe Filter Dropdown & Server Location Quick Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mr-2">
              <span>Tipe:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent hover:text-accent-foreground transition-all">
                    <span>{tipeFilterLabels[tipeFilter]}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => setTipeFilter("all")}
                    className={
                      tipeFilter === "all" ? "font-bold text-primary" : ""
                    }
                  >
                    All total
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTipeFilter("open")}
                    className={
                      tipeFilter === "open" ? "font-bold text-primary" : ""
                    }
                  >
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTipeFilter("close")}
                    className={
                      tipeFilter === "close" ? "font-bold text-primary" : ""
                    }
                  >
                    Close
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Quick Badge Selection Pills */}
            <div className="hidden sm:flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40">
              {SERVER_CONFIGS.map((cfg) => {
                const isSelected = selectedServer === cfg.key;
                const displayLabel = data.serverLabels?.[cfg.key] || cfg.label;
                return (
                  <button
                    key={cfg.key}
                    onClick={() =>
                      setSelectedServer(isSelected ? "all" : cfg.key)
                    }
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                      isSelected
                        ? cfg.badgeBg
                        : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                    }`}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 4 Interactive Server Location Cards Grid (Prototype Style) */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVER_CONFIGS.map((cfg) => {
            const isSelected = selectedServer === cfg.key;
            const count = serverCounts[cfg.key];
            const displayLabel = data.serverLabels?.[cfg.key] || cfg.label;

            return (
              <div
                key={cfg.key}
                onClick={() => setSelectedServer(isSelected ? "all" : cfg.key)}
                className={`group cursor-pointer flex items-center gap-3.5 rounded-2xl border-2 p-4 transition-all duration-200 ${
                  isSelected
                    ? cfg.activeBorder
                    : `bg-background/60 hover:bg-accent/20 ${cfg.borderColor}`
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cfg.iconBg} transition-transform group-hover:scale-105`}
                >
                  <Server className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground truncate">
                    {displayLabel}
                  </p>
                  <p className="text-2xl font-black tracking-tight text-foreground mt-0.5">
                    {formatNumberId(count)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recharts Timeline Line & Area Chart */}
        <div className="relative min-w-0 pt-2">
          {/* Year Legend Top Right */}
          <div className="flex items-center justify-end gap-5 text-xs font-medium mb-3 pr-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="h-0.5 w-5 border-t-2 border-dashed border-amber-500" />
              <span>{prevYear}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <span className="h-1 w-5 rounded-full bg-blue-600" />
              <span>{year}</span>
            </div>
          </div>

          <div className="relative h-64 w-full min-w-0 overflow-hidden sm:h-75">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient
                    id="color2026Centran"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/40"
                />
                <XAxis
                  dataKey="month"
                  padding={{ left: 8, right: 8 }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  minTickGap={8}
                  className="text-muted-foreground"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey={String(year)}
                  stroke="none"
                  fill="url(#color2026Centran)"
                  connectNulls={false}
                  tooltipType="none"
                />

                <Line
                  type="monotone"
                  dataKey={String(prevYear)}
                  name={String(prevYear)}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={<TriangleDot color="#f59e0b" />}
                  activeDot={<TriangleDot color="#f59e0b" size={6} />}
                />

                <Line
                  type="monotone"
                  dataKey={String(year)}
                  name={String(year)}
                  stroke="#2563eb"
                  strokeWidth={3.5}
                  dot={{
                    r: 4,
                    fill: "#2563eb",
                    stroke: "#ffffff",
                    strokeWidth: 1.5,
                  }}
                  activeDot={{ r: 7, fill: "#2563eb" }}
                  connectNulls={false}
                />

                <SinglePointOverlay
                  data={chartData}
                  xKey="month"
                  series={[
                    {
                      dataKey: String(prevYear),
                      color: "#f59e0b",
                      format: formatNumberId,
                    },
                    {
                      dataKey: String(year),
                      color: "#2563eb",
                      fill: true,
                      format: formatNumberId,
                    },
                  ]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
