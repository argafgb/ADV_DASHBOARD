"use client";

import { CompactChartTooltip } from "@/components/chart-tooltip";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CentranMonthlyMetric } from "../types/centranPerformanceTypes";

interface CentranSlaChartProps {
  metrics: CentranMonthlyMetric[];
  year: number;
  prevYear: number;
  periodLabel: string;
}

type FilterOption = "freq" | "downtime";



export function CentranSlaChart({
  metrics,
  year,
  prevYear,
  periodLabel,
}: CentranSlaChartProps) {
  const [activeTab, setActiveTab] = useState<FilterOption>("freq");

  const getMetricKeys = () => {
    switch (activeTab) {
      case "freq":
        return {
          keyPrev: "freqPrev",
          keyCurr: "freqCurr",
          labelPrev: `${prevYear} Frekuensi Issue`,
          labelCurr: `${year} Frekuensi Issue`,
          unit: " kali",
          domain: undefined,
        };
      case "downtime":
        return {
          keyPrev: "downPrev",
          keyCurr: "downCurr",
          labelPrev: `${prevYear} Downtime`,
          labelCurr: `${year} Downtime`,
          unit: " m",
          domain: undefined,
        };
    }
  };

  const config = getMetricKeys();

  return (
    <Card className="min-w-0 overflow-hidden bg-card border-border/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Performance & Availability Trends
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Analisis metrik sistem bulanan · {periodLabel}
          </CardDescription>
        </div>

        {/* Local Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/60 p-1 text-xs">
          <button
            onClick={() => setActiveTab("freq")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              activeTab === "freq"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            Frekuensi Issue
          </button>
          <button
            onClick={() => setActiveTab("downtime")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              activeTab === "downtime"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            Summary Downtime (Menit)
          </button>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 px-2 pt-4 sm:px-4">
        <div className="relative h-64 w-full min-w-0 overflow-hidden sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics}
              margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.15}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                minTickGap={8}
                dy={5}
              />
              <YAxis
                domain={config.domain}
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <Tooltip
                cursor={false}
                content={<CompactChartTooltip unit={config.unit} />}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Bar
                dataKey={config.keyPrev}
                name={config.labelPrev}
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
              <Bar
                dataKey={config.keyCurr}
                name={config.labelCurr}
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
