import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { AssetInfraItem } from "../types/asset.types";
import { canSeeBranchKey, type BranchAccess } from "@/lib/network/branch-scope";
import { ASSET_INFRASTRUCTURE_DATASET } from "../data/assetInfrastructureDataset";

/**
 * Raw data query / retrieval for Asset Infrastructure records.
 * Currently serves standard source dataset from PENDATAAN_PENAMBAHAN_ASSET_INFRA_CABANG.xlsx
 * with pure empty fallback.
 */
export async function getAssetInfrastructureRaw(
  access: BranchAccess,
): Promise<AssetInfraItem[]> {
  try {
    // "Ditujukan" is free text ("ADV Batam"), so it is matched against every
    // known name/alias of the granted branches after stripping the company prefix.
    return ASSET_INFRASTRUCTURE_DATASET.filter((item) =>
      canSeeBranchKey(access, item.Ditujukan),
    ).map((item) => ({
      ...item,
      Ditujukan: (item.Ditujukan || "").trim(),
    }));
  } catch (err) {
    console.error("Failed to load asset infrastructure data:", err);
    return [];
  }
}

/**
 * Public cached function exporting Asset Infrastructure data.
 */
export async function getAssetInfrastructureData(
  access: BranchAccess,
): Promise<AssetInfraItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("network-performance", "asset-infrastructure");

  return getAssetInfrastructureRaw(access);
}
