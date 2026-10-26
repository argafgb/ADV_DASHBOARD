"use client";

import { useEffect, useState, useRef } from "react";
import { useAssetFilters } from "@/hooks/useAssetFilters";
import { useDebounce } from "@/hooks/useDebounce";
import BarCard from "@/components/shared/BarCard";
import DonutCard from "@/components/shared/DonutCard";
import TrenKategoriChart from "./TrenKategoriChart";
import EventLifecycle from "./EventLifecycle";
import ReplacementNewAssetChart from "./ReplacementNewAssetChart";
import StatusResolusiPerCabang from "./StatusResolusiPerCabang";
import FindingTable from "./FindingTable";
import {
  TemuanPerKategoriSkeleton,
  TrenKategoriChartSkeleton,
  StatusResolusiSkeleton,
  EventLifecycleSkeleton,
  ReplacementNewAssetChartSkeleton,
  StatusResolusiPerCabangSkeleton,
  FindingTableSkeleton,
} from "./skeletons/FindingsSkeletons";
import {
  getTemuanPerKategoriData,
  getCategoryTrendData,
  getStatusResolusiData,
  getEventLifecycleData,
  getReplacementVsNewData,
  getStatusPerCabangData,
  getFindingRowsData,
  type PaginatedFindingResult,
} from "../services/findingsService";
import type { BarDatum, DonutSlice } from "@/types/asset-pm.types";
import type {
  BranchResolution,
  CategoryTrendPoint,
  ReplacementPoint,
} from "../types/findings.types";

interface FindingsClientProps {
  initialTemuanKategori?: BarDatum[];
  initialCategoryTrend?: CategoryTrendPoint[];
  initialStatusResolusi?: DonutSlice[];
  initialEventLifecycle?: { slices: DonutSlice[]; flaggedPct: string };
  initialReplacementVsNew?: ReplacementPoint[];
  initialStatusPerCabang?: BranchResolution[];
  initialFindingRows?: PaginatedFindingResult;
}

