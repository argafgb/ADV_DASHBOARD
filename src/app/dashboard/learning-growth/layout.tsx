import React, { Suspense } from "react";
import { connection } from "next/server";
import { getLearningGrowthDashboardData } from "@/features/learning-growth/services/learnGrowthService";
import { LearningGrowthProvider } from "@/features/learning-growth/context/LearningGrowthFilterContext";
import { TooltipProvider } from "@/features/learning-growth/context/tooltip-provider";
import { LearningGrowthTopbarFilters } from "@/features/learning-growth/components/LearningGrowthTopbarFilters";
import "@/features/learning-growth/learning-growth.css";

export default async function LearningGrowthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const data = await getLearningGrowthDashboardData();

  return (
    <Suspense fallback={null}>
      <LearningGrowthProvider initialData={data}>
        <TooltipProvider>
          <LearningGrowthTopbarFilters />
          <div className="learning-growth-scope w-full min-w-0">
            {children}
          </div>
        </TooltipProvider>
      </LearningGrowthProvider>
    </Suspense>
  );
}
