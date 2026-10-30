import "server-only";

import { computeDashboardMetrics, sanitizeProjects } from "../utils/parser";
import { getDashboardProjects } from "./dashboard-database";
import { getLatestProjectSyncTimestamp } from "./project-data";
import { formatSyncTimestamp } from "../utils/utils";
import {
  excludeIncompleteRows,
  getBusinessOperationalData,
  normalizeProjectRows,
} from "../utils/project-normalization";
import type { DashboardDataset, RawProject, SanitizedProject } from "../types/types";

export interface DashboardViewData {
  rawProjects: RawProject[];
  operationalProjects: SanitizedProject[];
  masterProjects: SanitizedProject[];
  businessDataset: DashboardDataset;
  lastUpdated: string;
  startYear: number;
  endYear: number;
}

/**
 * Pipeline data dashboard, dijalankan di server.
 *
 * Urutan pemanggilan di sini sengaja dibuat identik dengan yang sebelumnya
 * berjalan di `ProjectDataProvider`, termasuk pool mana yang dipakai tiap
 * turunan. Yang berpindah hanya tempat eksekusinya, bukan cara menghitungnya,
 * sehingga seluruh angka tetap sama.
 */
export async function getDashboardLastUpdated(): Promise<string> {
  // Membaca hasil query yang sama dengan halaman. Karena `getDashboardProjects`
  // memakai `"use cache"`, layout dan halaman berbagi satu eksekusi query.
  const projects = await getDashboardProjects();
  return formatSyncTimestamp(getLatestProjectSyncTimestamp([...projects]));
}

export async function getDashboardViewData(
  selectedYear: number,
): Promise<DashboardViewData> {
  const projects = [...(await getDashboardProjects())];
  const rawProjects = normalizeProjectRows(projects);

  // Satu pool untuk seluruh dashboard: Internal IT, Canceled, Pending
  // Requirement, dan status kosong dibuang; tidak ada filter periode.
  const operationalProjects = sanitizeProjects(
    getBusinessOperationalData(rawProjects),
  );

  // SLA membaca database tanpa filter operasional, karena Notion mengevaluasi
  // SLA terhadap setiap baris yang membawa SLA YEAR. Baris tanpa nama proyek
  // yang terbaca tetap dibuang.
  const masterProjects = sanitizeProjects(excludeIncompleteRows(rawProjects));

  return {
    rawProjects,
    operationalProjects,
    masterProjects,
    businessDataset: computeDashboardMetrics(operationalProjects, selectedYear),
    lastUpdated: formatSyncTimestamp(getLatestProjectSyncTimestamp(projects)),
    startYear: selectedYear,
    endYear: selectedYear,
  };
}
