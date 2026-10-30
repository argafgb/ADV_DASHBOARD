"use client";

import { TabProjects } from "./TabProjects";
import {
  ProjectDataProvider,
  useProjectData,
} from "../context/ProjectDataContext";
import type { DashboardViewModel } from "../types/types";

function ProjectsView() {
  const { operationalProjects, startYear } = useProjectData();

  return (
    <TabProjects projects={operationalProjects} selectedYear={startYear} />
  );
}

export default function ProjectsClient({
  data,
}: {
  data?: DashboardViewModel;
}) {
  if (data) {
    return (
      <ProjectDataProvider data={data}>
        <ProjectsView />
      </ProjectDataProvider>
    );
  }

  return <ProjectsView />;
}
