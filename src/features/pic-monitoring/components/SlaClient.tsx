"use client";

import { TabSla } from "./TabSla";
import { useFilters } from "../context/FilterContext";
import {
  ProjectDataProvider,
  useProjectData,
} from "../context/ProjectDataContext";
import type { DashboardViewModel } from "../types/types";

function SlaView() {
  const { month } = useFilters();
  const {
    businessDataset,
    operationalProjects,
    masterProjects,
    startYear,
    endYear,
    processUploadedFile,
  } = useProjectData();

  return (
    <TabSla
      dataset={businessDataset}
      rawProjects={operationalProjects}
      slaProjects={masterProjects}
      startYear={startYear}
      endYear={endYear}
      month={month}
      onUploadFile={processUploadedFile}
    />
  );
}

export default function SlaClient({ data }: { data?: DashboardViewModel }) {
  if (data) {
    return (
      <ProjectDataProvider data={data}>
        <SlaView />
      </ProjectDataProvider>
    );
  }

  return <SlaView />;
}
