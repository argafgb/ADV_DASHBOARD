import "server-only";
import { unstable_cache } from "next/cache";

import { buildOverview } from "../utils/repair-engine";
import {
  emptyEngineInput,
  engineInputFrom,
  getYearSnapshot,
} from "./repairRecordsService";
import type {
  ItrFilters,
  ModalQuery,
  OverviewData,
  OverviewSeg,
} from "../types/it-repair.types";

/**
 * Overview: KPI + delta kuartal, volume bulanan, komposisi status, ranked bar
 * item/PIC, donut hasil, dan modal daftar record dari klik chart.
 * Sumber: `it_repair_maintenance.log_repair` tahun terpilih.
 */
async function getOverviewRaw(
  filters: ItrFilters,
  seg: OverviewSeg,
  modal: ModalQuery | null,
): Promise<OverviewData> {
  const start = performance.now();
  const input = engineInputFrom(await getYearSnapshot(filters.year));
  const data = buildOverview(input, filters, seg, modal);
  console.log(`[DB] getOverviewData in ${(performance.now() - start).toFixed(2)}ms`);
  return data;
}

export async function getOverviewData(
  filters: ItrFilters,
  seg: OverviewSeg,
  modal: ModalQuery | null,
): Promise<OverviewData> {
  try {
    return await unstable_cache(
      async () => getOverviewRaw(filters, seg, modal),
      [
        "itrm-overview",
        filters.year,
        filters.month,
        filters.location,
        filters.ownership,
        seg,
        modal ? `${modal.kind}:${modal.value}:${modal.page}` : "",
      ],
      { revalidate: 300, tags: ["itrm-overview"] },
    )();
  } catch (err) {
    console.error("[DB] Failed getOverviewData:", err);
    return buildOverview(emptyEngineInput(filters.year), filters, seg, modal);
  }
}
