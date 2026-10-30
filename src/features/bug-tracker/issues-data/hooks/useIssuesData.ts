"use client";

import { useMemo, useState } from "react";
import {
  IssueItem,
  IssueGroup,
  IssueTypeFilter,
  GroupByOption,
} from "../types/issuesData";
import {
  filterIssues,
  buildSeverityDonut,
  buildSevLegend,
  buildHeatmap,
  buildMonthBars,
  monthlyPeak,
  groupIssues,
  paginate,
  fmtId,
} from "../utils/issuesDataUtils";

export function useIssuesData(
  items: IssueItem[],
  year: number,
  initialQuery: string = "",
  prevItems: IssueItem[] = [],
  prevYear: number | null = null,
) {
  const [q, setQ] = useState(initialQuery);
  const [fType, setFType] = useState<IssueTypeFilter>("All type");
  const [fSeverity, setFSeverity] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [fStage, setFStage] = useState("All stage");
  const [groupBy, setGroupBy] = useState<GroupByOption>("Default");
  const [page, setPage] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [chartsOn, setChartsOn] = useState(true);

  const filtered = useMemo(
    () => filterIssues(items, { q, fType, fSeverity, fStatus, fStage }),
    [items, q, fType, fSeverity, fStatus, fStage],
  );

  const donut = useMemo(() => buildSeverityDonut(filtered), [filtered]);
  const legend = useMemo(() => buildSevLegend(filtered), [filtered]);
  const heatmap = useMemo(() => buildHeatmap(filtered), [filtered]);
  const filteredPrev = useMemo(
    () => filterIssues(prevItems, { q, fType, fSeverity, fStatus, fStage }),
    [prevItems, q, fType, fSeverity, fStatus, fStage],
  );
  // Skala tinggi batang disamakan agar dua kartu berdampingan sebanding.
  const barScale = useMemo(
    () => Math.max(monthlyPeak(filtered), monthlyPeak(filteredPrev)),
    [filtered, filteredPrev],
  );
  const monthBars = useMemo(
    () => buildMonthBars(filtered, year, barScale),
    [filtered, year, barScale],
  );
  const monthBarsPrev = useMemo(
    () =>
      prevYear === null
        ? null
        : buildMonthBars(filteredPrev, prevYear, barScale),
    [filteredPrev, prevYear, barScale],
  );
  const legendPrev = useMemo(
    () => (prevYear === null ? null : buildSevLegend(filteredPrev)),
    [filteredPrev, prevYear],
  );

  const grouped = groupBy !== "Default";
  const groups = useMemo(
    () => groupIssues(filtered, groupBy),
    [filtered, groupBy],
  );

  const flatPage = useMemo(
    () => paginate(filtered, page, 50),
    [filtered, page],
  );
  const groupPage = useMemo<ReturnType<typeof paginate<IssueGroup>>>(
    () => paginate(groups, page, 8),
    [groups, page],
  );

  const pg = grouped ? groupPage : flatPage;

  const subLabel =
    `${fmtId(filtered.length)} record aktif` +
    (grouped ? ` · dikelompokkan per ${groupBy.toLowerCase()}` : "");

  const footLabel = grouped
    ? `${fmtId(groups.length)} grup · halaman ${pg.page} dari ${pg.totalPages}`
    : `${fmtId(filtered.length)} record · halaman ${pg.page} dari ${pg.totalPages} · 50 per halaman`;

  const drawerItem = useMemo(
    () => (drawerId ? (items.find((r) => r.id === drawerId) ?? null) : null),
    [drawerId, items],
  );

  const resetPage = () => setPage(1);

  return {
    // state
    q,
    fType,
    fSeverity,
    fStatus,
    fStage,
    groupBy,
    chartsOn,
    expandedGroups,
    drawerItem,
    // setters
    setQ: (v: string) => {
      setQ(v);
      resetPage();
    },
    setFType: (v: IssueTypeFilter) => {
      setFType(v);
      resetPage();
    },
    setFSeverity: (v: string) => {
      setFSeverity(v);
      resetPage();
    },
    setFStatus: (v: string) => {
      setFStatus(v);
      resetPage();
    },
    setFStage: (v: string) => {
      setFStage(v);
      resetPage();
    },
    setGroupBy: (v: GroupByOption) => {
      setGroupBy(v);
      setExpandedGroups({});
      resetPage();
    },
    toggleCharts: () => setChartsOn((v) => !v),
    toggleGroup: (key: string) =>
      setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] })),
    openDrawer: (id: string) => setDrawerId(id),
    closeDrawer: () => setDrawerId(null),
    prevPage: () => setPage(Math.max(1, pg.page - 1)),
    nextPage: () => setPage(Math.min(pg.totalPages, pg.page + 1)),
    gotoPage: (n: number) => setPage(n),
    // derived
    filtered,
    donut,
    legend,
    legendPrev,
    heatmap,
    monthBars,
    monthBarsPrev,
    year,
    prevYear,
    grouped,
    flatRows: grouped ? [] : flatPage.slice,
    flatStartIndex: (flatPage.page - 1) * 50,
    groupRows: grouped ? groupPage.slice : [],
    pageNumbers: pg.pageNumbers,
    currentPage: pg.page,
    totalPages: pg.totalPages,
    subLabel,
    footLabel,
    isEmpty: filtered.length === 0,
  };
}
