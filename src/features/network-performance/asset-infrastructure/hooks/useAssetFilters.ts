"use client";

import { useCallback, useState } from "react";
import type {
  AssetCategoryFilter,
  AssetStatusFilter,
} from "../types/asset.types";

export interface UseAssetFiltersReturn {
  category: AssetCategoryFilter;
  status: AssetStatusFilter;
  query: string;
  setCategory: (cat: AssetCategoryFilter) => void;
  setStatus: (st: AssetStatusFilter) => void;
  setQuery: (q: string) => void;
  resetFilters: () => void;
  isFiltered: boolean;
}

export function useAssetFilters(): UseAssetFiltersReturn {
  const [category, setCategoryState] = useState<AssetCategoryFilter>("all");
  const [status, setStatusState] = useState<AssetStatusFilter>("all");
  const [query, setQueryState] = useState<string>("");

  const setCategory = useCallback((cat: AssetCategoryFilter) => {
    setCategoryState(cat);
  }, []);

  const setStatus = useCallback((st: AssetStatusFilter) => {
    setStatusState(st);
  }, []);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const resetFilters = useCallback(() => {
    setCategoryState("all");
    setStatusState("all");
    setQueryState("");
  }, []);

  const isFiltered = category !== "all" || status !== "all" || query.trim() !== "";

  return {
    category,
    status,
    query,
    setCategory,
    setStatus,
    setQuery,
    resetFilters,
    isFiltered,
  };
}
