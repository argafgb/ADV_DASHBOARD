"use client";

import React, { createContext, useContext, useMemo } from "react";
import { createSlaService, type SlaService } from "../services/slaService";
import {
  createMapPointsService,
  type MapPointsService,
} from "../services/mapPoints";
import {
  createRegionService,
  type RegionService,
} from "../services/regionService";
import { createIspService, type IspService } from "../services/ispService";
import {
  createTrafficService,
  type TrafficService,
} from "../services/trafficService";
import type {
  Branch,
  DowntimeIncident,
  IspLink,
  RegionGroup,
  SlaMatrix,
  WeeklyQualityRecord,
} from "../types/network.types";
import type { Periods } from "../queries/periods";
import type { TrafficData } from "../queries/traffic";
import type { RawInternetCostRow } from "@/features/network-performance/isp-bandwidth/types/isp-cost.types";

/**
 * Serialisable payload handed down from the server components. Kept identical
 * to queries/index.ts NetworkData so the page can spread it straight in.
 */
export interface NetworkDataProps {
  branches: Branch[];
  regionGroups: RegionGroup[];
  matrix: SlaMatrix;
  incidents: DowntimeIncident[];
  ispLinks: Record<string, IspLink[]>;
  ispColors: Record<string, string>;
  traffic: TrafficData;
  periods: Periods;
  internetCosts?: RawInternetCostRow[];
  weeklyQuality?: WeeklyQualityRecord[];
}

interface NetworkDataValue extends NetworkDataProps {
  sla: SlaService;
  map: MapPointsService;
  region: RegionService;
  isp: IspService;
  trafficService: TrafficService;
}

const NetworkDataContext = createContext<NetworkDataValue | undefined>(
  undefined,
);

export function NetworkDataProvider({
  children,
  ...data
}: NetworkDataProps & { children: React.ReactNode }) {
  const value = useMemo<NetworkDataValue>(() => {
    const sla = createSlaService({
      branches: data.branches,
      matrix: data.matrix,
      periods: data.periods,
      incidents: data.incidents,
    });
    const isp = createIspService(data.ispLinks, data.ispColors, data.branches);
    return {
      ...data,
      sla,
      isp,
      map: createMapPointsService(sla, data.incidents),
      region: createRegionService(sla, data.regionGroups),
      trafficService: createTrafficService(data.traffic, data.branches, isp),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.branches,
    data.regionGroups,
    data.matrix,
    data.incidents,
    data.ispLinks,
    data.ispColors,
    data.traffic,
    data.periods,
    data.weeklyQuality,
  ]);

  return (
    <NetworkDataContext.Provider value={value}>
      {children}
    </NetworkDataContext.Provider>
  );
}

export function useNetworkData(): NetworkDataValue {
  const ctx = useContext(NetworkDataContext);
  if (!ctx) {
    throw new Error("useNetworkData must be used within a NetworkDataProvider");
  }
  return ctx;
}
