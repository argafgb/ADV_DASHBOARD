"use client";

import React, { createContext, useContext, useMemo } from "react";

import { sanitizeProjects, computeDashboardMetrics } from "../utils/parser";
import type { DashboardViewModel } from "../types/types";
import {
  excludeIncompleteRows,
  getBusinessOperationalData,
} from "../utils/project-normalization";
import { useUploadOverride } from "./UploadOverrideContext";
import { useFilters } from "./FilterContext";

interface ProjectDataContextType extends DashboardViewModel {
  isCustomLoaded: boolean;
  processUploadedFile: (file: File) => void;
}

const ProjectDataContext = createContext<ProjectDataContextType | undefined>(
  undefined,
);

/**
 * Menyalurkan hasil pipeline dashboard ke komponen tampilan.
 *
 * Mendukung initialData dari layout (sehingga tidak ada fetch ulang saat navigasi
 * antar menu di sidebar) dan tetap mendukung prop data lokal jika dipassing.
 */
export function ProjectDataProvider({
  children,
  data,
  initialData,
}: {
  children: React.ReactNode;
  data?: DashboardViewModel | null;
  initialData?: DashboardViewModel | null;
}) {
  const baseData = data ?? initialData ?? null;
  const { uploadedProjects, processUploadedFile } = useUploadOverride();

  let filterYear: number | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const filters = useFilters();
    if (filters?.year) {
      filterYear = Number(filters.year) || null;
    }
  } catch {
    // Dipakai jika context dipanggil di lingkungan test tanpa FilterProvider
  }

  const selectedYear =
    filterYear ?? baseData?.startYear ?? new Date().getFullYear();

  const uploadedView = useMemo<DashboardViewModel | null>(() => {
    if (!uploadedProjects) return null;

    const operationalProjects = sanitizeProjects(
      getBusinessOperationalData(uploadedProjects),
    );
    const masterProjects = sanitizeProjects(
      excludeIncompleteRows(uploadedProjects),
    );

    return {
      rawProjects: uploadedProjects,
      operationalProjects,
      masterProjects,
      businessDataset: computeDashboardMetrics(
        operationalProjects,
        selectedYear,
      ),
      lastUpdated: baseData?.lastUpdated ?? "Belum tersedia",
      startYear: selectedYear,
      endYear: selectedYear,
    };
  }, [uploadedProjects, baseData?.lastUpdated, selectedYear]);

  const activeView = useMemo<DashboardViewModel>(() => {
    if (uploadedView) return uploadedView;

    if (!baseData) {
      return {
        rawProjects: [],
        operationalProjects: [],
        masterProjects: [],
        businessDataset: computeDashboardMetrics([], selectedYear),
        lastUpdated: "Belum tersedia",
        startYear: selectedYear,
        endYear: selectedYear,
      };
    }

    // Jika filter tahun diubah oleh user di navbar dan berbeda dari tahun data awal,
    // hitung ulang businessDataset di memori (< 2ms) tanpa perlu request server.
    if (selectedYear !== baseData.startYear) {
      return {
        ...baseData,
        businessDataset: computeDashboardMetrics(
          baseData.operationalProjects,
          selectedYear,
        ),
        startYear: selectedYear,
        endYear: selectedYear,
      };
    }

    return baseData;
  }, [uploadedView, baseData, selectedYear]);

  return (
    <ProjectDataContext.Provider
      value={{
        ...activeView,
        isCustomLoaded: uploadedProjects !== null,
        processUploadedFile,
      }}
    >
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectData() {
  const context = useContext(ProjectDataContext);

  if (!context) {
    throw new Error("useProjectData must be used within a ProjectDataProvider");
  }

  return context;
}
