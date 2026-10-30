import React from "react";
import { connection } from "next/server";
import { getDashboardViewData } from "@/features/pic-monitoring/services/dashboard-view-data";
import { FilterProvider } from "@/features/pic-monitoring/context/FilterContext";
import { UploadOverrideProvider } from "@/features/pic-monitoring/context/UploadOverrideContext";
import { ProjectDataProvider } from "@/features/pic-monitoring/context/ProjectDataContext";
import { PicMonitoringTopbarFilters } from "@/features/pic-monitoring/components/PicMonitoringTopbarFilters";
import "@/features/pic-monitoring/pic-monitoring.css";

export default async function PicMonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const currentYear = new Date().getFullYear();
  const initialData = await getDashboardViewData(currentYear).catch((err) => {
    console.error("[PicMonitoringLayout] Failed to load initial data:", err);
    return null;
  });

  return (
    <FilterProvider lastUpdated={initialData?.lastUpdated ?? "Belum tersedia"}>
      <UploadOverrideProvider>
        <ProjectDataProvider initialData={initialData}>
          <PicMonitoringTopbarFilters />
          <div className="pic-monitoring-scope w-full min-w-0">
            {children}
          </div>
        </ProjectDataProvider>
      </UploadOverrideProvider>
    </FilterProvider>
  );
}
