"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { TabOverview } from "./TabOverview";
import { useFilters } from "../context/FilterContext";
import {
  ProjectDataProvider,
  useProjectData,
} from "../context/ProjectDataContext";
import { withPreservedQuery } from "../utils/navigation";
import type { DashboardViewModel } from "../types/types";

export const PIC_MONITORING_TAB_ROUTES = [
  "/dashboard/pic-monitoring",
  "/dashboard/pic-monitoring/pipelines",
  "/dashboard/pic-monitoring/sla",
  "/dashboard/pic-monitoring/kategori",
  "/dashboard/pic-monitoring/projects",
] as const;

function OverviewView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { month } = useFilters();
  const {
    businessDataset,
    operationalProjects,
    masterProjects,
    startYear,
    endYear,
  } = useProjectData();

  return (
    <TabOverview
      dataset={businessDataset}
      filteredProjects={operationalProjects}
      slaProjects={masterProjects}
      startYear={startYear}
      endYear={endYear}
      month={month}
      onNavigateToTab={(index: number) => {
        const href = PIC_MONITORING_TAB_ROUTES[index];
        if (href) {
          router.push(withPreservedQuery(href, searchParams));
        }
      }}
    />
  );
}

export default function OverviewClient({
  data,
}: {
  data?: DashboardViewModel;
}) {
  if (data) {
    return (
      <ProjectDataProvider data={data}>
        <OverviewView />
      </ProjectDataProvider>
    );
  }

  return <OverviewView />;
}
