"use client";

import DataTable, { type DataTableColumn } from "@/components/shared/DataTable";
import { cn } from "@/lib/utils";
import type { DeviceRequestItem } from "../types";
import RequestChip from "./RequestChip";

function formatDate(isoDate: string): string {
  if (!isoDate) return "-";
  const [y, m, d] = isoDate.split("-");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const mIdx = parseInt(m, 10) - 1;
  return `${d} ${monthNames[mIdx] || m} ${y}`;
}

export default function RequestDetailTable({
  rows,
}: {
  rows: DeviceRequestItem[];
}) {
  const columns: DataTableColumn<DeviceRequestItem>[] = [
    {
      key: "no",
      header: "No",
      headClassName: "w-10",
      cellClassName: "text-zinc-400 tabular-nums",
      cell: (_, idx) => idx + 1,
    },
    {
      key: "date",
      header: "Tanggal",
      cellClassName: "whitespace-nowrap tabular-nums text-zinc-600 dark:text-zinc-400",
      cell: (r) => formatDate(r.date),
    },
    {
      key: "barcode",
      header: "Barcode",
      cellClassName: "whitespace-nowrap font-mono font-medium text-xs text-zinc-700 dark:text-zinc-300",
      cell: (r) => (
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
          {r.barcode}
        </span>
      ),
    },
    {
      key: "assetName",
      header: "Perangkat / Model",
      cellClassName: "font-semibold text-zinc-800 dark:text-zinc-100",
      cell: (r) => r.assetName,
    },
    {
      key: "type",
      header: "Tipe",
      cellClassName: "whitespace-nowrap",
      cell: (r) => <RequestChip type={r.type} />,
    },
    {
      key: "site",
      header: "Cabang / Unit",
      cellClassName: "whitespace-nowrap",
      cell: (r) => (
        <div>
          <div className="font-medium text-zinc-800 dark:text-zinc-100">
            {r.site}
          </div>
          <div className="text-[11px] text-zinc-400">
            {r.region} · {r.intended}
          </div>
        </div>
      ),
    },
    {
      key: "company",
      header: "Perusahaan",
      cellClassName: "whitespace-nowrap text-xs",
      cell: (r) => (
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-semibold",
            r.company === "Advantage"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : r.company === "Etrama"
                ? "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
          )}
        >
          {r.company}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "whitespace-nowrap",
      cell: (r) => {
        const isPenambahan = r.status === "Penambahan";
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              isPenambahan
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isPenambahan ? "bg-blue-500" : "bg-amber-500",
              )}
            />
            {r.status}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      title="Detail Permintaan Perangkat"
      subtitle="Daftar pemenuhan perangkat IT jaringan per tanggal dan cabang"
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      getSearchText={(r) =>
        `${r.barcode} ${r.assetName} ${r.site} ${r.intended} ${r.region} ${r.status} ${r.type} ${r.company}`
      }
      searchPlaceholder="Cari barcode, perangkat, cabang..."
      emptyMessage="Tidak ada permintaan perangkat untuk filter ini."
      pagination
      pageSize={10}
    />
  );
}
