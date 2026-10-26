"use client";

import { useState, useEffect, useRef } from "react";
import { useAssetFilters } from "@/hooks/useAssetFilters";
import DevicePerSiteBars from "./DevicePerSiteBars";
import BreakdownCard from "./BreakdownCard";
import InventoryTable from "./InventoryTable";
import {
  getDevicePerSiteUnitData,
  getBreakdownData,
  getPaginatedInventoryRowsData,
} from "../services/distributionService";
import {
  DevicePerSiteBarsSkeleton,
  BreakdownCardSkeleton,
  InventoryTableSkeleton,
} from "./skeletons/DistributionSkeletons";
import type { BarDatum } from "@/types/asset-pm.types";
import type { PaginatedInventoryResult } from "../types/distribution.types";

interface DistributionClientProps {
  initialDevicePerSiteData?: BarDatum[];
  initialWorkstationData?: BarDatum[];
  initialInfraData?: BarDatum[];
  initialPeripheralData?: BarDatum[];
  initialInventoryData?: PaginatedInventoryResult;
}

export default function DistributionClient({
  initialDevicePerSiteData,
  initialWorkstationData,
  initialInfraData,
  initialPeripheralData,
  initialInventoryData,
}: DistributionClientProps = {}) {
  const { input } = useAssetFilters();

  const [devicePerSiteData, setDevicePerSiteData] = useState<BarDatum[] | null>(
    initialDevicePerSiteData || null,
  );
  const [workstationData, setWorkstationData] = useState<BarDatum[] | null>(
    initialWorkstationData || null,
  );
  const [infraData, setInfraData] = useState<BarDatum[] | null>(
    initialInfraData || null,
  );
  const [peripheralData, setPeripheralData] = useState<BarDatum[] | null>(
    initialPeripheralData || null,
  );
  const [inventoryData, setInventoryData] =
    useState<PaginatedInventoryResult | null>(initialInventoryData || null);

  const [isDevicePerSiteLoading, setIsDevicePerSiteLoading] = useState(
    !initialDevicePerSiteData,
  );
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(
    !initialWorkstationData || !initialInfraData || !initialPeripheralData,
  );
  const [isInventoryLoading, setIsInventoryLoading] =
    useState(!initialInventoryData);

  const hasInitialData = Boolean(
    initialDevicePerSiteData &&
    initialWorkstationData &&
    initialInfraData &&
    initialPeripheralData &&
    initialInventoryData,
  );

  const filterKey = `${input.year}-${input.month}-${input.site}-${input.company}`;
  const lastFetchedFilterKey = useRef<string | null>(
    hasInitialData ? filterKey : null,
  );

  useEffect(() => {
    if (lastFetchedFilterKey.current === filterKey) {
      return;
    }
    lastFetchedFilterKey.current = filterKey;

    let isMounted = true;

    // Load Device per Site & Unit
    setIsDevicePerSiteLoading(true);
    getDevicePerSiteUnitData(input).then((res) => {
      if (isMounted) {
        setDevicePerSiteData(res || []);
        setIsDevicePerSiteLoading(false);
      }
    });

    // Load Breakdowns
    setIsBreakdownLoading(true);
    Promise.all([
      getBreakdownData(input, "workstation"),
      getBreakdownData(input, "infrastructure"),
      getBreakdownData(input, "peripheral"),
    ]).then(([ws, infra, periph]) => {
      if (isMounted) {
        setWorkstationData(ws || []);
        setInfraData(infra || []);
        setPeripheralData(periph || []);
        setIsBreakdownLoading(false);
      }
    });

    // Load Paginated Inventory Table
    setIsInventoryLoading(true);
    getPaginatedInventoryRowsData(input, 1, 10, "", "ALL").then((res) => {
      if (isMounted) {
        setInventoryData(res || null);
        setIsInventoryLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [input, filterKey]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isDevicePerSiteLoading || !devicePerSiteData ? (
          <DevicePerSiteBarsSkeleton />
        ) : (
          <DevicePerSiteBars
            input={input}
            initialItems={devicePerSiteData}
            className="h-full max-h-195"
          />
        )}

        <div className="grid gap-4">
          {isBreakdownLoading || !workstationData ? (
            <BreakdownCardSkeleton title="Breakdown workstation" />
          ) : (
            <BreakdownCard
              input={input}
              group="workstation"
              initialItems={workstationData}
            />
          )}

          {isBreakdownLoading || !infraData ? (
            <BreakdownCardSkeleton title="Breakdown infrastructure" />
          ) : (
            <BreakdownCard
              input={input}
              group="infrastructure"
              initialItems={infraData}
            />
          )}

          {isBreakdownLoading || !peripheralData ? (
            <BreakdownCardSkeleton title="Breakdown peripheral" />
          ) : (
            <BreakdownCard
              input={input}
              group="peripheral"
              initialItems={peripheralData}
            />
          )}
        </div>
      </div>

      {isInventoryLoading || !inventoryData ? (
        <InventoryTableSkeleton />
      ) : (
        <InventoryTable input={input} initialData={inventoryData} />
      )}
    </div>
  );
}
