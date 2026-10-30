"use client";

import { Card } from "@/components/ui/card";
import SinglePointOverlay from "@/components/ui/SinglePointOverlay";
import SourceHint from "@/components/ui/SourceHint";
import { fmtId } from "@/features/bug-tracker/issues-data/utils/issuesDataUtils";
import { RechartsTip } from "@/components/chart-tooltip";
import { FoundVsClosedData } from "../types/issuesByProject";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const FOUND_COLOR = "#2563eb";
const CLOSED_COLOR = "#10b981";

interface FoundVsClosedCardProps {
  data: FoundVsClosedData;
  /** Tahun yang ditampilkan kartu ini */
  year: number;
  /** Batas atas sumbu Y, disamakan dengan kartu pembanding */
  yMax: number;
  /** Kartu pembanding tahun lalu tampil lebih redup */
  variant?: "current" | "previous";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label, year }: any) {
  if (!active || !payload?.length) return null;
  return (
    <RechartsTip
      title={`${label} ${year}`}
      rows={payload.map((entry: any) => ({
        color: entry.color,
        label: entry.name,
        value:
          entry.value === null || entry.value === undefined
            ? "–"
            : fmtId(entry.value),
      }))}
    />
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function FoundVsClosedCard({
  data,
  year,
  yMax,
  variant = "current",
}: FoundVsClosedCardProps) {
  const isPrev = variant === "previous";
  // Dua kartu dirender bersamaan, jadi id gradient harus unik per tahun.
  const foundGrad = `fvcFound-${year}`;
  const closedGrad = `fvcClosed-${year}`;

  return (
    <Card className="flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white px-4.5 py-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 font-sans select-none">
      <div className="flex flex-wrap items-start gap-3.5">
        <div className="min-w-0">
          <h3
            className={`flex items-center gap-2 text-sm font-bold ${
              isPrev
                ? "text-zinc-500 dark:text-zinc-400"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            Found vs closed
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold font-display ${
                isPrev
                  ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {year}
            </span>
            <SourceHint
              fields={[
                {
                  label: `Ditemukan (kumulatif ${year})`,
                  field: "Periode (Year + Month)",
                  rule: `Jumlah record per bulan yang Periode-nya bertahun ${year}, ditumpuk dari Januari.`,
                },
                {
                  label: `Selesai (kumulatif ${year})`,
                  field: "Finish Date",
                  rule: `Jumlah record yang Finish Date-nya jatuh di tahun ${year}, dikelompokkan per bulan Finish Date lalu ditumpuk.`,
                },
              ]}
              notes={[
                "Satu record bisa masuk 'Ditemukan' di satu tahun dan 'Selesai' di tahun lain, jadi kedua total tidak harus sama.",
                "Sebagian record di Notion punya Finish Date lebih awal dari Periode temuannya (salah input), sehingga tidak ikut terhitung di tahun ini.",
              ]}
            />
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            {isPrev
              ? "Tahun lalu sebagai pembanding · skala sumbu disamakan"
              : "Akumulasi temuan dibanding yang sudah diselesaikan"}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-4 pt-0.75 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
            <span
              className="h-1 w-4 rounded-full"
              style={{ backgroundColor: FOUND_COLOR }}
            />
            Ditemukan
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-display">
              {fmtId(data.foundTotal)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
            <span
              className="h-1 w-4 rounded-full"
              style={{ backgroundColor: CLOSED_COLOR }}
            />
            Selesai
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-display">
              {fmtId(data.closedTotal)}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-3 min-h-48 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.points}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={foundGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={FOUND_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={FOUND_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={closedGrad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CLOSED_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CLOSED_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
              className="dark:stroke-zinc-800"
            />
            <XAxis
              dataKey="month"
              padding={{ left: 8, right: 8 }}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              minTickGap={8}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={44}
              allowDecimals={false}
              domain={[0, yMax]}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => fmtId(val)}
            />
            <Tooltip content={<CustomTooltip year={year} />} />
            <Area
              type="monotone"
              dataKey="closed"
              name="Selesai"
              stroke={CLOSED_COLOR}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${closedGrad})`}
              dot={{
                r: 3.5,
                fill: "#ffffff",
                stroke: CLOSED_COLOR,
                strokeWidth: 2,
              }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="found"
              name="Ditemukan"
              stroke={FOUND_COLOR}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${foundGrad})`}
              dot={{
                r: 3.5,
                fill: "#ffffff",
                stroke: FOUND_COLOR,
                strokeWidth: 2,
              }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
            <SinglePointOverlay
              data={data.points}
              xKey="month"
              series={[
                {
                  dataKey: "closed",
                  color: CLOSED_COLOR,
                  fill: true,
                  format: fmtId,
                },
                {
                  dataKey: "found",
                  color: FOUND_COLOR,
                  fill: true,
                  format: fmtId,
                },
              ]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
