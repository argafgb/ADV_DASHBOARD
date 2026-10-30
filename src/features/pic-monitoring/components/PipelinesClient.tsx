"use client";

import { TabPipeline } from "./TabPipeline";
import {
  ProjectDataProvider,
  useProjectData,
} from "../context/ProjectDataContext";
import type { DashboardViewModel } from "../types/types";

function PipelinesView() {
  const { businessDataset, operationalProjects, startYear, endYear } =
    useProjectData();

  return (
    <TabPipeline
      dataset={businessDataset}
      filteredProjects={operationalProjects}
      startYear={startYear}
      endYear={endYear}
    />
  );
}

export default function PipelinesClient({
  data,
}: {
  data?: DashboardViewModel;
}) {
  if (data) {
    return (
      <ProjectDataProvider data={data}>
        <PipelinesView />
      </ProjectDataProvider>
    );
  }

  return <PipelinesView />;
}
