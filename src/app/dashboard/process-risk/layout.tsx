import React from 'react';
import { connection } from 'next/server';
import { getProcessRiskDashboardData } from '@/features/process-risk/services/processRiskService';
import { ProcessRiskFilterProvider } from '@/features/process-risk/context/ProcessRiskFilterContext';
import { ProcessRiskDataProvider } from '@/features/process-risk/providers/dashboard-data-provider';
import { ProcessRiskTopbarFilters } from '@/features/process-risk/components/ProcessRiskTopbarFilters';
import { TooltipLayer } from '@/features/process-risk/components/Primitives';
import '@/features/process-risk/process-risk.css';

export default async function ProcessRiskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const initialData = await getProcessRiskDashboardData();

  return (
    <ProcessRiskDataProvider initialData={initialData}>
      <ProcessRiskFilterProvider>
        <ProcessRiskTopbarFilters />
        <div className="process-risk-scope w-full min-w-0">
          <TooltipLayer>{children}</TooltipLayer>
        </div>
      </ProcessRiskFilterProvider>
    </ProcessRiskDataProvider>
  );
}
