"use client";

import { useState, useEffect } from "react";
import FilterableBarListCard, {
  type FilterTabOption,
} from "@/components/shared/FilterableBarListCard";
import { useDebounce } from "@/hooks/useDebounce";
import { resolveViewData } from "@/lib/async-view-state";
import { cn } from "@/lib/utils";
import {
  getDevicePerSiteUnitData,
  type SiteUnitFilter,
} from "../services/distributionService";
import type { AssetFilterInput, BarDatum } from "@/types/asset-pm.types";

const TABS: FilterTabOption<SiteUnitFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "site", label: "Site" },
  { value: "unit", label: "Unit" },
];

export default function DevicePerSiteBars({
  input,
  initialItems,
  className,
}: {
  input: AssetFilterInput;
  initialItems?: BarDatum[];
  className?: string;
}) {
  const [filter, setFilter] = useState<SiteUnitFilter>("ALL");
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const [requestItems, setRequestItems] = useState<BarDatum[] | null>(null);
  const usesInitialItems = filter === "ALL" && !debouncedSearch;
  const items = resolveViewData(
    usesInitialItems,
    initialItems,
    requestItems,
    [],
  );

  // Fetch only when local filter changes or debounced search value changes
  useEffect(() => {
    if (usesInitialItems) return;

    let isMounted = true;
    getDevicePerSiteUnitData(input, filter, debouncedSearch).then((res) => {
      if (isMounted && res) {
        setRequestItems(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [input, filter, debouncedSearch, usesInitialItems]);

  return (
    <FilterableBarListCard
      title="Total Devices by Site & Unit"
      subtitle="Diurutkan terbanyak"
      items={items}
      tabs={TABS}
      activeTab={filter}
      onTabChange={setFilter}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari site..."
      maxHeight="max-h-full"
      className={cn("h-full flex flex-col min-h-0", className)}
    />
  );
}
