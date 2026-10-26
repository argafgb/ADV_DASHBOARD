"use client";

import { useMemo } from "react";
import { useFilters } from "@/context/FilterContext";

export function useAssetFilters() {
  const {
    year,
    month,
    site,
    setSite,
    company,
    setCompany,
    toggleCompany,
  } = useFilters();

  const input = useMemo(
    () => ({ year, month, site, company }),
    [year, month, site, company],
  );

  return {
    year,
    month,
    site,
    setSite,
    company,
    setCompany,
    toggleCompany,
    /** Filter input passed to services. */
    input,
  };
}
