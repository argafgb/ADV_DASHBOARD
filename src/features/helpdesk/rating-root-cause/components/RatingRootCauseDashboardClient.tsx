"use client";

import { Star } from "lucide-react";
import RatingsDistributionCard from "@/features/helpdesk/overview/components/RatingsDistributionCard";
import EmptyState from "@/components/shared/EmptyState";
import type { TicketRatingData } from "../types/ticketRating.types";
import LowRatingTicketDetails from "./LowRatingTicketDetails";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { dctRootCauses, itRootCauses } from "../hooks/ratingRootCause.mock";
import { useQuarterFilter } from "@/features/helpdesk/comparison/hooks/useQuarterFilter";
import { useFilters } from "@/context/HelpdeskFilterContext";
import { formatPeriodLabel, formatDeptLabel } from "@/lib/helpdesk/period-formatter";

import type {
  Quarter,
  RatingRootCauseTab,
  RootCauseItem,
  RootCauseQueryResultRow,
  ActionITQueryResultRow,
  RootCauseChartMode,
  RootCauseColor,
  RootCauseIconKey,
} from "../types/rootCause.types";

import TopRootCauseSection from "./TopRootCauseSection";
import TotalTicketByRootCauseSection from "./TotalTicketByRootCauseSection";
import ActionITSection from "./ActionITSection";
import RootCauseDetailModal from "./RootCauseDetailModal";
import RatingFeedbackContent from "./RatingFeedbackContent";
import HierarchyProblemChart from "./charts/HierarchyProblemChart";

const quarterOptions: Quarter[] = ["All", "Q1", "Q2", "Q3", "Q4"];