export default function FindingsClient({
  initialTemuanKategori,
  initialCategoryTrend,
  initialStatusResolusi,
  initialEventLifecycle,
  initialReplacementVsNew,
  initialStatusPerCabang,
  initialFindingRows,
}: FindingsClientProps = {}) {
  const { input } = useAssetFilters();
  const [tablePage, setTablePage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");
  const debouncedSearch = useDebounce(tableSearch, 300);

  const [temuanKategori, setTemuanKategori] = useState<BarDatum[] | undefined>(
    initialTemuanKategori,
  );
  const [categoryTrend, setCategoryTrend] = useState<
    CategoryTrendPoint[] | undefined
  >(initialCategoryTrend);
  const [statusResolusi, setStatusResolusi] = useState<
    DonutSlice[] | undefined
  >(initialStatusResolusi);
  const [eventLifecycle, setEventLifecycle] = useState<
    { slices: DonutSlice[]; flaggedPct: string } | undefined
  >(initialEventLifecycle);
  const [replacementVsNew, setReplacementVsNew] = useState<
    ReplacementPoint[] | undefined
  >(initialReplacementVsNew);
  const [statusPerCabang, setStatusPerCabang] = useState<
    BranchResolution[] | undefined
  >(initialStatusPerCabang);
  const [findingRows, setFindingRows] = useState<
    PaginatedFindingResult | undefined
  >(initialFindingRows);
  const [isTableLoading, setIsTableLoading] = useState(false);

  const hasInitialChartData = Boolean(
    initialTemuanKategori &&
    initialCategoryTrend &&
    initialStatusResolusi &&
    initialEventLifecycle &&
    initialReplacementVsNew &&
    initialStatusPerCabang,
  );
  const hasInitialTableData = Boolean(initialFindingRows);

  const filterKey = `${input.year}-${input.month}-${input.site}-${input.company}`;
  const lastFetchedChartFilterKey = useRef<string | null>(
    hasInitialChartData ? filterKey : null,
  );

  const tableFilterKey = `${filterKey}-${tablePage}-${debouncedSearch}`;
  const lastFetchedTableFilterKey = useRef<string | null>(
    hasInitialTableData && tablePage === 1 && !debouncedSearch
      ? tableFilterKey
      : null,
  );

  // Effect 1: Global Filter Effect for Chart Cards
  useEffect(() => {
    if (lastFetchedChartFilterKey.current === filterKey) {
      return;
    }
    lastFetchedChartFilterKey.current = filterKey;

    let isMounted = true;

    setTemuanKategori(undefined);
    setCategoryTrend(undefined);
    setStatusResolusi(undefined);
    setEventLifecycle(undefined);
    setReplacementVsNew(undefined);
    setStatusPerCabang(undefined);

    Promise.all([
      getTemuanPerKategoriData(input),
      getCategoryTrendData(input),
      getStatusResolusiData(input),
      getEventLifecycleData(input),
      getReplacementVsNewData(input),
      getStatusPerCabangData(input),
    ])
      .then(
        ([
          kategoriData,
          trendData,
          resolusiData,
          lifecycleData,
          replacementData,
          cabangData,
        ]) => {
          if (isMounted) {
            setTemuanKategori(kategoriData);
            setCategoryTrend(trendData);
            setStatusResolusi(resolusiData);
            setEventLifecycle(lifecycleData);
            setReplacementVsNew(replacementData);
            setStatusPerCabang(cabangData);
          }
        },
      )
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [input, filterKey]);

  // Effect 2: Local Table Effect for Finding Rows
  useEffect(() => {
    if (lastFetchedTableFilterKey.current === tableFilterKey) {
      return;
    }
    lastFetchedTableFilterKey.current = tableFilterKey;

    let isMounted = true;
    setIsTableLoading(true);

    getFindingRowsData(input, tablePage, 10, debouncedSearch)
      .then((rowsData) => {
        if (isMounted) {
          setFindingRows(rowsData);
          setIsTableLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching table rows:", err);
        if (isMounted) setIsTableLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [input, tablePage, debouncedSearch, tableFilterKey]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {!temuanKategori ? (
          <TemuanPerKategoriSkeleton />
        ) : (
          <BarCard
            title="Findings by Category"
            subtitle="5 kategori teratas · sisanya digabung ke Lainnya"
            items={temuanKategori}
          />
        )}

        {!categoryTrend ? (
          <TrenKategoriChartSkeleton />
        ) : (
          <TrenKategoriChart input={input} data={categoryTrend} />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {!statusResolusi ? (
          <StatusResolusiSkeleton />
        ) : (
          <DonutCard
            title="Resolution Status"
            subtitle="Distribusi status temuan"
            slices={statusResolusi}
            mode="row"
            markerShape="square"
            showPercent={false}
            showTotal={false}
          />
        )}

        {!eventLifecycle ? (
          <EventLifecycleSkeleton />
        ) : (
          <EventLifecycle input={input} data={eventLifecycle} />
        )}
      </div>

      {!replacementVsNew ? (
        <ReplacementNewAssetChartSkeleton />
      ) : (
        <ReplacementNewAssetChart input={input} data={replacementVsNew} />
      )}

      {!statusPerCabang ? (
        <StatusResolusiPerCabangSkeleton />
      ) : (
        <StatusResolusiPerCabang input={input} data={statusPerCabang} />
      )}

      {!findingRows && isTableLoading ? (
        <FindingTableSkeleton />
      ) : (
        <FindingTable
          input={input}
          paginatedData={findingRows}
          page={tablePage}
          onPageChange={setTablePage}
          searchValue={tableSearch}
          onSearchChange={(val) => {
            setTableSearch(val);
            setTablePage(1);
          }}
          isLoading={isTableLoading}
        />
      )}
    </div>
  );
}
