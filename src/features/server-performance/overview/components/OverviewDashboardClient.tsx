"use client";

import { FullOverviewDashboardData } from "../types/overviewTypes";
import OverallUptimeCard from "./OverallUptimeCard";
import OverallDowntimeCard from "./OverallDowntimeCard";
import IncidentsBreakdownCard from "./IncidentsBreakdownCard";
import RecentIncidentsCard from "./RecentIncidentsCard";
import UptimeTrendChart from "./UptimeTrendChart";

interface OverviewDashboardClientProps {
  data: FullOverviewDashboardData;
  year: string;
  month: string;
}

export default function OverviewDashboardClient({
  data,
  year,
}: OverviewDashboardClientProps) {
  const { row1, row2, row3 } = data;

  return (
    <div className="w-full space-y-4 font-sans select-none">
      {/* Row 1: Overall System Uptime & Overall System Downtime */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OverallUptimeCard
          sla={row1.metrics.availabilitySla}
          delta={row1.metrics.availabilityDelta}
          periodLabel={row1.metrics.periodLabel}
          systems={row1.systemSlas}
        />
        <OverallDowntimeCard
          downtimeMinutes={row1.metrics.downtimeMinutes}
          delta={row1.metrics.downtimeDelta}
          periodLabel={row1.metrics.periodLabel}
          systems={row1.systemDowntimes}
        />
      </div>

      {/* Row 2: Incidents Breakdown & Recent Incidents */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <IncidentsBreakdownCard
            totalIncidents={row2.totalIncidents}
            delta={row2.incidentsDelta}
            periodLabel={row2.periodLabel}
            causes={row2.rootCauses}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentIncidentsCard
            incidents={row2.recentIncidents}
            periodLabel={row2.periodLabel}
          />
        </div>
      </div>

      {/* Row 3: Full-width Uptime Trend Chart */}
      <UptimeTrendChart
        data={row3.trendData}
        periodLabel={row3.periodLabel}
        year={year}
      />
    </div>
  );
}
