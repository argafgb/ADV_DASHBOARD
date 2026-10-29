"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import DashboardPanelLayout from "@/components/dashboard-panel/dashboard-panel-layout";
import BrowseDashboardModal from "@/components/BrowseDashboardModal";
import ScrollToTop from "@/components/ScrollToTop";

export default function DashboardClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [modalPathname, setModalPathname] = useState<string | null>(null);
  const isDashModalOpen = modalPathname === pathname;

  return (
    <>
      <DashboardPanelLayout onOpenDashModal={() => setModalPathname(pathname)}>
        {children}
      </DashboardPanelLayout>
      <ScrollToTop />
      {isDashModalOpen && (
        <BrowseDashboardModal onClose={() => setModalPathname(null)} />
      )}
    </>
  );
}
