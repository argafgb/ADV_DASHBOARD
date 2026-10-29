"use client";

import { useState } from "react";
import { useFilters } from "@/context/HelpdeskFilterContext";
import type { SlaPerformanceDashboardClientProps } from "../types/slaPerformance.types";
import { getPeriodLabel } from "../utils/sla-performance-utils";
import SlaMetricCard from "./SlaMetricCard";
import AvgDispatcherCard from "@/features/helpdesk/overview/components/AvgDispatcherCard";
import TicketReopenCard from "@/features/helpdesk/overview/components/TicketReopenCard";
import ReopenedTicketsModal from "./ReopenedTicketsModal";
import SlaProblemResolveChart from "./charts/SlaProblemResolveChart";
import SlaResponseTimeChart from "./charts/SlaResponseTimeChart";
import FrequencySummaryTable from "@/features/helpdesk/comparison/components/charts/FrequencySummaryTable";

export function SlaPerformanceDashboardClient({
  data,
  slaProblemTrend,
  slaResponseTrend,
}: SlaPerformanceDashboardClientProps) {
  const { year, month, dept } = useFilters();
  const [activeTab, setActiveTab] = useState<"resolve" | "response">("resolve");
  const [showReopenedTickets, setShowReopenedTickets] = useState(false);

  const period = getPeriodLabel(year, month);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SlaMetricCard
          title="Problem Resolve"
          metric={data.problemResolve}
          period={period}
        />

        <SlaMetricCard
          title="Response Time"
          metric={data.responseTime}
          period={period}
        />

        <AvgDispatcherCard
          seconds={data.avgDispatcherSeconds}
          formatted={data.avgDispatchFormatted}
          period={period}
        />

        <TicketReopenCard
          reopened={data.reopenedTickets}
          total={data.totalTickets}
          percentage={data.reopenPercentage}
          period={period}
          onClick={() => setShowReopenedTickets(true)}
        />
      </section>

      <div className="grid grid-cols-1 gap-6">
        <SlaProblemResolveChart
          data={slaProblemTrend}
          selectedYear={Number(year)}
        />

        <SlaResponseTimeChart
          data={slaResponseTrend}
          selectedYear={Number(year)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("resolve")}
            className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "resolve"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Problem Resolve Summary
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("response")}
            className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "response"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Response Time Summary
          </button>
        </div>

        <div className="space-y-5">
          {activeTab === "resolve" ? (
            <FrequencySummaryTable
              title="Summary - SLA Problem Resolve"
              data={slaProblemTrend}
              selectedYear={Number(year)}
              type="sla"
            />
          ) : (
            <FrequencySummaryTable
              title="Summary - SLA Response Time"
              data={slaResponseTrend}
              selectedYear={Number(year)}
              type="sla"
            />
          )}
        </div>
      </div>
      {showReopenedTickets && (
        <ReopenedTicketsModal
          key={`${year}-${month}-${dept}`}
          filters={{ year, month, dept }}
          total={data.reopenedTickets}
          period={period}
          onClose={() => setShowReopenedTickets(false)}
        />
      )}
    </div>
  );
}
