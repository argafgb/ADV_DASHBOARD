"use client";

import { useState } from "react";
import { useFilters } from "@/context/HelpdeskFilterContext";
import { cn } from "@/lib/utils";
import SectionToggle from "@/components/ui/section-toggle";
import { getPeriodLabel } from "../utils/overview-utils";
import {
  CombinedSLAMetricsData,
  SlaMetric,
  CombinedOverallSLAData,
} from "../types/slaMetric.types";
import { TotalTicketDistribution } from "../types/totalTicket.types";
import { RatingsDistribution } from "../types/ratingDistribution.types";
import { DispatcherReopenStats } from "@/features/helpdesk/sla-performance/services/dispatcherTicketService";
import SlaMetricCard from "@/features/helpdesk/sla-performance/components/SlaMetricCard";
import TotalTicketDistributionCard from "./TotalTicketDistributionCard";
import RatingsDistributionCard from "./RatingsDistributionCard";
import AvgDispatcherCard from "./AvgDispatcherCard";
import TicketReopenCard from "./TicketReopenCard";

interface OverviewDashboardClientProps {
  slaMetrics: CombinedSLAMetricsData;
  totalTicketDistribution: TotalTicketDistribution;
  ratingDistribution: RatingsDistribution;
  overallSLA: CombinedOverallSLAData;
  dispatcherReopenData: DispatcherReopenStats;
}

export function OverviewDashboardClient({
  slaMetrics,
  totalTicketDistribution,
  ratingDistribution,
  overallSLA,
  dispatcherReopenData,
}: OverviewDashboardClientProps) {
  const { dctResolve, dctResponse, itResolve, itResponse } = slaMetrics;
  const { dept, year, month } = useFilters();
  const [ringkasanOpen, setRingkasanOpen] = useState(true);
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  const period = getPeriodLabel(month, year);

  const activeResolve: SlaMetric =
    dept === "IT Support"
      ? itResolve
      : dept === "DCT Support"
        ? dctResolve
        : overallSLA.resolve;

  const activeResponse: SlaMetric =
    dept === "IT Support"
      ? itResponse
      : dept === "DCT Support"
        ? dctResponse
        : overallSLA.response;

  return (
    <div className="flex flex-col gap-6 bg-[#F5F6FA]">
      {/* BREAKDOWN SLA METRICS BY DEPARTMENT */}
      <div className="rounded-2xl bg-[#F5F6FA]">
        <SectionToggle
          open={breakdownOpen}
          onToggle={() => setBreakdownOpen((o) => !o)}
          label="Breakdown SLA Metrics By Department"
          hint="(selalu menampilkan kedua departemen)"
        />

        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            breakdownOpen
              ? "mt-2 grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* IT Support Group */}
              <div className="rounded-2xl border border-zinc-200 bg-[#F5F6FA] p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  IT Support
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SlaMetricCard
                    title="Problem Resolve"
                    metric={{
                      percentage: itResolve.percentage,
                      achieved: itResolve.achieved,
                      missed: itResolve.missed,
                      target: 0.999,
                      missedTickets: itResolve.missedTickets,
                    }}
                    period={period}
                  />

                  <SlaMetricCard
                    title="Response Time"
                    metric={{
                      percentage: itResponse.percentage,
                      achieved: itResponse.achieved,
                      missed: itResponse.missed,
                      target: 0.999,
                      missedTickets: itResponse.missedTickets,
                    }}
                    period={period}
                  />
                </div>
              </div>

              {/* DCT Support Group */}
              <div className="rounded-2xl border border-zinc-200 bg-[#F5F6FA] p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  DCT Support
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SlaMetricCard
                    title="Problem Resolve"
                    metric={{
                      percentage: dctResolve.percentage,
                      achieved: dctResolve.achieved,
                      missed: dctResolve.missed,
                      target: 0.999,
                      missedTickets: dctResolve.missedTickets,
                    }}
                    period={period}
                  />

                  <SlaMetricCard
                    title="Response Time"
                    metric={{
                      percentage: dctResponse.percentage,
                      achieved: dctResponse.achieved,
                      missed: dctResponse.missed,
                      target: 0.999,
                      missedTickets: dctResponse.missedTickets,
                    }}
                    period={period}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RINGKASAN SLA & KPI */}
      <div className="rounded-2xl bg-[#F5F6FA]">
        <SectionToggle
          open={ringkasanOpen}
          onToggle={() => setRingkasanOpen((o) => !o)}
          label="Ringkasan SLA & KPI"
        />

        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            ringkasanOpen
              ? "mt-2 grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3.5 bg-[#F5F6FA] pb-1">
              {/* BARIS 1 */}
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                <TotalTicketDistributionCard
                  d={totalTicketDistribution}
                  period={period}
                  year={year}
                />

                <RatingsDistributionCard d={ratingDistribution} />
              </div>

              {/* BARIS 2 */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                <SlaMetricCard
                  title="SLA Problem Resolve"
                  metric={{
                    percentage: activeResolve.percentage,
                    achieved: activeResolve.achieved,
                    missed: activeResolve.missed,
                    target: 0.999,
                    missedTickets: activeResolve.missedTickets,
                  }}
                  period={period}
                />

                <SlaMetricCard
                  title="SLA Response Time"
                  metric={{
                    percentage: activeResponse.percentage,
                    achieved: activeResponse.achieved,
                    missed: activeResponse.missed,
                    target: 0.999,
                    missedTickets: activeResponse.missedTickets,
                  }}
                  period={period}
                />

                <AvgDispatcherCard
                  seconds={dispatcherReopenData.avgDispatcherSeconds}
                  formatted={dispatcherReopenData.avgDispatchFormatted}
                  period={period}
                />

                <TicketReopenCard
                  reopened={dispatcherReopenData.reopenedTickets}
                  total={dispatcherReopenData.totalTickets}
                  percentage={dispatcherReopenData.reopenPercentage}
                  period={period}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
