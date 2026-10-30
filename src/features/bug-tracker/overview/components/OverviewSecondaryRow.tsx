"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import SourceHint, { SourceField } from "@/components/ui/SourceHint";
import { fmt } from "@/lib/utils";
import { DistributionSeg } from "../types/overviewTypes";

interface OverviewSecondaryRowProps {
  srcSegs?: DistributionSeg[];
  fsdSegs?: DistributionSeg[];
}

function SegmentedCard({
  title,
  subtitle,
  segs,
  fields,
  notes,
}: {
  title: string;
  subtitle: string;
  segs: DistributionSeg[];
  fields: SourceField[];
  notes?: string[];
}) {
  const hasData = segs.some((s) => s.count > 0);

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          {title}
          <SourceHint fields={fields} notes={notes} />
        </h3>
        <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
          {subtitle}
        </p>
      </div>

      {/* Segmented Bar */}
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {hasData &&
          segs.map((item, idx) => (
            <div
              key={idx}
              className="h-full transition-all duration-500"
              style={{
                flexGrow: item.pct,
                backgroundColor: item.color,
              }}
            />
          ))}
      </div>

      {/* Legend */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {segs.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
            <strong className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {fmt(item.count)}
            </strong>
          </span>
        ))}
      </div>
    </Card>
  );
}

export default function OverviewSecondaryRow({
  srcSegs = [],
  fsdSegs = [],
}: OverviewSecondaryRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 font-sans select-none">
      <SegmentedCard
        title="Finding source"
        subtitle="Siapa yang menemukan temuan ini"
        segs={srcSegs}
        fields={[
          {
            label: "PIC Project / Bizdev / Belum diklasifikasi",
            field: "Section",
            rule: 'Record mengikuti nilai Section: "PIC Project" atau "Bizdev". Nilai kosong/tidak dikenal tidak boleh ditebak sebagai salah satunya.',
          },
        ]}
        notes={[
          "Total seluruh segmen selalu sama dengan Total findings pada periode ini.",
        ]}
      />
      <SegmentedCard
        title="FSD coverage"
        subtitle="Temuan yang tercakup FSD dan di luar FSD"
        segs={fsdSegs}
        fields={[
          {
            label: "Masuk FSD / Di luar FSD",
            field: "Include in FSD",
            rule: 'Checkbox Notion: tercentang berarti "Masuk FSD", tidak tercentang berarti "Di luar FSD".',
          },
          {
            label: "Belum ditandai",
            field: "Include in FSD",
            rule: "Record yang kolom ini masih kosong di Notion.",
          },
        ]}
      />
    </div>
  );
}
