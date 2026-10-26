"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { FilterProvider } from "@/context/FilterContext";
import DashboardPanelLayout from "@/components/dashboard-panel/dashboard-panel-layout";
import BrowseDashboardModal from "@/components/BrowseDashboardModal";
import ScrollToTop from "@/components/ScrollToTop";
import type { SiteOption } from "@/types/asset-pm.types";

export default function DashboardClientWrapper({
  children,
  initialSiteOptions,
  lastUpdated,
}: {
  children: React.ReactNode;
  initialSiteOptions?: SiteOption[];
  lastUpdated: string;
}) {
  const pathname = usePathname();
  const [modalPathname, setModalPathname] = useState<string | null>(null);
  const isDashModalOpen = modalPathname === pathname;

  return (
    <FilterProvider
      initialSiteOptions={initialSiteOptions}
      lastUpdated={lastUpdated}
    >
      <DashboardPanelLayout onOpenDashModal={() => setModalPathname(pathname)}>
        {children}
      </DashboardPanelLayout>
      <ScrollToTop />
      {isDashModalOpen && (
        <BrowseDashboardModal onClose={() => setModalPathname(null)} />
      )}
    </FilterProvider>
  );
}
