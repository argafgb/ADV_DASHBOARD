"use client";

import { useMemo, useState, useEffect, useRef } from "react";

import { useDebounce } from "@/hooks/useDebounce";
import DataTable, { type DataTableColumn } from "@/components/shared/DataTable";
import FilterSelect from "@/components/shared/FilterSelect";
import { fmt, cn } from "@/lib/utils";
import { getPaginatedCostRowsData } from "../services/costService";
import type { CostSiteRow, PaginatedCostResult } from "../types/cost.types";
import type { AssetFilterInput } from "@/types/asset-pm.types";

const ALL = "ALL";
const PAGE_SIZE = 20;

export default function CostBySiteTable({
  input,
  initialData,
}: {
  input: AssetFilterInput;
  initialData?: PaginatedCostResult;
}) {
  const [type, setType] = useState(ALL);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [isLoading, setIsLoading] = useState(false);

  const emptyData: PaginatedCostResult = {
    rows: [],
    totalCount: 0,
    totalPages: 1,
    page: 1,
    pageSize: PAGE_SIZE,
  };
  const [requestData, setRequestData] = useState<PaginatedCostResult | null>(
    null,
  );
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

    getPaginatedCostRowsData(
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
      { value: "Cabang", label: "Cabang" },
      { value: "Unit", label: "Unit" },
    ];
  }, []);

  const columns: DataTableColumn<CostSiteRow>[] = [
    {
      key: "no",
      header: "No",
      headClassName: "w-10",
      cellClassName: "text-zinc-400",
      cell: (r) => r.no,
    },
    {
      key: "site",
      header: "Site / Unit",
      cellClassName: "font-semibold text-zinc-800 dark:text-zinc-100",
      cell: (r) => r.site,
    },
    {
      key: "type",
      header: "Tipe",
      cell: (r) => {
        const isUnit = r.type === "Unit";
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              isUnit
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
                : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isUnit ? "bg-amber-500" : "bg-blue-500",
              )}
            />
            {r.type}
          </span>
        );
      },
    },
    {
      key: "ws",
      header: "Workstation",
      align: "right",
      cellClassName: "tabular-nums",
      cell: (r) => `Rp ${fmt(r.ws)}`,
    },
    {
      key: "periph",
      header: "Peripheral",
      align: "right",
      cellClassName: "tabular-nums",
      cell: (r) => `Rp ${fmt(r.periph)}`,
    },
    {
      key: "infra",
      header: "Infrastructure",
      align: "right",
      cellClassName: "tabular-nums",
      cell: (r) => `Rp ${fmt(r.infra)}`,
    },
    {
      key: "cost",
      header: "Total Biaya PM",
      align: "right",
      cellClassName:
        "font-semibold tabular-nums text-blue-600 dark:text-blue-400",
      cell: (r) => `Rp ${fmt(r.cost)}`,
    },
  ];

  return (
    <DataTable
      title="Cost Detail By Site"
      subtitle="Biaya PM diurutkan tertinggi"
      rows={data.rows}
      columns={columns}
      getRowId={(r) => r.site}
      getSearchText={(r) => `${r.site} ${r.type}`}
      searchPlaceholder="Cari site..."
      filters={
        <FilterSelect
          label="Tipe"
          aria-label="Filter tipe site"
          value={type}
          onValueChange={(val) => {
            setType(val);
            setPage(1);
          }}
          options={typeOptions}
        />
      }
      searchValue={search}
      onSearchChange={(val) => {
        setSearch(val);
        setPage(1);
      }}
      onReset={() => {
        setType(ALL);
        setPage(1);
        setSearch("");
      }}
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
