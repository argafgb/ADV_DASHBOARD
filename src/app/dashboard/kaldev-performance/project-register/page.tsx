export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { KaldevProjectRegisterSkeleton } from "@/features/kaldev-performance/components/skeletons/kaldev-skeletons";
import { ProjectRegisterClient } from "@/features/kaldev-performance/components/project-register/project-register-client";
import { RegisterViewTabs } from "@/features/kaldev-performance/components/project-register/register-view-tabs";
import { getRegisterData } from "@/features/kaldev-performance/services/projectRegisterService";
import { PageHeader } from "@/features/kaldev-performance/components/shared/page-header";
import {
  first,
  parsePage,
  readKaldevFilters,
  type RawSearchParams,
} from "@/features/kaldev-performance/utils/filters";
import {
  PROJECT_STATUSES,
  type ProjectStatus,
  type RegisterQuery,
} from "@/features/kaldev-performance/types/kaldev.types";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

function parseQuery(params: RawSearchParams): RegisterQuery {
  const status = first(params.status);
  const laneLimits: RegisterQuery["laneLimits"] = {};
  for (const st of PROJECT_STATUSES) {
    const n = Number.parseInt(first(params[`lim${st}`]) ?? "", 10);
    if (Number.isFinite(n) && n > 0) laneLimits[st] = n;
  }
  return {
    view: first(params.view) === "table" ? "table" : "kanban",
    status: PROJECT_STATUSES.includes(status as ProjectStatus)
      ? (status as ProjectStatus)
      : "Semua",
    cat: first(params.cat) || "Semua",
    basis: first(params.basis) || "Semua",
    prog: first(params.prog) || "Semua",
    q: first(params.q) || "",
    page: parsePage(first(params.page)),
    laneLimits,
  };
}

async function ProjectRegisterContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = await readKaldevFilters(params);
  const query = parseQuery(params);
  const data = await getRegisterData(filters, query);
  return <ProjectRegisterClient data={data} query={query} />;
}

export default async function ProjectRegisterPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.kaldev-performance.project-register.view");

  return (
    <div
      style={{ display: "grid", gap: "var(--grid-gap)", alignContent: "start" }}
    >
      <PageHeader
        title="Project register"
        subtitle="Seluruh proyek divisi beserta status, target, dan keterlambatannya."
        right={<RegisterViewTabs />}
      />
      <Suspense fallback={<KaldevProjectRegisterSkeleton />}>
        <ProjectRegisterContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
