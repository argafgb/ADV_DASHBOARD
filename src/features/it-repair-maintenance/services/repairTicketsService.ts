import "server-only";
import { unstable_cache } from "next/cache";

import { buildRepair } from "../utils/repair-engine";
import {
  emptyEngineInput,
  engineInputFrom,
  getYearSnapshot,
} from "./repairRecordsService";
import type {
  ItrFilters,
  RepairData,
  RepairQuery,
} from "../types/it-repair.types";

/**
 * Repair tickets: KPI status, donut hasil & cabang, status per item, beban
 * PIC, repair per bulan, dan tabel berpaginasi (12 baris).
 * Sumber: `it_repair_maintenance.log_repair` tahun terpilih, work type User repair.
 */
async function getRepairRaw(filters: ItrFilters, query: RepairQuery): Promise<RepairData> {
  const start = performance.now();
  const input = engineInputFrom(await getYearSnapshot(filters.year));
  const data = buildRepair(input, filters, query);
  console.log(`[DB] getRepairData in ${(performance.now() - start).toFixed(2)}ms`);
  return data;
}

export async function getRepairData(filters: ItrFilters, query: RepairQuery): Promise<RepairData> {
  try {
    return await unstable_cache(
      async () => getRepairRaw(filters, query),
      [
        "itrm-repair-tickets",
        filters.year,
        filters.month,
        filters.location,
        filters.ownership,
        query.status,
        query.item,
        query.pic,
        query.result ?? "",
        query.branch ? query.branch.join(",") : "",
        query.q,
        String(query.page),
      ],
      { revalidate: 300, tags: ["itrm-repair-tickets"] },
    )();
  } catch (err) {
    console.error("[DB] Failed getRepairData:", err);
    return buildRepair(emptyEngineInput(filters.year), filters, query);
  }
}
