"use client";

import { useState } from "react";
import { ApprovalStatusCard } from "./approval-status";
import { HeatmapCard } from "./heatmap";
import { ComplianceRiskAndRepeat } from "./compliance-risk";
import { EmployeeTable } from "./employee-table";
import { EmployeeDetailModal } from "./employee-detail-modal";
import type {
  Employee,
  ApprovalStatusData,
  HeatmapCell,
  RepeatEmployee,
  RiskBox,
} from "../../types/employee.types";

interface Props {
  approvalStatus: ApprovalStatusData;
  heatmap: HeatmapCell[];
  riskBoxes: RiskBox[];
  totalIndications: number;
  employees: Employee[];
  repeatEmployees: RepeatEmployee[];
}

export function EmployeeComplianceClient({
  approvalStatus,
  heatmap,
  riskBoxes,
  totalIndications,
  employees,
  repeatEmployees,
}: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const openById = (employeeId: string) => {
    const found = employees.find((e) => e.id === employeeId);
    if (found) setSelectedEmployee(found);
  };

  return (
    <>
      <div className="dd-row--3565">
        <ApprovalStatusCard data={approvalStatus} />
        <HeatmapCard data={heatmap} />
      </div>

      <ComplianceRiskAndRepeat
        boxes={riskBoxes}
        total={totalIndications}
        repeating={repeatEmployees}
        onSelect={openById}
      />

      <EmployeeTable employees={employees} onSelect={setSelectedEmployee} />

      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </>
  );
}
