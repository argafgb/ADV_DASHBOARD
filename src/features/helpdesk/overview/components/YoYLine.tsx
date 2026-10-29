"use client";

import { useState } from "react";
import { RechartsTip } from "@/components/chart-tooltip";
import { fmt } from "@/lib/utils";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type YoYLineProps = {
  prev: number;
  cur: number;
  year?: string | number;
};

type ChartRow = {
  year: string;
  tickets: number;
};

const COLORS = {
  line: "#2563EB",
  prevDot: "#F59E0B",
  curDot: "#2563EB",
  prevBar: "#F59E0B",
  curBar: "#2563EB",
};

export default function YoYLine({ prev, cur, year = "2026" }: YoYLineProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const selectedYear =
    typeof year === "number" ? year : parseInt(String(year), 10) || 2026;
  const prevYearLabel = String(selectedYear - 1);
  const currentYearLabel = String(selectedYear);

  const data: ChartRow[] = [
    {
      year: prevYearLabel,
      tickets: prev,
    },
    {
      year: currentYearLabel,
      tickets: cur,
    },
  ];

  const maxValue = Math.max(prev, cur, 10);
  const yMax = Math.ceil((maxValue * 1.18) / 250) * 250;

  return (
    <div className="h-43.75 w-full min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 32,
            right: 18,
            left: 8,
            bottom: 8,
          }}
          barGap={0}
          barCategoryGap="18%"
          onMouseMove={(state) =>
            setActiveIndex(
              typeof state?.activeTooltipIndex === "number"
                ? state.activeTooltipIndex
                : null,
            )
          }
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid
            vertical={false}
            stroke="#EEF2F7"
            strokeDasharray="5 5"
          />

          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "#9CA3AF",
              fontSize: 13,
              fontWeight: 700,
            }}
            dy={8}
          />

          <YAxis hide domain={[0, yMax]} />

          <Tooltip
            cursor={{
              fill: "rgba(148, 163, 184, 0.08)",
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const ticketPayload = payload.find(
                (item) => item.dataKey === "tickets",
              );
              const value = Number(ticketPayload?.value ?? 0);
              const color =
                label === prevYearLabel ? COLORS.prevBar : COLORS.curBar;
              return (
                <RechartsTip
                  title={`Tahun ${label}`}
                  rows={[{ color, label: "Tickets", value: fmt(value) }]}
                />
              );
            }}
          />

          <Bar
            dataKey="tickets"
            barSize={54}
            radius={[10, 10, 0, 0]}
            isAnimationActive
          >
            {data.map((item, index) => (
              <Cell
                key={item.year}
                fill={
                  item.year === prevYearLabel ? COLORS.prevBar : COLORS.curBar
                }
                fillOpacity={
                  activeIndex === null || activeIndex === index ? 1 : 0.45
                }
                style={{ transition: "fill-opacity 0.15s ease" }}
              />
            ))}
          </Bar>

          <Line
            type="monotone"
            dataKey="tickets"
            stroke={COLORS.line}
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={<CustomDot />}
            label={<CustomLabel />}
            isAnimationActive
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartPointProps {
  cx?: number;
  cy?: number;
  x?: number;
  y?: number;
  value?: number | string;
  index?: number;
}

function CustomDot(props: ChartPointProps) {
  const { cx, cy, index } = props;

  if (cx === undefined || cy === undefined) return null;

  const isCurrent = index === 1;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#FFFFFF"
      stroke={isCurrent ? COLORS.curDot : COLORS.prevDot}
      strokeWidth={3}
    />
  );
}

function CustomLabel(props: ChartPointProps) {
  const { x, y, value, index } = props;

  if (x === undefined || y === undefined || value === undefined) return null;

  const isCurrent = index === 1;

  return (
    <text
      x={x}
      y={y - 12}
      textAnchor="middle"
      className={[
        "fill-current text-[16px] font-extrabold",
        isCurrent ? "text-blue-600" : "text-amber-600",
      ].join(" ")}
    >
      {fmt(Number(value))}
    </text>
  );
}
