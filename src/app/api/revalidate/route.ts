import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_TAGS = [
  "overview-asset-growth",
  "overview-total-asset-kpis",
  "overview-pm-summary-kpis",
  "overview-donut-charts",
  "overview-pm-schedule",
  "overview-distribution-charts",
  "overview-rating",
  "overview-rating-details",
  "cost-proporsi-biaya-combined",
  "cost-per-site-unit",
  "cost-repair-maintenance-summary",
  "cost-paginated-rows",
  "cost-monthly-comparison",
  "distribution-device-per-site-unit",
  "distribution-breakdown",
  "distribution-inventory-rows",
  "distribution-paginated-inventory-rows",
  "comparison-usia-aset",
  "comparison-rnm",
  "comparison-kategori-temuan",
  "findings-temuan-per-kategori",
  "findings-category-trend",
  "findings-status-resolusi",
  "findings-event-lifecycle",
  "findings-replacement-vs-new",
  "findings-status-per-cabang",
  "findings-finding-rows",
  "asset-purchasing",
  "asset-warranty",
  "asset-warranty-invalid",
  "device-requests",
  "warehouse-stock",
  "pic-dashboard-projects",
  "kaldev-overview",
  "kaldev-attention",
  "kaldev-projects",
  "kaldev-team",
  "kaldev-filter-options",
  "last-synced-at",
];

function isAuthorized(req: NextRequest): boolean {
  const secretHeader = req.headers.get("x-revalidate-secret");
  const secretQuery = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.REVALIDATE_SECRET;

  if (!expectedSecret) return false;

  return secretHeader === expectedSecret || secretQuery === expectedSecret;
}

async function handleRevalidation(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid revalidate secret" },
      { status: 401 },
    );
  }

  let tagsToRevalidate: string[] = DEFAULT_TAGS;

  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      if (Array.isArray(body.tags) && body.tags.length > 0) {
        tagsToRevalidate = body.tags;
      }
    } catch {
      // Fallback to DEFAULT_TAGS if body parsing fails
    }
  }

  const revalidatedTags: string[] = [];

  for (const tag of tagsToRevalidate) {
    try {
      revalidateTag(tag, "default");
      revalidatedTags.push(tag);
    } catch (err) {
      console.warn(`[Revalidate API] Failed to revalidate tag '${tag}':`, err);
    }
  }

  try {
    revalidatePath("/", "layout");
  } catch (err) {
    console.warn("[Revalidate API] Failed to revalidatePath '/':", err);
  }

  console.log(
    `[Revalidate API] Successfully revalidated ${revalidatedTags.length} tags at ${new Date().toISOString()}`,
  );

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
    clearedTags: revalidatedTags,
  });
}

export async function POST(req: NextRequest) {
  return handleRevalidation(req);
}

export async function GET(req: NextRequest) {
  return handleRevalidation(req);
}
