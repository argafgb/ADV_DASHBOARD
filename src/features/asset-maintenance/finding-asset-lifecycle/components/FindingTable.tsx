"use client";

import { useMemo, useState } from "react";
import { Layers, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/shared/DataTable";
import FilterSelect from "@/components/shared/FilterSelect";
import StatusBadge, { type BadgeSpec } from "@/components/ui/StatusBadge";
import type { PaginatedFindingResult } from "../services/findingsService";
import type { FindingRow } from "../types/findings.types";
import type { AssetFilterInput, FindingStatus } from "@/types/asset-pm.types";

const ALL = "ALL";

function statusSpec(status: FindingStatus): BadgeSpec {
  switch (status) {
    case "Selesai":
      return { variant: "success", label: status };
    case "Dalam Proses":
      return { variant: "warning", label: status };
    default:
      return { variant: "error", label: status };
  }
}

export default function FindingTable({
  paginatedData,
  onPageChange,
  page = 1,
  searchValue = "",
  onSearchChange,
  isLoading = false,
}: {
  input?: AssetFilterInput;
  paginatedData?: PaginatedFindingResult;
  onPageChange?: (newPage: number) => void;
  page?: number;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  isLoading?: boolean;
}) {
  const [kategori, setKategori] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const rawRows = useMemo(() => paginatedData?.data ?? [], [paginatedData]);
  const totalCount = paginatedData ? paginatedData.total : 0;
  const totalPages = paginatedData ? paginatedData.totalPages : 1;

  const kategoriOptions = useMemo(
    () => [
      { value: ALL, label: "All Kategori" },
      ...[...new Set(rawRows.map((r) => r.kategori))].map((k) => ({
        value: k,
        label: k,
      })),
    ],
    [rawRows],
  );

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All Status" },
      ...[...new Set(rawRows.map((r) => r.status))].map((s) => ({
        value: s,
        label: s,
      })),
    ],
    [rawRows],
  );

  const rows = rawRows.filter(
    (r) =>
      (kategori === ALL || r.kategori === kategori) &&
      (status === ALL || r.status === status),
  );

  const columns: DataTableColumn<FindingRow>[] = [
    {
      key: "no",
      header: "No",
      align: "center",
      cellClassName:
        "whitespace-nowrap tabular-nums text-xs text-zinc-400 text-center w-10",
      cell: (_, idx) => (page - 1) * 10 + idx + 1,
    },
    {
      key: "barcode",
      header: "ID Barcode",
      cellClassName: "whitespace-nowrap tabular-nums text-xs text-zinc-500",
      cell: (r) => r.barcode,
    },
    {
      key: "periode",
      header: "Periode",
      cellClassName: "whitespace-nowrap text-zinc-500",
      cell: (r) => r.periode,
    },
    {
      key: "branch",
      header: "Branch / Divisi",
      cellClassName:
        "whitespace-nowrap font-medium text-zinc-800 dark:text-zinc-100",
      cell: (r) => r.branch,
    },
    {
      key: "device",
      header: "Device",
      cellClassName: "text-zinc-500",
      cell: (r) => r.device,
    },
    {
      key: "kategori",
      header: "Kategori / Event",
      cellClassName: "text-zinc-500",
      cell: (r) => r.kategori,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge spec={statusSpec(r.status)} />,
    },
  ];

  return (
    <DataTable
      title="Detail temuan & lifecycle"
      subtitle={`${totalCount} baris · klik baris / detail untuk rincian problem & tindakan IT`}
      rows={rows}
      columns={columns}
      getRowId={(r) =>
        r.id || `${r.barcode}-${r.periode}-${r.branch}-${r.kategori}`
      }
      getSearchText={(r) =>
        `${r.barcode} ${r.branch} ${r.device} ${r.kategori} ${r.problem} ${r.action} ${r.status}`
      }
      searchPlaceholder="Cari temuan…"
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isLoading={isLoading}
      pagination={true}
      currentPage={page}
      totalPages={totalPages}
      pageSize={10}
      totalCount={totalCount}
      onPageChange={onPageChange}
      singleExpand={true}
      defaultExpandFirst={true}
      renderDetail={(r) => (
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <AlertCircle size={14} /> Problem (Deskripsi Masalah)
            </div>
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {r.problem || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Wrench size={14} /> Action IT (Tindakan)
            </div>
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {r.action || "-"}
            </p>
          </div>
        </div>
      )}
      filters={
        <>
          <FilterSelect
            aria-label="Filter kategori temuan"
            value={kategori}
            onValueChange={setKategori}
            options={kategoriOptions}
            icon={<Layers size={14} className="text-zinc-400" />}
          />
          <FilterSelect
            aria-label="Filter status temuan"
            value={status}
            onValueChange={setStatus}
            options={statusOptions}
            icon={<CheckCircle2 size={14} className="text-zinc-400" />}
          />
        </>
      }
      onReset={() => {
        setKategori(ALL);
        setStatus(ALL);
        onSearchChange?.("");
      }}
    />
  );
}
