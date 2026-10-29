"use client";

type RootCauseChartItem = {
  name: string;
  tickets: number;
  color: string;
};

const COLOR_MAP: Record<string, string> = {
  violet: "#8B5CF6",
  red: "#EF4444",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  emerald: "#10B981",
  blue: "#2563EB",
};

function getColor(color: string) {
  return COLOR_MAP[color] ?? color;
}

import { formatNumber } from "../../utils/rating-root-cause-utils";

export default function RootCauseBarChart({
  data,
}: {
  data: RootCauseChartItem[];
  department?: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.tickets), 1);

  return (
    <div className="space-y-3 pt-1">
      {data.map((item) => (
        <div
          key={item.name}
          className="grid grid-cols-[minmax(72px,120px)_minmax(0,1fr)_48px] items-center gap-2 sm:grid-cols-[170px_minmax(0,1fr)_56px] sm:gap-4"
        >
          <div className="break-words text-right text-[10px] font-semibold uppercase leading-tight text-slate-500 sm:text-xs">
            {item.name}
          </div>

          <div className="h-4 rounded-full bg-slate-50">
            <div
              className="h-4 rounded-full transition-all"
              style={{
                width: `${(item.tickets / maxValue) * 100}%`,
                backgroundColor: getColor(item.color),
              }}
            />
          </div>

          <div className="text-right text-sm font-black text-slate-950">
            {formatNumber(item.tickets)}
          </div>
        </div>
      ))}
    </div>
  );
}
