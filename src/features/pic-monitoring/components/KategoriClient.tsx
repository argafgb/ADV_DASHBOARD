"use client";

import { TabCategory } from "./TabCategory";
import { useFilters } from "../context/FilterContext";
import {
  ProjectDataProvider,
  useProjectData,
} from "../context/ProjectDataContext";
import type { DashboardViewModel } from "../types/types";

function KategoriView() {
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
    <TabCategory
      dataset={businessDataset}
      rawProjects={operationalProjects}
      filteredProjects={operationalProjects}
      slaProjects={masterProjects}
      startYear={startYear}
      endYear={endYear}
      month={month}
      onUploadFile={processUploadedFile}
    />
  );
}

export default function KategoriClient({
  data,
}: {
  data?: DashboardViewModel;
}) {
  if (data) {
    return (
      <ProjectDataProvider data={data}>
        <KategoriView />
      </ProjectDataProvider>
    );
  }

  return <KategoriView />;
}
