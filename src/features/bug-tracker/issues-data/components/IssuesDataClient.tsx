"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { IssuesDataPayload } from "../types/issuesData";
import { useIssuesData } from "../hooks/useIssuesData";
import { buildCsv } from "../utils/issuesDataUtils";
import IssuesChartsRow from "./IssuesChartsRow";
import FindingsPerMonthCard from "./FindingsPerMonthCard";
import IssuesTableCard from "./IssuesTableCard";
import IssueRecordDrawer from "./IssueRecordDrawer";

interface IssuesDataClientProps {
  data: IssuesDataPayload;
  year: string;
}

export default function IssuesDataClient({
  data,
  year,
}: IssuesDataClientProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";

  const vm = useIssuesData(
    data.items,
    parseInt(year, 10) || new Date().getFullYear(),
    initialQuery,
    data.prevItems,
    data.prevYear,
  );

  const handleExport = () => {
    const csv = buildCsv(vm.filtered);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issues-data-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex w-full flex-col gap-3.5 font-sans">
      <IssuesChartsRow donut={vm.donut} heatmap={vm.heatmap} />

      <FindingsPerMonthCard
        bars={vm.monthBars}
        legend={vm.legend}
        year={vm.year}
      />

      <IssuesTableCard
        subLabel={vm.subLabel}
        q={vm.q}
        onQChange={vm.setQ}
        fType={vm.fType}
        onTypeChange={vm.setFType}
        fSeverity={vm.fSeverity}
        onSeverityChange={vm.setFSeverity}
        fStatus={vm.fStatus}
        onStatusChange={vm.setFStatus}
        fStage={vm.fStage}
        onStageChange={vm.setFStage}
        groupBy={vm.groupBy}
        onGroupByChange={vm.setGroupBy}
        onExport={handleExport}
        isEmpty={vm.isEmpty}
        grouped={vm.grouped}
        flatRows={vm.flatRows}
        flatStartIndex={vm.flatStartIndex}
        groupRows={vm.groupRows}
        expandedGroups={vm.expandedGroups}
        onToggleGroup={vm.toggleGroup}
        onOpenRow={vm.openDrawer}
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
