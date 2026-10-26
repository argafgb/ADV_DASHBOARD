"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Monitor } from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";
import DataTable, { type DataTableColumn } from "@/components/shared/DataTable";
import FilterSelect from "@/components/shared/FilterSelect";
import { cn, fmt } from "@/lib/utils";
import { getPaginatedInventoryRowsData } from "../services/distributionService";
import type {
  InventorySiteRow,
  PaginatedInventoryResult,
} from "../types/distribution.types";
import type { AssetFilterInput } from "@/types/asset-pm.types";

const ALL = "ALL";
const PAGE_SIZE = 10;

/** Per-device-type breakdown + Biaya PM revealed when a site row is expanded. */
function InventoryDetail({ row }: { row: InventorySiteRow }) {
  return (
    <div className="px-4 py-4">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {row.detail.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.items.length > 0 ? (
                group.items.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    {item.label}
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.value}
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-zinc-400 italic">
                  Tidak ada data
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Biaya PM
        </span>
        <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
          Rp {fmt(row.biaya)}
        </span>
      </div>
    </div>
  );
}

export default function InventoryTable({
  input,
  initialData,
}: {
  input: AssetFilterInput;
  initialData?: PaginatedInventoryResult;
}) {
  const [type, setType] = useState(ALL);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const emptyData: PaginatedInventoryResult = {
    rows: [],
    totalCount: 0,
    totalPages: 1,
    page: 1,
    pageSize: PAGE_SIZE,
  };
  const [requestData, setRequestData] =
    useState<PaginatedInventoryResult | null>(null);
  const usesInitialData = page === 1 && type === ALL && !debouncedSearch;
  const data = usesInitialData
    ? (initialData ?? emptyData)
    : (requestData ?? emptyData);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (
      isInitialMount.current &&
      initialData &&
      page === 1 &&
      type === ALL &&
      !debouncedSearch
    ) {
      isInitialMount.current = false;
      return;
    }
    isInitialMount.current = false;

    let isMounted = true;
    setIsLoading(true);
    getPaginatedInventoryRowsData(
      input,
      page,
      PAGE_SIZE,
      debouncedSearch,
      type,
    ).then((res) => {
      if (isMounted) {
        if (res) setRequestData(res);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [input, page, debouncedSearch, type, initialData]);

  const typeOptions = useMemo(() => {
    return [
      { value: ALL, label: "All Type" },
      { value: "Operational", label: "Operational" },
      { value: "Unit", label: "Unit" },
    ];
  }, []);

  const columns: DataTableColumn<InventorySiteRow>[] = [
    {
      key: "no",
      header: "No",
      align: "center",
      cellClassName:
        "whitespace-nowrap tabular-nums text-xs text-zinc-400 text-center w-10",
      cell: (_, idx) => (data.page - 1) * PAGE_SIZE + (idx ?? 0) + 1,
    },
    {
      key: "site",
      header: "Nama Site / Unit",
      cellClassName:
        "whitespace-nowrap font-medium text-zinc-800 dark:text-zinc-100",
      cell: (r) => r.site,
    },
    {
      key: "type",
      header: "Tipe",
      cellClassName: "whitespace-nowrap text-zinc-500",
      cell: (r) => (
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            r.type === "Operational"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
          )}
        >
          {r.type}
        </span>
      ),
    },
    {
      key: "ws",
      header: "Workstation",
      align: "right",
      cellClassName:
        "whitespace-nowrap tabular-nums text-zinc-700 dark:text-zinc-300",
      cell: (r) => fmt(r.workstation),
    },
    {
      key: "infra",
      header: "Infrastructure",
      align: "right",
      cellClassName:
        "whitespace-nowrap tabular-nums text-zinc-700 dark:text-zinc-300",
      cell: (r) => fmt(r.infrastructure),
    },
    {
      key: "periph",
      header: "Peripheral",
      align: "right",
      cellClassName:
        "whitespace-nowrap tabular-nums text-zinc-700 dark:text-zinc-300",
      cell: (r) => fmt(r.peripheral),
    },
    {
      key: "total",
      header: "Total Perangkat",
      align: "right",
      cellClassName:
        "whitespace-nowrap tabular-nums font-semibold text-zinc-900 dark:text-zinc-50",
      cell: (r) => fmt(r.total),
    },
  ];

  return (
    <DataTable
      title="Inventory Detail by Site"
      subtitle="Klik baris untuk rincian workstation, infrastructure & peripheral"
      rows={data.rows}
      columns={columns}
      getRowId={(r) => r.site}
      getSearchText={(r) => `${r.site} ${r.type}`}
      searchPlaceholder="Cari site..."
      filters={
        <FilterSelect
          aria-label="Filter tipe site"
          value={type}
          onValueChange={(val) => {
            setType(val);
            setPage(1);
          }}
          options={typeOptions}
          icon={<Monitor size={14} className="text-zinc-400" />}
        />
      }
      searchValue={search}
      onSearchChange={(val) => {
        setSearch(val);
        setPage(1);
      }}
      onReset={() => {
        setType(ALL);
        setSearch("");
        setPage(1);
      }}
      renderDetail={(r) => <InventoryDetail row={r} />}
      isLoading={isLoading}
      pagination={true}
      currentPage={data.page}
      totalPages={data.totalPages}
      totalCount={data.totalCount}
      pageSize={data.pageSize}
      onPageChange={setPage}
    />
  );
}
