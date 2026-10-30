import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const DEFAULT_TAGS = [
  "kaldev-overview",
  "kaldev-attention",
  "kaldev-projects",
  "kaldev-team",
  "kaldev-filter-options",
  "last-synced-at",
];

export async function POST() {
  for (const tag of DEFAULT_TAGS) {
    try {
      revalidateTag(tag, "default");
    } catch (err) {
      console.warn(`[Sync API] Failed to revalidate tag '${tag}':`, err);
    }
  }

  try {
    revalidatePath("/dashboard/kaldev-performance", "layout");
  } catch (err) {
    console.warn("[Sync API] Failed to revalidatePath '/dashboard/kaldev-performance':", err);
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
  });
}
