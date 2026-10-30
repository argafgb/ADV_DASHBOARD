"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FullOverviewDashboardData,
  MatrixRole,
  MatrixType,
} from "../types/overviewTypes";

import OverviewMetricsGrid from "./OverviewMetricsGrid";
import OverviewSecondaryRow from "./OverviewSecondaryRow";
import PersonnelSeverityMatrixCard from "./PersonnelSeverityMatrixCard";
import PerformanceAuditMatrixCard from "./PerformanceAuditMatrixCard";
import TotalBugBreakdownModal from "./TotalBugBreakdownModal";
import PersonDetailModal from "./PersonDetailModal";

interface OverviewDashboardClientProps {
  data: FullOverviewDashboardData;
  year: string;
  month: string;
}

export default function OverviewDashboardClient({
  data,
}: OverviewDashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isBugBreakdownOpen, setIsBugBreakdownOpen] = useState(false);
  const [personName, setPersonName] = useState<string | null>(null);

  const { row1, row2, row3 } = data;

  const selectedPerson =
    personName && row1?.personDetails?.[personName]
      ? row1.personDetails[personName]
      : null;

  const setMatrixParam = (key: "mtRole" | "mtType", value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const gotoIssuesData = (query?: string) => {
    router.push(
      query
        ? `/dashboard/issues-data?q=${encodeURIComponent(query)}`
        : "/dashboard/issues-data",
    );
  };

  const openPerson = (name: string) => {
    setIsBugBreakdownOpen(false);
    setPersonName(name);
  };

  return (
    <div className="w-full space-y-3.5 font-sans select-none relative">
      {/* Row 1: KPI cards */}
      {row1 && (
        <OverviewMetricsGrid
          findings={row1.findings}
          bug={row1.bug}
          cr={row1.cr}
          penalty={row1.penalty}
          stageChips={row1.stageChips}
          onDetailClick={() => setIsBugBreakdownOpen(true)}
        />
      )}

      {/* Row 2: Finding source & FSD coverage */}
      {row2 && (
        <OverviewSecondaryRow srcSegs={row2.srcSegs} fsdSegs={row2.fsdSegs} />
      )}

      {/* Row 3: Personnel & severity matrix */}
      {row2 && (
        <PersonnelSeverityMatrixCard
          mtRole={row2.mtRole}
          mtType={row2.mtType}
          personBars={row2.personBars}
          donutTotal={row2.donutTotal}
          donutSegs={row2.donutSegs}
          sevScale={row2.sevScale}
          onRoleChange={(r: MatrixRole) => setMatrixParam("mtRole", r)}
          onTypeChange={(t: MatrixType) => setMatrixParam("mtType", t)}
          onPersonClick={openPerson}
        />
      )}

      {/* Row 4: Performance audit matrix */}
      {row3 && (
        <PerformanceAuditMatrixCard
          rows={row3.matrixRows}
          onRowClick={openPerson}
          onViewAllClick={() => gotoIssuesData()}
        />
      )}

      {/* Modals */}
      <TotalBugBreakdownModal
        isOpen={isBugBreakdownOpen}
        onClose={() => setIsBugBreakdownOpen(false)}
        data={row1?.bugModalData}
        onContributorClick={openPerson}
        onOpenIssuesData={() => gotoIssuesData()}
      />

      <PersonDetailModal
        person={selectedPerson}
        isOpen={personName !== null}
        onClose={() => setPersonName(null)}
        onViewRecords={() => gotoIssuesData(personName ?? undefined)}
      />
    </div>
  );
}
