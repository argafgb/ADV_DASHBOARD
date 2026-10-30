"use client";

import { fmt } from "@/lib/utils";
import { RechartsTip } from "@/components/chart-tooltip";
import { KpiYoY } from "../types/overviewTypes";
import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  line: "#2563EB",
  prevDot: "#F59E0B",
  curDot: "#2563EB",
  prevBar: "#F59E0B",
  curBar: "#2563EB",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label, metric = "Jumlah" }: any) {
  if (!active || !payload?.length) return null;
  const item = payload.find((p: any) => p.dataKey === "n");
  const value = Number(item?.value ?? 0);
  const color = label === "2025" ? COLORS.prevBar : COLORS.curBar;
  return (
    <RechartsTip
      title={`Tahun ${label}`}
      rows={[{ color, label: metric, value: fmt(value) }]}
    />
  );
}

function CustomDot(props: any) {
  const { cx, cy, index, featured } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#FFFFFF"
      stroke={
        featured
          ? index === 1
            ? "#FFFFFF"
            : "#BFDBFE"
          : index === 1
            ? COLORS.curDot
            : COLORS.prevDot
      }
      strokeWidth={2.5}
    />
  );
}

function CustomLabel(props: any) {
  const { x, y, value, index, featured } = props;
  if (x === undefined || y === undefined || value === undefined) return null;
  return (
    <text
      x={x}
      y={y - 9}
      textAnchor="middle"
      className={[
        "fill-current font-display text-[12px] font-extrabold",
        featured
          ? index === 1
            ? "text-white"
            : "text-blue-100"
          : index === 1
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-500 dark:text-zinc-400",
      ].join(" ")}
    >
      {fmt(Number(value))}
    </text>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Mini bar+line YoY di kartu KPI — muncul saat tahun pembanding ada data. */
export default function KpiYoYMini({
  yoy,
  metric,
  featured = false,
}: {
  yoy: KpiYoY;
  /** Nama metrik untuk tooltip, mis. "Total findings" */
  metric: string;
  featured?: boolean;
}) {
  const data = [
    { year: yoy.prevYear, n: yoy.prev },
    { year: yoy.curYear, n: yoy.cur },
  ];
  const yMax = Math.ceil(Math.max(yoy.prev, yoy.cur, 10) * 1.25);

  return (
    <div className="relative h-24 w-full min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 8, left: 8, bottom: 0 }}
          barGap={0}
          barCategoryGap="24%"
        >
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{
              fill: featured ? "#DBEAFE" : "#6B7280",
              fontSize: 10.5,
              fontWeight: 700,
            }}
            dy={2}
          />
          <YAxis hide domain={[0, yMax]} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            content={<CustomTooltip metric={metric} />}
          />
          <Bar dataKey="n" barSize={30} radius={[6, 6, 0, 0]}>
            {data.map((item, i) => (
              <Cell
                key={item.year}
                fill={
                  featured
                    ? i === 1
                      ? "rgba(255, 255, 255, 0.35)"
                      : "rgba(219, 234, 254, 0.22)"
                    : i === 1
                      ? COLORS.curBar
                      : COLORS.prevBar
                }
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="n"
            stroke={featured ? "#FFFFFF" : COLORS.line}
            strokeWidth={2.5}
            dot={<CustomDot featured={featured} />}
            activeDot={<CustomDot featured={featured} />}
            label={<CustomLabel featured={featured} />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
