export const instant = false;

import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { getDashboardFilters } from "@/features/overtime/utils/dashboard-filters";
import { getOrgFilterOptions } from "@/features/overtime/services/filterOptionsService";
import {
  getApprovalStatus,
  getHeatmap,
  getComplianceRisk,
  getEmployeeTable,
  getRepeatPatterns,
} from "@/features/overtime/services/employeeService";
import { EmployeeComplianceClient } from "@/features/overtime/components/employee-compliance/employee-compliance-client";
import { OvertimeEmployeeComplianceSkeleton } from "@/features/overtime/components/skeletons";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
    area?: string;
    level1?: string;
    level2?: string;
  }>;
}

async function EmployeeComplianceContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const orgFilterOptions = await getOrgFilterOptions();
  const { year, month, area, level1, level2 } = getDashboardFilters(params, {
    availableYears: orgFilterOptions.years,
    orgFilterOptions,
  });

  const [approvalStatus, heatmap, complianceRisk, employees, repeatEmployees] =
    await Promise.all([
      getApprovalStatus(year, month, area, level1, level2),
      getHeatmap(year, month, area, level1, level2),
      getComplianceRisk(year, month, area, level1, level2),
      getEmployeeTable(year, month, area, level1, level2),
      getRepeatPatterns(year, month, area, level1, level2),
    ]);

  return (
    <EmployeeComplianceClient
      approvalStatus={approvalStatus}
      heatmap={heatmap}
      riskBoxes={complianceRisk.boxes}
      totalIndications={complianceRisk.total}
      employees={employees}
      repeatEmployees={repeatEmployees}
    />
  );
}

export default async function EmployeeCompliancePage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.overtime.employee-compliance.view");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <header>
        <h1 className="dd-page__title" style={{ margin: 0 }}>
          Employee Compliance
        </h1>
        <p className="dd-page__subtitle" style={{ margin: 0 }}>
          Pola karyawan, waktu lembur, status proses, dan indikasi risiko
          kebijakan. Klik karyawan untuk melihat informasi lebih detail.
        </p>
      </header>

      <Suspense fallback={<OvertimeEmployeeComplianceSkeleton />}>
        <EmployeeComplianceContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
