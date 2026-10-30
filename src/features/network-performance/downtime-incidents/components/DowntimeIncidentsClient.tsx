"use client";

import React from "react";
import { TooltipLayerProvider } from "@/features/network-performance/context/TooltipLayer";
import {
  NetworkDataProvider,
  type NetworkDataProps,
} from "@/features/network-performance/context/NetworkDataContext";
import DowntimeView from "@/features/network-performance/components/views/DowntimeView";

export default function DowntimeIncidentsClient(props: NetworkDataProps) {
  return (
    <NetworkDataProvider {...props}>
      <TooltipLayerProvider>
        <div className="w-full min-w-0 max-w-full overflow-x-hidden font-sans">
          <DowntimeView />
        </div>
      </TooltipLayerProvider>
    </NetworkDataProvider>
  );
}

export { DowntimeIncidentsClient };
