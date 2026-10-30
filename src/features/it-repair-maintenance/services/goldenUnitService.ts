import "server-only";
import { unstable_cache } from "next/cache";

import { buildGolden } from "../utils/repair-engine";
import {
  emptyEngineInput,
  engineInputFrom,
  getYearSnapshot,
} from "./repairRecordsService";
import type {
  GoldenData,
  GoldenQuery,
  ItrFilters,
} from "../types/it-repair.types";

/**
 * Golden Unit: KPI hasil pengecekan, donut hasil, hasil per item, unit per
 * PIC, dan tabel berpaginasi (12 baris).
 * Sumber: `it_repair_maintenance.log_repair` tahun terpilih, work type Golden Unit.
 */
async function getGoldenRaw(filters: ItrFilters, query: GoldenQuery): Promise<GoldenData> {
  const start = performance.now();
  const input = engineInputFrom(await getYearSnapshot(filters.year));
  const data = buildGolden(input, filters, query);
  console.log(`[DB] getGoldenData in ${(performance.now() - start).toFixed(2)}ms`);
  return data;
}

export async function getGoldenData(filters: ItrFilters, query: GoldenQuery): Promise<GoldenData> {
  try {
    return await unstable_cache(
      async () => getGoldenRaw(filters, query),
      [
        "itrm-golden-unit",
        filters.year,
        filters.month,
        filters.location,
        filters.ownership,
        query.result,
        query.item,
        query.pic,
        query.status ?? "",
        query.q,
        String(query.page),
      ],
      { revalidate: 300, tags: ["itrm-golden-unit"] },
    )();
  } catch (err) {
    console.error("[DB] Failed getGoldenData:", err);
    return buildGolden(emptyEngineInput(filters.year), filters, query);
  }
}
