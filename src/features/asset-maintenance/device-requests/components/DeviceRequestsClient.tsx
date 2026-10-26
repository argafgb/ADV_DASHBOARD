"use client";

import { useMemo, useState } from "react";
import { MapPinned, Network, SlidersHorizontal, RotateCcw } from "lucide-react";
import FilterSelect from "@/components/shared/FilterSelect";
import { useAssetFilters } from "@/hooks/useAssetFilters";
import { parseMonthFilter } from "@/lib/filter-utils";
import type {
  DeviceRequestStatusFilter,
  DeviceRequestType,
  DeviceRequestTypeFilter,
  DeviceRequestsData,
} from "../types";
import {
  MONTH_FULL,
  TYPE_META,
  deriveDeviceRequestsModel,
} from "../utils/deviceRequestsTransformer";
import DeviceRequestKpis from "./DeviceRequestKpis";
import {
  MonthlyRequestTrendChart,
  RegionRequestBarChart,
} from "./DeviceRequestCharts";
import SiteScheduleMatrix from "./SiteScheduleMatrix";
import RequestDetailTable from "./RequestDetailTable";

const ALL = "ALL";

export default function DeviceRequestsClient({
  data,
}: {
  data: DeviceRequestsData;
}) {
  const { year, month, site, company } = useAssetFilters();
  const [region, setRegion] = useState<string>(ALL);
  const [status, setStatus] = useState<DeviceRequestStatusFilter>("all");
  const [type, setType] = useState<DeviceRequestTypeFilter>("all");

  const model = useMemo(
    () =>
      deriveDeviceRequestsModel({
        items: data.items,
        year,
        month,
        site,
        company,
        region,
        status,
        type,
      }),
    [data.items, year, month, site, company, region, status, type],
  );

  const parsedMonth = parseMonthFilter(month);
  const selectedMonths = parsedMonth.isAll ? [] : parsedMonth.months;

  const scopeLabel = [
    site !== ALL ? site : region !== ALL ? `Region ${region}` : "Semua cabang",
    company && company !== ALL ? company : null,
    parsedMonth.isAll
      ? null
      : parsedMonth.months.length === 1
        ? MONTH_FULL[parsedMonth.months[0] - 1]
        : `${MONTH_FULL[parsedMonth.startMonth - 1]} – ${MONTH_FULL[parsedMonth.endMonth - 1]}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const regionOptions = [
    { value: ALL, label: "Semua Region" },
    ...model.regionOptions.map((r) => ({ value: r, label: r })),
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "Penambahan", label: "Penambahan" },
    { value: "Pergantian", label: "Pergantian" },
  ];

  const typeOptions = [
    { value: "all", label: "Semua Jenis" },
    ...(Object.keys(TYPE_META) as DeviceRequestType[]).map((t) => ({
      value: t,
      label: TYPE_META[t].label,
    })),
  ];

  const filtersActive = region !== ALL || status !== "all" || type !== "all";
  const toggleType = (t: DeviceRequestType) =>
    setType((cur) => (cur === t ? "all" : t));
  const toggleRegion = (r: string) =>
    setRegion((cur) => (cur === r ? ALL : r));

  return (
    <div className="space-y-4">
      {/* Local Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Filter Halaman
          </p>
          <p className="text-[11px] text-zinc-400">
            Berlaku untuk KPI, grafik, jadwal & detail permintaan · mengikuti
            filter global
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Region"
            aria-label="Filter region"
            value={region}
            onValueChange={setRegion}
            options={regionOptions}
            icon={<MapPinned size={14} className="text-zinc-400" />}
          />
          <FilterSelect
            label="Status"
            aria-label="Filter status"
            value={status}
            onValueChange={(v) => setStatus(v as DeviceRequestStatusFilter)}
            options={statusOptions}
            icon={<SlidersHorizontal size={14} className="text-zinc-400" />}
          />
          <FilterSelect
            label="Jenis"
            aria-label="Filter jenis perangkat"
            value={type}
            onValueChange={(v) => setType(v as DeviceRequestTypeFilter)}
            options={typeOptions}
            icon={<Network size={14} className="text-zinc-400" />}
          />
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setRegion(ALL);
                setStatus("all");
                setType("all");
              }}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <DeviceRequestKpis
        model={model}
        scopeLabel={scopeLabel}
        activeType={type}
        onTypeToggle={toggleType}
      />

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyRequestTrendChart model={model} activeType={type} />
        <RegionRequestBarChart
          model={model}
          activeType={type}
          activeRegion={region}
          onRegionToggle={toggleRegion}
        />
      </div>

      {/* Site Schedule Matrix (12 Months) */}
      <SiteScheduleMatrix model={model} selectedMonths={selectedMonths} />

      {/* Detail Table */}
      <RequestDetailTable
        key={`${region}-${status}-${type}-${month}-${site}-${company}`}
        rows={model.details}
      />
    </div>
  );
}
