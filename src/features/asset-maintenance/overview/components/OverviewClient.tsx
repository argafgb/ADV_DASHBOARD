"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { fmt } from "@/lib/utils";
import { useAssetFilters } from "@/hooks/useAssetFilters";
import KpiCard from "@/components/shared/KpiCard";
import DonutCard from "@/components/shared/DonutCard";
import BarCard from "@/components/shared/BarCard";
import SegmentedTabs from "@/components/shared/SegmentedTabs";
import WorkstationGrowthChart from "./WorkstationGrowthChart";
import MonthlyTrendChart from "./MonthlyTrendChart";
import JadwalPmList from "./JadwalPmList";
import KomposisiPerangkatCard from "./KomposisiPerangkatCard";
import RatingsCard from "./RatingsCard";
import FeedbackDetailModal from "./FeedbackDetailModal";
import { formatOverviewKpis } from "../utils/overviewUtils";
import {
  getTotalAssetKpisData,
  getPmSummaryKpisData,
  getOverviewDonutChartsData,
  getOverviewDistributionChartsData,
  getPmScheduleData,
  getOverviewRatingData,
} from "../services/overviewService";
import type {
  OverviewKpis,
  Section1DataResult,
  OverviewDonutsResult,
  OverviewBottomChartsResult,
  PmScheduleMonth,
  DeviceKpiFilter,
} from "../types/overview.types";
import type { KpiDatum } from "@/types/asset-pm.types";
import {
  KpiGridSkeleton,
  GrowthChartSkeleton,
  DonutCardSkeleton,
  MonthlyTrendChartSkeleton,
  Top5CabangSkeleton,
  KomposisiPerangkatSkeleton,
  JadwalPmSkeleton,
  RatingsCardSkeleton,
} from "./skeletons/OverviewSkeletons";

function total(slices: { value: number }[]): string {
  return fmt(slices.reduce((s, x) => s + x.value, 0));
}

/** KPIs shown in the highlighted top section (order matches the prototype). */
const ASSET_KPI_LABELS = [
  "Total Asset",
  "Total Workstation",
  "Total Peripheral",
  "Total Infrastructure",
];

const DEVICE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "workstation", label: "Workstation" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "peripheral", label: "Peripheral" },
];

interface OverviewClientProps {
  overviewKpis?: OverviewKpis;
  section1Data?: Section1DataResult;
  initialSection2Kpis?: KpiDatum[];
  initialDonuts?: OverviewDonutsResult;
  initialBottomCharts?: OverviewBottomChartsResult;
  initialPmSchedule?: PmScheduleMonth[];
  initialRating?: number;
}

