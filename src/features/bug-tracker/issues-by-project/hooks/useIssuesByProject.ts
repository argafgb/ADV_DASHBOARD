"use client";

import { useMemo, useState } from "react";
import { paginate, fmtId } from "@/features/bug-tracker/issues-data/utils/issuesDataUtils";
import {
  IssuesByProjectPayload,
  ProjectSortOption,
} from "../types/issuesByProject";
import {
  buildTopProjects,
  buildFoundVsClosed,
  foundVsClosedPeak,
  buildBugCrChart,
  bugCrPeak,
  buildProjectGroups,
} from "../utils/issuesByProjectUtils";

export function useIssuesByProject(data: IssuesByProjectPayload, year: number) {
  const [qProj, setQProj] = useState("");
  const [sortProj, setSortProj] = useState<ProjectSortOption>("Terbaru");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [chartsOn, setChartsOn] = useState(true);

  const topProjects = useMemo(() => buildTopProjects(data.items), [data.items]);
  const foundVsClosed = useMemo(
    () => buildFoundVsClosed(data.foundPerMonth, data.closedPerMonth),
    [data.foundPerMonth, data.closedPerMonth],
  );
  const foundVsClosedPrev = useMemo(
    () =>
      data.foundPerMonthPrev === null || data.prevYear === null
        ? null
        : buildFoundVsClosed(
            data.foundPerMonthPrev,
            data.closedPerMonthPrev ?? Array.from({ length: 12 }, () => 0),
          ),
    [data.foundPerMonthPrev, data.closedPerMonthPrev, data.prevYear],
  );
  // Sumbu Y dikunci pada nilai tertinggi kedua tahun supaya kemiringan garis
  // di kartu kiri dan kanan bisa dibandingkan langsung.
  const foundVsClosedMax = useMemo(
    () =>
      Math.max(
        foundVsClosedPeak(foundVsClosed),
        foundVsClosedPrev ? foundVsClosedPeak(foundVsClosedPrev) : 0,
        1,
      ),
    [foundVsClosed, foundVsClosedPrev],
  );
  // Skala batang disamakan agar kartu tahun ini dan tahun lalu sebanding.
  const bugCrScale = useMemo(
    () => Math.max(bugCrPeak(data.items), bugCrPeak(data.prevItems)),
    [data.items, data.prevItems],
  );
  const bugCr = useMemo(
    () => buildBugCrChart(data.items, year, bugCrScale),
    [data.items, year, bugCrScale],
  );
  const bugCrPrev = useMemo(
    () =>
      data.prevYear === null
        ? null
        : buildBugCrChart(data.prevItems, data.prevYear, bugCrScale),
    [data.prevItems, data.prevYear, bugCrScale],
  );

  const groups = useMemo(
    () => buildProjectGroups(data.items, qProj, sortProj),
    [data.items, qProj, sortProj],
  );

  const pg = useMemo(() => paginate(groups, page, 8), [groups, page]);

  const subLabel = `${fmtId(groups.length)} project dengan temuan`;
  const footLabel = `${fmtId(groups.length)} project · halaman ${pg.page} dari ${pg.totalPages}`;

  const drawerItem = useMemo(
    () =>
      drawerId ? (data.items.find((r) => r.id === drawerId) ?? null) : null,
    [drawerId, data.items],
  );

  return {
    // state
    qProj,
    sortProj,
    chartsOn,
    expanded,
    drawerItem,
    // setters
    setQProj: (v: string) => {
      setQProj(v);
      setPage(1);
    },
    setSortProj: (v: ProjectSortOption) => {
      setSortProj(v);
      setPage(1);
      setExpanded({});
    },
    pickProject: (name: string) => {
      setQProj(name);
      setPage(1);
    },
    toggleCharts: () => setChartsOn((v) => !v),
    toggleGroup: (key: string) =>
      setExpanded((prev) => ({ ...prev, [key]: !prev[key] })),
    openDrawer: (id: string) => setDrawerId(id),
    closeDrawer: () => setDrawerId(null),
    prevPage: () => setPage(Math.max(1, pg.page - 1)),
    nextPage: () => setPage(Math.min(pg.totalPages, pg.page + 1)),
    gotoPage: (n: number) => setPage(n),
    // derived
    topProjects,
    foundVsClosed,
    foundVsClosedPrev,
    foundVsClosedMax,
    bugCr,
    bugCrPrev,
    year,
    prevYear: data.prevYear,
    groups,
    pageGroups: pg.slice,
    pageNumbers: pg.pageNumbers,
    currentPage: pg.page,
    totalPages: pg.totalPages,
    subLabel,
    footLabel,
    isEmpty: groups.length === 0,
  };
}
