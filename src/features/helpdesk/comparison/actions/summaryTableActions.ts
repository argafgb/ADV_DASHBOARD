"use server";

import { requireActionPermission } from "@/lib/access/session";
import { resolveDatasetAccess, DATASET_CAPS } from "@/lib/access/data-scope";
import {
  getAppMenuFieldIssuesRaw,
  type AppMenuFieldIssuesFilter,
} from "../services/comparisonService";
import type { AppMenuFieldIssueDetail } from "../types/comparison.types";
import { revalidateTag } from "next/cache";

export async function fetchAppMenuFieldIssuesAction(
  filter: AppMenuFieldIssuesFilter,
): Promise<AppMenuFieldIssueDetail> {
  const safeYear = Number(filter?.year) || 2026;
  const safeMonth = String(filter?.month || "ALL").slice(0, 100);
  const safeQuarter = /^(ALL|Q[1-4])$/.test(filter?.quarter ?? "ALL") ? filter?.quarter ?? "ALL" : "ALL";
  const safeApp = (filter?.app || "").slice(0, 100);
  const safeFeature = (filter?.feature || "").slice(0, 100);
  const safeDept = (filter?.dept || "ALL").slice(0, 50);

  const emptyFallback: AppMenuFieldIssueDetail = {
    month: Number(safeMonth) || 0,
    year: safeYear,
    app: safeApp,
    feature: safeFeature,
    totalTickets: 0,
    topIssues: [],
    topBranches: [],
    tickets: [],
  };

  try {
    const access = await requireActionPermission("menu.helpdesk.comparison.view");
    const datasetAccess = resolveDatasetAccess(
      access.scope,
      DATASET_CAPS.datachat,
      safeDept,
    );

    if (datasetAccess.kind === "deny") {
      return emptyFallback;
    }

    return await getAppMenuFieldIssuesRaw(
      {
        year: safeYear,
        month: safeMonth,
        quarter: safeQuarter,
        app: safeApp,
        feature: safeFeature,
        dept: safeDept,
      },
      datasetAccess,
    );
  } catch (err) {
    console.error("[fetchAppMenuFieldIssuesAction] Gagal memuat kendala lapangan:", err);
    throw new Error("Gagal memuat detail tiket. Silakan coba lagi.");
  }
}

/**
 * Server action to refresh / bypass cache and return fresh data for Detail Apps & Menu drilldown.
 */
export async function syncAppMenuFieldIssuesAction(
  filter: AppMenuFieldIssuesFilter,
): Promise<AppMenuFieldIssueDetail> {
  try {
    revalidateTag("comparison-app-menu-v4", "default");
    revalidateTag("comparison-app-menu-issues-v9", "default");
  } catch (err) {
    console.warn("[syncAppMenuFieldIssuesAction] Revalidate failed:", err);
  }

  return fetchAppMenuFieldIssuesAction(filter);
}
