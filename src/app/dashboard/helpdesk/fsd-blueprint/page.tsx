export const instant = false;

import { connection } from "next/server";
import { Suspense } from "react";
import { getDashboardFilters } from "@/lib/helpdesk/dashboard-filters";
import { requirePagePermission } from "@/lib/access/session";
import { getFsdBlueprintListData } from "@/features/helpdesk/fsd-blueprint/services/fsdBlueprintService";
import { FsdBlueprintClient } from "@/features/helpdesk/fsd-blueprint/components/FsdBlueprintClient";
import { FsdBlueprintSkeleton } from "@/features/helpdesk/fsd-blueprint/components/skeletons/FsdBlueprintSkeleton";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
  }>;
}

async function FsdBlueprintContainer({ searchParams }: PageProps) {
  await connection();
  const access = await requirePagePermission(
    "menu.helpdesk.fsd-blueprint.view",
  );
  const params = await searchParams;
  const { year, month } = getDashboardFilters(params);

  const items = await getFsdBlueprintListData(
    {
      year,
      month,
    },
    access.scope,
  );

  return <FsdBlueprintClient items={items} />;
}

export default async function FsdBlueprintPage({ searchParams }: PageProps) {
  await connection();
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          FSD Blueprint
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Monitoring dokumen FSD &amp; Blueprint per modul, divisi owner, dan
          personil IT.
        </p>
      </header>

      <Suspense fallback={<FsdBlueprintSkeleton />}>
        <FsdBlueprintContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