function QuarterButton({
  value,
  active,
  onClick,
}: {
  value: Quarter;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-5 py-2 text-sm font-semibold transition-all cursor-pointer",
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {value}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "border-b-2 px-5 py-4 text-sm font-semibold transition-all",
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-900 cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function mapRealToItem(
  row: RootCauseQueryResultRow,
  dept: "DCT Support" | "IT Support" | "ALL",
  totalSum: number,
): RootCauseItem {
  const nameUpper = row.root_cause.toUpperCase();
  const mockList = [...dctRootCauses, ...itRootCauses];
  const matchedMock = mockList.find((m) => m.name.toUpperCase() === nameUpper);

  const colors: RootCauseColor[] = [
    "violet",
    "red",
    "cyan",
    "amber",
    "emerald",
    "blue",
  ];
  const color = colors[(row.rank - 1) % colors.length] || "violet";

  let iconKey: RootCauseIconKey = "software";
  if (nameUpper.includes("HUMAN")) iconKey = "human";
  else if (nameUpper.includes("BUG")) iconKey = "bug";
  else if (nameUpper.includes("DATA")) iconKey = "data";
  else if (nameUpper.includes("EDUCATION")) iconKey = "education";
  else if (nameUpper.includes("IMPROVEMENT")) iconKey = "improvement";

  const sharePercentage =
    totalSum > 0 ? (row.current_tickets / totalSum) * 100 : 0;

  return {
    rank: row.rank,
    name: nameUpper,
    tickets: row.current_tickets,
    growth: row.growth_percentage,
    sharePercentage,
    color,
    iconKey,
    department: dept,
    children: matchedMock ? matchedMock.children : [],
  };
}

function RootCauseContent({
  dept,
  periodLabel,
  deptLabel,
  onSelect,
  realData,
  actionITData = [],
}: {
  dept: string;
  periodLabel: string;
  deptLabel: string;
  onSelect: (item: RootCauseItem) => void;
  realData: RootCauseQueryResultRow[];
  actionITData?: ActionITQueryResultRow[];
}) {
  const [chartMode, setChartMode] = useState<RootCauseChartMode>("bar");

  const mappedDept =
    dept === "ALL"
      ? "ALL"
      : dept === "IT Support"
        ? "IT Support"
        : "DCT Support";

  const data = useMemo(() => {
    const top3TotalSum = realData
      .slice(0, 3)
      .reduce((sum, row) => sum + row.current_tickets, 0);
    return realData.map((row) => mapRealToItem(row, mappedDept, top3TotalSum));
  }, [realData, mappedDept]);

  if (realData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-200 bg-white text-center shadow-sm select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4 dark:bg-zinc-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-slate-400 dark:text-zinc-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v4.5A2.25 2.25 0 0 0 2.25 13.5Z"
            />
          </svg>
        </div>
        <h3 className="font-sans text-md font-bold text-slate-800 dark:text-zinc-200">
          Tidak Ada Data Temuan Root Cause
        </h3>
        <p className="font-sans text-xs text-slate-400 mt-2 max-w-90 leading-relaxed dark:text-zinc-500">
          Tidak ada data temuan root cause yang terekam pada filter terpilih
          ini. Silakan coba sesuaikan filter tahun, bulan, kuartal, atau
          departemen lainnya.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TopRootCauseSection data={data} onSelect={onSelect} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <TotalTicketByRootCauseSection
            data={data}
            department={mappedDept}
            periodLabel={periodLabel}
            deptLabel={deptLabel}
            mode={chartMode}
            onModeChange={setChartMode}
          />
        </div>
        <div className="xl:col-span-2">
          <ActionITSection
            data={actionITData}
            department={mappedDept}
            periodLabel={periodLabel}
            deptLabel={deptLabel}
            chartMode={chartMode}
          />
        </div>
      </div>

      <HierarchyProblemChart />
    </div>
  );
}

export default function RatingRootCauseDashboardClient({
  ratings,
  rootCausesReal = [],
  actionITReal = [],
}: {
  ratings: TicketRatingData;
  rootCausesReal?: RootCauseQueryResultRow[];
  actionITReal?: ActionITQueryResultRow[];
}) {
  const { quarter, setQuarter } = useQuarterFilter();
  const { year, month, dept } = useFilters();
  const [activeTab, setActiveTab] = useState<RatingRootCauseTab>("rootCause");
  const [selectedRootCause, setSelectedRootCause] =
    useState<RootCauseItem | null>(null);

  const activeQuarter = (
    quarter.toUpperCase() === "ALL" ? "All" : quarter
  ) as Quarter;

  const periodLabel = useMemo(() => {
    return formatPeriodLabel({ year, month, quarter: activeQuarter });
  }, [year, month, activeQuarter]);

  const deptLabel = useMemo(() => {
    return formatDeptLabel(dept);
  }, [dept]);

  return (
    <div className="space-y-5">
      {/* FILTER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">
            Pilih Quartal:
          </span>

          {quarterOptions.map((item) => (
            <QuarterButton
              key={item}
              value={item}
              active={activeQuarter === item}
              onClick={() => setQuarter(item === "All" ? "ALL" : item)}
            />
          ))}
        </div>
      </section>

      {/* TABS */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton
            active={activeTab === "rootCause"}
            onClick={() => setActiveTab("rootCause")}
          >
            Root Cause
          </TabButton>

          <TabButton
            active={activeTab === "rating"}
            onClick={() => setActiveTab("rating")}
          >
            Ticketing
          </TabButton>
          <TabButton active={activeTab === "ticketRating"} onClick={() => setActiveTab("ticketRating")}>Rating Ticket</TabButton>
        </div>
      </div>

      {/* CONTENT */}
      {activeTab === "rootCause" && (
        <RootCauseContent
          dept={dept}
          periodLabel={periodLabel}
          deptLabel={deptLabel}
          onSelect={setSelectedRootCause}
          realData={rootCausesReal}
          actionITData={actionITReal}
        />
      )}

      {activeTab === "rating" && <RatingFeedbackContent />}
      {activeTab === "ticketRating" && (
        <div className="space-y-5">
          {ratings.distTotal > 0 ? (
            <RatingsDistributionCard d={ratings} />
          ) : (
            <EmptyState
              icon={Star}
              title="Belum Ada Data Rating Ticket"
              description="Tidak ada tiket untuk filter yang dipilih."
            />
          )}
          <LowRatingTicketDetails
            key={`${year}-${month}-${quarter}-${dept}`}
            tickets={ratings.lowRatingTickets}
            filters={{ year, month, quarter, dept }}
            periodLabel={periodLabel}
          />
        </div>
      )}

      <RootCauseDetailModal
        key={`${selectedRootCause?.name}_${year}_${month}_${dept}_${quarter}`}
        item={selectedRootCause}
        onClose={() => setSelectedRootCause(null)}
      />
    </div>
  );
}
