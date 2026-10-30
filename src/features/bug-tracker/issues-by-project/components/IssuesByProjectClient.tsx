"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { buildCsv } from "@/features/bug-tracker/issues-data/utils/issuesDataUtils";
import IssueRecordDrawer from "@/features/bug-tracker/issues-data/components/IssueRecordDrawer";
import { IssuesByProjectPayload } from "../types/issuesByProject";
import { useIssuesByProject } from "../hooks/useIssuesByProject";
import TopProjectsCard from "./TopProjectsCard";
import FoundVsClosedCard from "./FoundVsClosedCard";
import BugVsCrCard from "./BugVsCrCard";
import ProjectsTableCard from "./ProjectsTableCard";

interface IssuesByProjectClientProps {
  data: IssuesByProjectPayload;
  year: string;
}

export default function IssuesByProjectClient({
  data,
  year,
}: IssuesByProjectClientProps) {
  const router = useRouter();
  const vm = useIssuesByProject(
    data,
    parseInt(year, 10) || new Date().getFullYear(),
  );

  const handleExport = () => {
    const items = vm.groups.flatMap((g) => g.rows);
    const csv = buildCsv(items);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-by-project-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSeeAll = (projectName: string) => {
    router.push(`/dashboard/issues-data?q=${encodeURIComponent(projectName)}`);
  };

  return (
    <div className="flex w-full flex-col gap-3.5 font-sans">
      {vm.chartsOn && (
        <>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_1.05fr]">
            <TopProjectsCard
              projects={vm.topProjects}
              onPick={vm.pickProject}
            />
            <FoundVsClosedCard
              data={vm.foundVsClosed}
              year={vm.year}
              yMax={vm.foundVsClosedMax}
            />
          </div>
          <BugVsCrCard data={vm.bugCr} year={vm.year} />
        </>
      )}

      <ProjectsTableCard
        subLabel={vm.subLabel}
        chartsOn={vm.chartsOn}
        onToggleCharts={vm.toggleCharts}
        qProj={vm.qProj}
        onQProjChange={vm.setQProj}
        sortProj={vm.sortProj}
        onSortProjChange={vm.setSortProj}
        onExport={handleExport}
        isEmpty={vm.isEmpty}
        groups={vm.pageGroups}
        expanded={vm.expanded}
        onToggleGroup={vm.toggleGroup}
        onOpenRow={vm.openDrawer}
        onSeeAll={handleSeeAll}
        footLabel={vm.footLabel}
        pageNumbers={vm.pageNumbers}
        currentPage={vm.currentPage}
        onGotoPage={vm.gotoPage}
        onPrevPage={vm.prevPage}
        onNextPage={vm.nextPage}
      />

      <IssueRecordDrawer
        item={vm.drawerItem}
        allItems={data.items}
        onClose={vm.closeDrawer}
      />
    </div>
  );
}