export default function OverviewClient({
  overviewKpis,
  section1Data,
  initialSection2Kpis,
  initialDonuts,
  initialBottomCharts,
  initialPmSchedule,
  initialRating,
}: OverviewClientProps) {
  const { input } = useAssetFilters();
  const [device, setDevice] = useState<DeviceKpiFilter>("ALL");
  const [isPending, startTransition] = useTransition();

  const [sec1Data, setSec1Data] = useState<Section1DataResult | undefined>(
    section1Data,
  );
  const [isSec1Loading, setIsSec1Loading] = useState(!section1Data);

  const [section2Kpis, setSection2Kpis] = useState<KpiDatum[]>(
    initialSection2Kpis || [],
  );
  const [isSec2Loading, setIsSec2Loading] = useState(!initialSection2Kpis);

  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [isRatingLoading, setIsRatingLoading] = useState(
    initialRating === undefined,
  );
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [donuts, setDonuts] = useState<OverviewDonutsResult | undefined>(
    initialDonuts,
  );
  const [isDonutsLoading, setIsDonutsLoading] = useState(!initialDonuts);

  const [bottomCharts, setBottomCharts] = useState<
    OverviewBottomChartsResult | undefined
  >(initialBottomCharts);
  const [isBottomLoading, setIsBottomLoading] = useState(!initialBottomCharts);

  const [pmSchedule, setPmSchedule] = useState<PmScheduleMonth[] | undefined>(
    initialPmSchedule,
  );
  const [isScheduleLoading, setIsScheduleLoading] =
    useState(!initialPmSchedule);

  const hasInitialData = Boolean(
    section1Data &&
    initialSection2Kpis &&
    initialDonuts &&
    initialBottomCharts &&
    initialPmSchedule &&
    initialRating !== undefined,
  );

  const filterKey = `${input.year}-${input.month}-${input.site}-${input.company}-${device}`;
  const lastFetchedFilterKey = useRef<string | null>(
    hasInitialData ? filterKey : null,
  );

  // Sync with global input filter changes
  useEffect(() => {
    if (lastFetchedFilterKey.current === filterKey) {
      return;
    }
    lastFetchedFilterKey.current = filterKey;

    let isMounted = true;

    startTransition(async () => {
      const [sec1Res, sec2Res, donutsRes, bottomRes, scheduleRes, ratingRes] =
        await Promise.all([
          getTotalAssetKpisData(input, "ALL"),
          getPmSummaryKpisData(input, device),
          getOverviewDonutChartsData(input, device),
          getOverviewDistributionChartsData(input, device),
          getPmScheduleData(input, device),
          getOverviewRatingData(input),
        ]);

      if (isMounted) {
        if (sec1Res) setSec1Data(sec1Res);
        if (sec2Res) setSection2Kpis(sec2Res);
        if (donutsRes) setDonuts(donutsRes);
        if (bottomRes) setBottomCharts(bottomRes);
        if (scheduleRes) setPmSchedule(scheduleRes);
        if (ratingRes !== undefined) setRating(ratingRes);
        setIsSec1Loading(false);
        setIsSec2Loading(false);
        setIsDonutsLoading(false);
        setIsBottomLoading(false);
        setIsScheduleLoading(false);
        setIsRatingLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [input, device, filterKey]);

  // Handle local device tab filter change smoothly using transition
  const handleDeviceChange = (newDevice: DeviceKpiFilter) => {
    setDevice(newDevice);
    startTransition(async () => {
      const [sec2Res, donutsRes, bottomRes, scheduleRes] = await Promise.all([
        getPmSummaryKpisData(input, newDevice),
        getOverviewDonutChartsData(input, newDevice),
        getOverviewDistributionChartsData(input, newDevice),
        getPmScheduleData(input, newDevice),
      ]);
      if (sec2Res) setSection2Kpis(sec2Res);
      if (donutsRes) setDonuts(donutsRes);
      if (bottomRes) setBottomCharts(bottomRes);
      if (scheduleRes) setPmSchedule(scheduleRes);
    });
  };

  const kpis = overviewKpis ? formatOverviewKpis(overviewKpis) : [];
  const section1Kpis = sec1Data?.kpis;
  const growthData = sec1Data?.growth;

  const assetKpis: KpiDatum[] = section1Kpis
    ? [
        { label: "Total Asset", value: section1Kpis.totalAsset, icon: "grid" },
        {
          label: "Total Workstation",
          value: section1Kpis.totalWorkstation,
          icon: "monitor",
        },
        {
          label: "Total Peripheral",
          value: section1Kpis.totalPeripheral,
          icon: "layers",
        },
        {
          label: "Total Infrastructure",
          value: section1Kpis.totalInfrastructure,
          icon: "building",
        },
      ]
    : ASSET_KPI_LABELS.map((label) => kpis.find((k) => k.label === label))
        .filter((k): k is KpiDatum => Boolean(k))
        .map((k) => ({ ...k, deltaPct: undefined }));

  const secondaryKpis =
    section2Kpis.length >= 3 ? section2Kpis.slice(0, 3) : section2Kpis;

  const pmCompletion = donuts?.pmCompletion ?? [];
  const temuanVsBersih = donuts?.temuanVsBersih ?? [];
  const statusTemuan = donuts?.statusTemuan ?? [];

  return (
    <div className="space-y-4">
      {/* Section 1 — REAL data from pm_asset_it_detail (asset KPIs + growth chart) */}
      {isSec1Loading && !sec1Data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <KpiGridSkeleton count={4} />
          <GrowthChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assetKpis.map((stat) => (
              <KpiCard
                key={stat.label}
                stat={stat}
                variant={stat.label === "Total Asset" ? "primary" : "default"}
              />
            ))}
          </div>
          <WorkstationGrowthChart input={input} data={growthData} />
        </div>
      )}

      {/* Section 2 — device-type local filter + secondary KPIs + Asset Condition Rating */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Filter berdasarkan tipe perangkat
          </span>
          <SegmentedTabs
            aria-label="Filter berdasarkan tipe perangkat"
            value={device}
            onChange={(v) => handleDeviceChange(v as DeviceKpiFilter)}
            options={DEVICE_OPTIONS}
          />
        </div>
        {isSec2Loading && !initialSection2Kpis ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiGridSkeleton count={3} />
            <RatingsCardSkeleton />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 transition-opacity ${
              isPending ? "opacity-60" : "opacity-100"
            }`}
          >
            {secondaryKpis.map((stat) => (
              <KpiCard key={stat.label} stat={stat} />
            ))}
            {isRatingLoading && initialRating === undefined ? (
              <RatingsCardSkeleton />
            ) : (
              <RatingsCard
                rating={rating}
                onClick={() => setIsFeedbackModalOpen(true)}
              />
            )}
          </div>
        )}
      </div>

      {/* Donuts + Monthly Trend */}
      {isDonutsLoading && !initialDonuts ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <DonutCardSkeleton />
            <DonutCardSkeleton />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <DonutCardSkeleton />
            <div className="lg:col-span-2">
              <MonthlyTrendChartSkeleton />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`space-y-4 transition-opacity ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <DonutCard
              title="Status Penyelesaian PM per Site"
              subtitle="Progres pelaksanaan pemeliharaan preventif"
              slices={pmCompletion}
              centerValue={total(pmCompletion)}
              centerLabel="Total Site"
              showTotal={false}
            />
            <DonutCard
              title="Site dengan Temuan vs Bersih"
              subtitle="Distribusi kondisi cabang"
              slices={temuanVsBersih}
              centerValue={total(temuanVsBersih)}
              centerLabel="Total Site"
              showTotal={false}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DonutCard
              title="Distribusi Status Temuan"
              subtitle="Status penanganan dan resolusi temuan"
              slices={statusTemuan}
              centerValue={total(statusTemuan)}
              centerLabel="Total Temuan"
              showTotal={false}
            />
            <div className="lg:col-span-2">
              <MonthlyTrendChart input={input} data={donuts?.monthlyTrend} />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Charts */}
      {isBottomLoading && !initialBottomCharts ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Top5CabangSkeleton />
          <KomposisiPerangkatSkeleton />
        </div>
      ) : (
        <div
          className={`grid gap-4 lg:grid-cols-2 transition-opacity ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
          <BarCard
            title="5 Cabang dengan Temuan Terbanyak"
            subtitle="Urutan cabang berdasarkan jumlah temuan"
            items={bottomCharts?.top5Cabang ?? []}
          />
          <KomposisiPerangkatCard items={bottomCharts?.komposisiPerangkat} />
        </div>
      )}

      {/* Jadwal PM List */}
      {isScheduleLoading && !initialPmSchedule ? (
        <JadwalPmSkeleton />
      ) : (
        <div
          className={`transition-opacity ${
            isPending ? "opacity-60" : "opacity-100"
          }`}
        >
          <JadwalPmList input={input} schedule={pmSchedule} />
        </div>
      )}

      {/* Feedback Detail Modal */}
      {isFeedbackModalOpen && (
        <FeedbackDetailModal
          open={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          input={input}
          overallRating={rating}
        />
      )}
    </div>
  );
}
