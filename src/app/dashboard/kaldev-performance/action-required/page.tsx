export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { KaldevActionRequiredSkeleton } from "@/features/kaldev-performance/components/skeletons/kaldev-skeletons";
import { ActionRequiredClient } from "@/features/kaldev-performance/components/action-required/action-required-client";
import { getAttentionData } from "@/features/kaldev-performance/services/attentionService";
import { PageHeader } from "@/features/kaldev-performance/components/shared/page-header";
import {
  first,
  readKaldevFilters,
  type RawSearchParams,
} from "@/features/kaldev-performance/utils/filters";
import { hrefWith } from "@/features/kaldev-performance/utils/format";
import type { AttentionTab } from "@/features/kaldev-performance/types/kaldev.types";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const TABS: AttentionTab[] = ["sla", "noprog", "idle", "hold"];

function parseTab(value: string | undefined): AttentionTab {
  return TABS.includes(value as AttentionTab) ? (value as AttentionTab) : "sla";
}

async function ActionRequiredContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = await readKaldevFilters(params);
  const tab = parseTab(first(params.tab));
  const data = await getAttentionData(filters);
  const tabHrefs = Object.fromEntries(
    TABS.map((t) => [
      t,
      hrefWith("/dashboard/kaldev-performance/action-required", filters, { tab: t }),
    ]),
  ) as Record<AttentionTab, string>;

  return <ActionRequiredClient data={data} tab={tab} tabHrefs={tabHrefs} />;
}

export default async function ActionRequiredPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.kaldev-performance.action-required.view");

  return (
    <div
      style={{ display: "grid", gap: "var(--grid-gap)", alignContent: "start" }}
    >
      <PageHeader
        title="Action required"
        subtitle="Proyek mendekati atau melewati target, tanpa developer, tanpa progres, dan ditahan."
      />
      <Suspense fallback={<KaldevActionRequiredSkeleton />}>
        <ActionRequiredContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
