"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatSyncTimestamp } from "@/lib/utils";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";
import { useUrlUpdater } from "../hooks/use-url-updater";
import type { FilterOptions } from "../types/it-repair.types";
import type { OrgFilterOptions } from "../services/filterOptionsService";

interface ItRepairFilterContextType {
  year: string;
  setYear: (year: string) => void;
  yearOptions: string[];
  month: string;
  setMonth: (month: string) => void;
  location: string;
  setLocation: (loc: string) => void;
  locationOptions: string[];
  ownership: string;
  setOwnership: (own: string) => void;
  ownershipOptions: string[];
  lastUpdated: string;
}

const ItRepairFilterContext = createContext<ItRepairFilterContextType | undefined>(
  undefined,
);

export function ItRepairFilterProvider({
  children,
  syncedAt,
  orgFilterOptions,
  localFilterOptions,
}: {
  children: ReactNode;
  syncedAt: string | null;
  orgFilterOptions: OrgFilterOptions;
  localFilterOptions: FilterOptions;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useUrlUpdater();

  const yearOptions = orgFilterOptions.years;
  const rawYear = searchParams.get("year");
  const normalizedYear = normalizeYear(rawYear);
  const year =
    yearOptions.length === 0 || yearOptions.includes(normalizedYear)
      ? normalizedYear
      : yearOptions[0];

  const rawMonth = searchParams.get("month");
  const month = normalizeMonthFilter(rawMonth, year);

  const rawLocation = searchParams.get("location");
  const location = rawLocation?.trim() || "Semua";

  const rawOwnership = searchParams.get("ownership");
  const ownership = rawOwnership?.trim() || "Semua";

  const lastUpdated = useMemo(() => formatSyncTimestamp(syncedAt), [syncedAt]);

  // Refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 300000);
    return () => clearInterval(interval);
  }, [router]);

  const setYear = (y: string) => {
    update({
      year: y,
      month: "ALL",
      page: null,
      modal: null,
      mv: null,
      mpage: null,
    });
  };

  const setMonth = (m: string) => {
    update({
      month: m,
      page: null,
      modal: null,
      mv: null,
      mpage: null,
    });
  };

  const setLocation = (loc: string) => {
    update({
      location: loc === "Semua" ? null : loc,
      page: null,
      modal: null,
      mv: null,
      mpage: null,
    });
  };

  const setOwnership = (own: string) => {
    update({
      ownership: own === "Semua" ? null : own,
      page: null,
      modal: null,
      mv: null,
      mpage: null,
    });
  };

  const value = useMemo(
    () => ({
      year,
      setYear,
      yearOptions,
      month,
      setMonth,
      location,
      setLocation,
      locationOptions: localFilterOptions.locations,
      ownership,
      setOwnership,
      ownershipOptions: localFilterOptions.ownerships,
      lastUpdated,
    }),
    [
      year,
      yearOptions,
      month,
      location,
      localFilterOptions.locations,
      ownership,
      localFilterOptions.ownerships,
      lastUpdated,
    ],
  );

  return (
    <ItRepairFilterContext.Provider value={value}>
      {children}
    </ItRepairFilterContext.Provider>
  );
}

export function useItRepairFilters(): ItRepairFilterContextType {
  const context = useContext(ItRepairFilterContext);
  if (!context) {
    throw new Error(
      "useItRepairFilters must be used within an ItRepairFilterProvider",
    );
  }
  return context;
}
