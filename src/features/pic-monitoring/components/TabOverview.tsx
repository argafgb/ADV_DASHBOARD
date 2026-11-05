"use client";

import React, { useState, useMemo } from "react";
import type { DashboardDataset, SanitizedProject } from "../types/types";
import {
  formatPeriodLabel,
  formatMonthSelection,
  monthWindowOf,
  MONTH_OPTIONS,
} from "../utils/period-filter";
import { evaluateStageSla, type StageSlaEvaluation } from "../utils/sla-policy";
import { buildMonthlyProjectPipeline, getProjectIntakeYearMonth, parseProjectDateYearMonth } from "../services/project-data";
import { PicMonitoringModals, type ModalPayload } from "./PicMonitoringModals";

interface TabOverviewProps {
  dataset: DashboardDataset;
  onNavigateToTab: (index: number) => void;
  filteredProjects?: SanitizedProject[];
  slaProjects?: SanitizedProject[];
  startYear?: number;
  endYear?: number;
  month?: string;
  syncTrigger?: number;
}

interface StageEvalItem {
  name: string;
  pct: string;
  data: number;
  ok: number;
  miss: number;
  rate: number;
  delta?: boolean;
  achievedProjects?: SanitizedProject[];
  missedProjects?: SanitizedProject[];
}

interface UatItem {
  name: string;
  status: string;
  tone: "green" | "blue" | "amber" | "red" | "gray";
  n: string;
  originalProject?: SanitizedProject;
}

export function TabOverview({
  dataset,
  onNavigateToTab,
  filteredProjects = [],
  slaProjects = [],
  startYear = 2026,
  endYear = 2026,
  month = "ALL",
}: TabOverviewProps) {
  const [activeModal, setActiveModal] = useState<ModalPayload | null>(null);
  const [uatTab, setUatTab] = useState<"aktif" | "riwayat">("aktif");

  const selectedYear = endYear || startYear || 2026;
  const monthWindow = useMemo(() => monthWindowOf(month), [month]);
  const periodLabel = formatPeriodLabel(selectedYear, monthWindow);

  const slaPeriod = useMemo(() => ({
    year: selectedYear,
    months: monthWindow,
  }), [selectedYear, monthWindow]);

  // 1. Projects Breakdown
  const activeProjects = useMemo(() => {
    return filteredProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      if (st.includes("canceled") || st.includes("cancelled")) return false;

      if (monthWindow !== null) {
        const intake = getProjectIntakeYearMonth(p);
        if (intake) {
          if (intake.year > selectedYear) return false;
          if (intake.year === selectedYear && intake.month > monthWindow.endMonth) return false;
        }
        const liveDate = parseProjectDateYearMonth(
          p["(Live) Realized in Date"] ?? p["(Live) Realized in date"],
        );
        if (liveDate && (st.includes("live") || st.includes("completed"))) {
          if (
            liveDate.year < selectedYear ||
            (liveDate.year === selectedYear && liveDate.month < monthWindow.startMonth)
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [filteredProjects, selectedYear, monthWindow]);

  // Needs Attention Projects (Late / Overdue / SLA Broken)
  const needsAttentionProjects = useMemo(() => {
    return activeProjects.filter((p) => {
      const uatLate = Number(p["(UAT) Late Days"] || 0);
      const devLate = Number(p["(Dev) Late Days"] || 0);
      const fsdLate = Number(p["(FSD) Late Days"] || 0);
      const isLate = uatLate > 0 || devLate > 0 || fsdLate > 0;
      const isNotAchieved =
        p["DEV SLA"] === "Not Achieved" ||
        p["UAT SLA"] === "Not Achieved" ||
        p["FSD SLA"] === "Not Achieved";
      return isLate || isNotAchieved;
    });
  }, [activeProjects]);

  // 2. Milestone SLA stages (dynamically calculated without 2026 fallback lock)
  const stageEvaluations = useMemo<StageEvalItem[]>(() => {
    const defaultData: StageEvalItem[] = [
      { name: "FSD SLA", pct: "0%", data: 0, ok: 0, miss: 0, rate: 0 },
      { name: "DEV SLA", pct: "0%", data: 0, ok: 0, miss: 0, rate: 0, delta: true },
      { name: "SIT SLA", pct: "0%", data: 0, ok: 0, miss: 0, rate: 0 },
      { name: "UAT SLA", pct: "0%", data: 0, ok: 0, miss: 0, rate: 0 },
      { name: "Live SLA", pct: "0%", data: 0, ok: 0, miss: 0, rate: 0 },
    ];

    if (!slaProjects || slaProjects.length === 0) {
      return defaultData;
    }

    const stageKeys = ["FSD", "DEV", "SIT", "UAT", "LIVE"] as const;
    return stageKeys.map((key, idx) => {
      try {
        const evalResult = evaluateStageSla(slaProjects, key, slaPeriod);
        if (evalResult && evalResult.contributors > 0) {
          const rawRate = evalResult.percentage !== null ? Math.round(evalResult.percentage) : 0;
          const rate = Math.min(100, Math.max(0, rawRate));
          return {
            name: `${key === "LIVE" ? "Live" : key} SLA`,
            pct: `${rate}%`,
            data: evalResult.contributors,
            ok: evalResult.achieved,
            miss: evalResult.notAchieved,
            rate,
            delta: key === "DEV",
            achievedProjects: evalResult.achievedProjects,
            missedProjects: evalResult.notAchievedProjects,
          };
        }
      } catch {
        // Fallback
      }
      return defaultData[idx];
    });
  }, [slaProjects, slaPeriod]);

  const achievedStagesCount = stageEvaluations.filter((s) => s.rate >= 93).length;

  // Evaluated projects calculation for KPI Card 2
  const evaluatedProjectsData = useMemo(() => {
    const projectSet = new Set<string>();
    const list: SanitizedProject[] = [];
    stageEvaluations.forEach((s) => {
      [...(s.achievedProjects || []), ...(s.missedProjects || [])].forEach((p) => {
        const id = p.notion_page_id || p.Ticket || p["Project Name"];
        if (id && !projectSet.has(id)) {
          projectSet.add(id);
          list.push(p);
        }
      });
    });
    const totalCount = slaProjects?.length || filteredProjects.length || list.length;
    const count = list.length;
    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return {
      count,
      totalCount,
      pct,
      list,
    };
  }, [stageEvaluations, slaProjects, filteredProjects]);

  // User satisfaction rate dynamically filtered by selectedYear and monthWindow
  const userFeedback = useMemo(() => {
    const targetProjects = filteredProjects.filter((p) => {
      const cd = (p as unknown as { cleansed_data?: Record<string, unknown> }).cleansed_data ?? p;
      let projectYear = "";
      const ly = String(cd["LIVE SLA YEAR"] ?? (p as Record<string, unknown>)["LIVE SLA YEAR"] ?? "").trim();
      if (/^\d{4}$/.test(ly)) projectYear = ly;
      else {
        const ld = String(cd["(Live) Realized in Date"] ?? (p as Record<string, unknown>)["(Live) Realized in Date"] ?? "").trim();
        const ldm = /^(\d{4})/.exec(ld);
        if (ldm) projectYear = ldm[1];
        else {
          const dy = String(cd["DEV SLA YEAR"] ?? (p as Record<string, unknown>)["DEV SLA YEAR"] ?? "").trim();
          if (/^\d{4}$/.test(dy)) projectYear = dy;
          else {
            const tm = /^(\d{2})/.exec(String(p.Ticket || "").trim());
            if (tm) projectYear = String(2000 + Number(tm[1]));
            else {
              const dm = /(?:19|20)\d{2}/.exec(String(cd["Project diajukan"] ?? p._year ?? ""));
              if (dm) projectYear = dm[0];
              else if (p.Year) projectYear = String(p.Year);
            }
          }
        }
      }
      if (projectYear !== String(selectedYear)) return false;

      // Filter month when specific month is selected
      if (monthWindow !== null) {
        const liveDate = parseProjectDateYearMonth(
          cd["(Live) Realized in Date"] ??
            (p as Record<string, unknown>)["(Live) Realized in Date"] ??
            cd["(Live) Realized in date"],
        );
        if (liveDate && liveDate.year === selectedYear) {
          if (
            liveDate.month >= monthWindow.startMonth &&
            liveDate.month <= monthWindow.endMonth
          ) {
            return true;
          }
        }
        const devDate = parseProjectDateYearMonth(
          cd["(Dev) Realized In Date"] ??
            (p as Record<string, unknown>)["(Dev) Realized In Date"] ??
            cd["(Dev) Realized in Date"],
        );
        if (devDate && devDate.year === selectedYear) {
          if (
            devDate.month >= monthWindow.startMonth &&
            devDate.month <= monthWindow.endMonth
          ) {
            return true;
          }
        }
        const intake = getProjectIntakeYearMonth(p);
        if (intake && intake.year === selectedYear) {
          if (
            intake.month >= monthWindow.startMonth &&
            intake.month <= monthWindow.endMonth
          ) {
            return true;
          }
        }
        return false;
      }

      return true;
    });

    const fbVals = targetProjects
      .map((p) => p._feedback)
      .filter((f): f is number => f !== null);

    const evaluated = fbVals.length;
    const avg = evaluated > 0 ? fbVals.reduce((a, b) => a + b, 0) / evaluated : null;
    const score = avg === null ? "-" : avg.toFixed(2);

    return { score, evaluated };
  }, [filteredProjects, selectedYear, monthWindow]);

  // 3. Active Pipeline Groups
  const pipelineGroups = useMemo(() => {
    const inProgProjs: SanitizedProject[] = [];
    const monProjs: SanitizedProject[] = [];
    const queueProjs: SanitizedProject[] = [];
    const uatProjs: SanitizedProject[] = [];
    const holdProjs: SanitizedProject[] = [];

    activeProjects.forEach((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      if (st.includes("hold")) holdProjs.push(p);
      else if (st.includes("queue") || st.includes("pending")) queueProjs.push(p);
      else if (st.includes("uat")) uatProjs.push(p);
      else if (st.includes("monitoring")) monProjs.push(p);
      else if (!st.includes("live") && !st.includes("completed")) inProgProjs.push(p);
      else monProjs.push(p);
    });

    const total = inProgProjs.length + monProjs.length + queueProjs.length + uatProjs.length + holdProjs.length;

    const calcPct = (count: number) => {
      if (total === 0) return { pct: "0%", width: "0%" };
      const p = Math.round((count / total) * 100);
      const w = ((count / total) * 100).toFixed(1);
      return { pct: `${p}%`, width: `${w}%` };
    };

    const inProgStats = calcPct(inProgProjs.length);
    const monStats = calcPct(monProjs.length);
    const queueStats = calcPct(queueProjs.length);
    const uatStats = calcPct(uatProjs.length);
    const holdStats = calcPct(holdProjs.length);

    return [
      {
        name: "In progress",
        n: inProgProjs.length,
        p: inProgStats.pct,
        w: inProgStats.width,
        color: "var(--chart-blue-primary)",
        modal: "inprog" as const,
        projects: inProgProjs,
      },
      {
        name: "Monitoring",
        n: monProjs.length,
        p: monStats.pct,
        w: monStats.width,
        color: "var(--chart-green)",
        modal: "group" as const,
        projects: monProjs,
      },
      {
        name: "Queue",
        n: queueProjs.length,
        p: queueStats.pct,
        w: queueStats.width,
        color: "var(--chart-amber)",
        modal: "group" as const,
        projects: queueProjs,
      },
      {
        name: "UAT",
        n: uatProjs.length,
        p: uatStats.pct,
        w: uatStats.width,
        color: "var(--chart-blue-light)",
        modal: "group" as const,
        projects: uatProjs,
      },
      {
        name: "Hold",
        n: holdProjs.length,
        p: holdStats.pct,
        w: holdStats.width,
        color: "var(--chart-neutral)",
        modal: "group" as const,
        projects: holdProjs,
      },
    ];
  }, [activeProjects]);

  const activeCount = useMemo(() => {
    return pipelineGroups.reduce((acc, g) => acc + g.n, 0);
  }, [pipelineGroups]);

  // 4. Monthly Intake vs Go-Live Data for Line Chart
  const monthlyPipeline = useMemo(() => {
    return buildMonthlyProjectPipeline(filteredProjects, selectedYear, 1, 12);
  }, [filteredProjects, selectedYear]);

  const monthlyData = useMemo(() => {
    const months = monthlyPipeline.months;
    const count = months.length;
    return months.map((m, idx) => {
      const monthOption = MONTH_OPTIONS[m - 1];
      const intake = monthlyPipeline.intakeByMonth[m]?.length || 0;
      const golive = monthlyPipeline.liveByMonth[m]?.length || 0;
      const x = count <= 1 ? 361 : Math.round(32 + (idx + 0.5) * (658 / count));
      const left = `${((idx / count) * 100).toFixed(2)}%`;
      const width = `${((1 / count) * 100).toFixed(2)}%`;

      return {
        monthNum: m,
        name: monthOption?.shortLabel || `Bln ${m}`,
        full: `${monthOption?.label || `Bulan ${m}`} ${selectedYear}`,
        intake,
        golive,
        x,
        left,
        width,
      };
    });
  }, [monthlyPipeline, selectedYear]);

  const totalIntake = useMemo(() => {
    if (monthWindow !== null) {
      return monthlyData
        .filter((m) => m.monthNum >= monthWindow.startMonth && m.monthNum <= monthWindow.endMonth)
        .reduce((acc, m) => acc + m.intake, 0);
    }
    return monthlyData.reduce((acc, m) => acc + m.intake, 0);
  }, [monthlyData, monthWindow]);

  const totalGoLive = useMemo(() => {
    if (monthWindow !== null) {
      return monthlyData
        .filter((m) => m.monthNum >= monthWindow.startMonth && m.monthNum <= monthWindow.endMonth)
        .reduce((acc, m) => acc + m.golive, 0);
    }
    return monthlyData.reduce((acc, m) => acc + m.golive, 0);
  }, [monthlyData, monthWindow]);

  const goLivePct = useMemo(() => {
    if (totalIntake === 0) return 0;
    return Math.round((totalGoLive / totalIntake) * 100);
  }, [totalGoLive, totalIntake]);

  // Scalable SVG Coordinates
  const maxY = useMemo(() => {
    const peak = Math.max(...monthlyData.map((m) => Math.max(m.intake, m.golive)), 0);
    if (peak <= 0) return 24;
    const step = Math.max(6, Math.ceil(peak / 4));
    return step * 4;
  }, [monthlyData]);

  const yTicks = useMemo(() => {
    return [
      { val: maxY, y: 16 },
      { val: Math.round(maxY * 0.75), y: 62 },
      { val: Math.round(maxY * 0.5), y: 108 },
      { val: Math.round(maxY * 0.25), y: 154 },
      { val: 0, y: 200 },
    ];
  }, [maxY]);

  const getYPos = (val: number) => {
    if (maxY <= 0) return 200;
    const ratio = Math.min(1, Math.max(0, val / maxY));
    return 200 - ratio * (200 - 16);
  };

  const intakePoints = useMemo(() => {
    return monthlyData.map((m) => ({ x: m.x, y: Number(getYPos(m.intake).toFixed(1)) }));
  }, [monthlyData, maxY]);

  const golivePoints = useMemo(() => {
    return monthlyData.map((m) => ({ x: m.x, y: Number(getYPos(m.golive).toFixed(1)) }));
  }, [monthlyData, maxY]);

  const intakePolyline = useMemo(
    () => intakePoints.map((p) => `${p.x},${p.y}`).join(" "),
    [intakePoints],
  );
  const golivePolyline = useMemo(
    () => golivePoints.map((p) => `${p.x},${p.y}`).join(" "),
    [golivePoints],
  );

  // 5. UAT Rescheduled Lists
  const getStatusTone = (status: string): "green" | "blue" | "amber" | "red" | "gray" => {
    const st = status.toLowerCase();
    if (st.includes("monitoring") || st.includes("live") || st.includes("done")) return "green";
    if (st.includes("progress") || st.includes("uat")) return "blue";
    if (st.includes("queue") || st.includes("pending")) return "amber";
    if (st.includes("hold") || st.includes("cancel")) return "gray";
    return "blue";
  };

  const uatActiveRows = useMemo<UatItem[]>(() => {
    return activeProjects
      .filter((p) => Number(p["Reschedule UAT"] || 0) > 0)
      .sort((a, b) => Number(b["Reschedule UAT"] || 0) - Number(a["Reschedule UAT"] || 0))
      .map((p) => ({
        name: p["Project Name"] || p.Ticket || "Untitled Project",
        status: p["Last Status"] || "Belum diisi",
        tone: getStatusTone(p["Last Status"] || ""),
        n: String(p["Reschedule UAT"] || 1),
        originalProject: p,
      }));
  }, [activeProjects]);

  const uatHistoryRows = useMemo<UatItem[]>(() => {
    return (filteredProjects || [])
      .filter((p) => Number(p["Reschedule UAT"] || 0) > 0)
      .sort((a, b) => Number(b["Reschedule UAT"] || 0) - Number(a["Reschedule UAT"] || 0))
      .map((p) => ({
        name: p["Project Name"] || p.Ticket || "Untitled Project",
        status: p["Last Status"] || "Belum diisi",
        tone: getStatusTone(p["Last Status"] || ""),
        n: String(p["Reschedule UAT"] || 1),
        originalProject: p,
      }));
  }, [filteredProjects]);

  const uatActiveCount = uatActiveRows.length;
  const uatHistoryCount = uatHistoryRows.length;
  const currentUatList = useMemo(() => {
    return uatTab === "aktif" ? uatActiveRows : uatHistoryRows;
  }, [uatTab, uatActiveRows, uatHistoryRows]);

  // 6. DEV SLA Year-on-Year comparison
  const devSlaYoY = useMemo(() => {
    const prevYear = selectedYear - 1;
    const prevPeriod = { year: prevYear, months: monthWindow };
    const currPeriod = { year: selectedYear, months: monthWindow };
    let prevEval: StageSlaEvaluation<SanitizedProject> | null = null;
    let currEval: StageSlaEvaluation<SanitizedProject> | null = null;

    try {
      prevEval = evaluateStageSla(slaProjects, "DEV", prevPeriod);
    } catch {
      // fallback
    }

    try {
      currEval = evaluateStageSla(slaProjects, "DEV", currPeriod);
    } catch {
      // fallback
    }

    const prevRate = prevEval?.percentage !== null && prevEval?.percentage !== undefined
      ? Math.round(prevEval.percentage)
      : 0;
    const currRate = currEval?.percentage !== null && currEval?.percentage !== undefined
      ? Math.round(currEval.percentage)
      : 0;
    const diff = currRate - prevRate;

    return {
      prevYear,
      currYear: selectedYear,
      prevEval: {
        data: prevEval?.contributors || 0,
        ok: prevEval?.achieved || 0,
        miss: prevEval?.notAchieved || 0,
        rate: prevRate,
        achievedProjects: prevEval?.achievedProjects || [],
        missedProjects: prevEval?.notAchievedProjects || [],
      },
      currEval: {
        data: currEval?.contributors || 0,
        ok: currEval?.achieved || 0,
        miss: currEval?.notAchieved || 0,
        rate: currRate,
        achievedProjects: currEval?.achievedProjects || [],
        missedProjects: currEval?.notAchievedProjects || [],
      },
      diff,
      isUp: diff >= 0,
    };
  }, [slaProjects, selectedYear, monthWindow]);

  return (
    <>
      <div style={{ paddingBottom: 24 }}>
        {/* Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <div>
            <h1 className="dd-page__title">Overview</h1>
            <p className="dd-page__subtitle">
              Ringkasan eksekutif proyek PIC · {periodLabel}
            </p>
          </div>
          <span className="dd-pill dd-pill--green">
            <span className="dd-pill__dot" />
            {activeCount} proyek aktif
          </span>
        </div>

        {/* 4 Top KPI Cards */}
        <div className="dd-kpi-grid dd-kpi-grid--4">
          {/* Card 1: User satisfaction */}
          <div
            className="dd-kpi dd-kpi--accent"
            style={{ textAlign: "left" }}
          >
            <div className="dd-kpi__top">
              <span className="dd-kpi__tile">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />
                </svg>
              </span>
              <span className="dd-kpi__label">User satisfaction rate</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">
                {userFeedback.score !== "-"
                  ? userFeedback.score
                  : monthWindow !== null
                    ? "-"
                    : dataset?.feedback?.score && dataset.feedback.score !== "Belum diisi"
                      ? dataset.feedback.score
                      : "-"}
              </span>
              <span className="dd-kpi__sub">
                {userFeedback.evaluated > 0
                  ? userFeedback.evaluated
                  : monthWindow !== null
                    ? 0
                    : dataset?.feedback?.evaluated || 0} feedback
              </span>
            </div>
          </div>

          {/* Card 2: Evaluated projects */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "kpi",
                title: "Evaluated projects",
                subtitle: `Evaluasi SLA per tahap · ${selectedYear}`,
                kpiKey: "eval",
                kpiData: {
                  num: String(evaluatedProjectsData.count),
                  of: `/${evaluatedProjectsData.totalCount}`,
                  pct: `${evaluatedProjectsData.pct}%`,
                  pctCls: "",
                  hasPct: true,
                  sub: `proyek dievaluasi dari ${evaluatedProjectsData.totalCount} terdaftar`,
                  note: "Jumlah data yang dievaluasi di tiap tahap. Klik tahap untuk melihat proyek not achieved.",
                  rows: stageEvaluations.map((s, idx) => ({
                    name: s.name,
                    val: `${s.data} data · ${s.pct}`,
                    w: s.pct,
                    color: "var(--chart-blue-primary)",
                    cur: "pointer",
                    onClick: () =>
                      setActiveModal({
                        type: "stage",
                        title: `Milestone SLA: ${s.name}`,
                        subtitle: `Evaluasi ketercapaian SLA ${s.name} tahun ${selectedYear}`,
                        stageIdx: idx,
                        stageName: s.name,
                        stageData: {
                          name: s.name,
                          pct: s.pct,
                          data: s.data,
                          ok: s.ok,
                          miss: s.miss,
                          achievedProjects: s.achievedProjects,
                          missedProjects: s.missedProjects,
                        },
                      }),
                  })),
                  goLabel: "Buka Milestone & SLA",
                  onGo: () => onNavigateToTab(3),
                },
              })
            }
          >
            <div className="dd-kpi__top">
              <span className="dd-kpi__tile">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m9 14 2 2 4-4" />
                  <rect x="4" y="4" width="16" height="18" rx="2" />
                </svg>
              </span>
              <span className="dd-kpi__label">Evaluated projects</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{evaluatedProjectsData.count}</span>
              <span className="dd-kpi__sub">proyek</span>
            </div>
          </button>

          {/* Card 3: Go-live this period */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "kpi",
                title: "Go-live this period",
                subtitle: `Realisasi go-live per bulan · ${selectedYear}`,
                kpiKey: "golive",
                kpiData: {
                  num: String(totalGoLive),
                  of: `/${totalIntake}`,
                  pct: `${goLivePct}%`,
                  pctCls: goLivePct >= 70 ? "kpct--green" : "kpct--amber",
                  hasPct: true,
                  sub: `go-live dibanding ${totalIntake} intake ${selectedYear}`,
                  note: `Go-live per bulan tahun ${selectedYear}.`,
                  rows: monthlyData.map((m) => {
                    const maxGolive = Math.max(...monthlyData.map((d) => d.golive), 1);
                    return {
                      name: m.full.replace(` ${selectedYear}`, ""),
                      val: `${m.golive} go-live`,
                      w: `${Math.round((m.golive / maxGolive) * 100)}%`,
                      color: "var(--chart-green)",
                    };
                  }),
                  goLabel: "Buka Pipelines",
                  onGo: () => onNavigateToTab(1),
                },
              })
            }
          >
            <div className="dd-kpi__top">
              <span
                className="dd-kpi__tile"
                style={{
                  background: "var(--status-green-bg)",
                  color: "var(--status-green-fg)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </span>
              <span className="dd-kpi__label">Go-live this period</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{totalGoLive}</span>
              <span className="dd-kpi__sub">proyek</span>
            </div>
          </button>

          {/* Card 4: Needs attention */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "needs",
                title: "Needs attention",
                subtitle: `${needsAttentionProjects.length} proyek aktif melewati SLA tahap`,
                needsProjects: needsAttentionProjects,
              })
            }
          >
            <div className="dd-kpi__top">
              <span
                className="dd-kpi__tile"
                style={{
                  background: "var(--status-red-bg)",
                  color: "var(--status-red-fg)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <span className="dd-kpi__label">Needs attention</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value" style={{ color: "var(--status-red-fg)" }}>
                {needsAttentionProjects.length}
              </span>
              <span className="dd-kpi__sub">proyek telat</span>
            </div>
          </button>
        </div>

        {/* Milestone SLA pipeline */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2 className="dd-card__title">Milestone SLA pipeline</h2>
            <span className="dd-card__subtitle" style={{ margin: 0 }}>
              Target min. 93% · {achievedStagesCount} dari 5 tahap tercapai
            </span>
          </div>

          <div className="dd-sla-grid">
            {stageEvaluations.map((s, idx) => {
              const isTargetMet = s.rate >= 93;
              const fillClass = isTargetMet ? "dd-sla__fill--green" : "dd-sla__fill--red";
              return (
                <div
                  key={s.name}
                  className="dd-sla"
                  style={{ flex: "1 1 190px", cursor: "pointer" }}
                  onClick={() =>
                    setActiveModal({
                      type: "stage",
                      title: `Milestone SLA: ${s.name}`,
                      subtitle: `Evaluasi ketercapaian SLA ${s.name} tahun ${selectedYear}`,
                      stageIdx: idx,
                      stageName: s.name,
                      stageData: {
                        name: s.name,
                        pct: s.pct,
                        data: s.data,
                        ok: s.ok,
                        miss: s.miss,
                        achievedProjects: s.achievedProjects,
                        missedProjects: s.missedProjects,
                      },
                    })
                  }
                >
                  <div className="dd-sla__top">
                    <span className="dd-sla__label" style={{ minHeight: 0 }}>
                      {s.name}
                    </span>
                    <span className="dd-sla__period">
                      {monthWindow !== null ? `${selectedYear} · ${formatMonthSelection(month)}` : selectedYear}
                    </span>
                  </div>
                  <div className="dd-sla__value">{s.pct}</div>
                  <div className="dd-sla__track">
                    <div
                      className={`dd-sla__fill ${fillClass}`}
                      style={{ width: s.pct }}
                    />
                  </div>
                  <div className="dd-sla__foot" style={{ marginTop: 14 }}>
                    <div className="dd-sla__stat">
                      <span className="dd-sla__statlabel">Achieved</span>
                      <span className="dd-sla__statval dd-sla__statval--green">
                        {s.ok}
                      </span>
                    </div>
                    <button
                      className="dd-sla__stat dd-sla__stat--btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModal({
                          type: "stage",
                          title: `Milestone SLA: ${s.name}`,
                          subtitle: `Daftar proyek Not Achieved pada tahap ${s.name}`,
                          stageIdx: idx,
                          stageName: s.name,
                          stageData: {
                            name: s.name,
                            pct: s.pct,
                            data: s.data,
                            ok: s.ok,
                            miss: s.miss,
                            achievedProjects: s.achievedProjects,
                            missedProjects: s.missedProjects,
                          },
                        });
                      }}
                    >
                      <span className="dd-sla__statlabel dd-sla__statlabel--link">
                        Not achieved
                      </span>
                      <span className="dd-sla__statval dd-sla__statval--red">
                        {s.miss}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Focus Row: Intake vs Go-Live + Active Pipeline */}
        <div className="dd-cardrow dd-cardrow--focus" style={{ marginTop: 10 }}>
          {/* Card: Intake vs Go-Live */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">Intake vs go-live</h2>
                <p className="dd-card__subtitle">
                  Proyek baru dan realisasi go-live per bulan · arahkan kursor ke bulan
                </p>
              </div>
              <div className="dd-card__actions">
                <button
                  className="dd-btn dd-btn--soft dd-btn--sm"
                  type="button"
                  onClick={() =>
                    setActiveModal({
                      type: "registry",
                      title: "Registry intake & go-live",
                      subtitle: `Log proyek masuk dan go-live tahun ${selectedYear}`,
                      registryProjects: activeProjects,
                    })
                  }
                >
                  Lihat log intake
                </button>
              </div>
            </div>

            <div className="dd-card__body" style={{ justifyContent: "flex-start" }}>
              <div className="dd-chart__legend" style={{ marginBottom: 10 }}>
                <span className="dd-chart__legenditem">
                  <span
                    className="dd-chart__dot dd-chart__dot--round"
                    style={{ background: "var(--chart-green)" }}
                  />
                  Go-live <span className="dd-chart__legendval">{totalGoLive}</span>
                </span>
                <span className="dd-chart__legenditem">
                  <span
                    className="dd-chart__dot dd-chart__dot--round"
                    style={{ background: "var(--chart-blue-primary)" }}
                  />
                  Intake <span className="dd-chart__legendval">{totalIntake}</span>
                </span>
              </div>

              <div style={{ position: "relative" }}>
                <svg
                  className="dd-line"
                  viewBox="0 0 700 226"
                  role="img"
                  aria-label={`Intake dan go-live per bulan tahun ${selectedYear}`}
                >
                  {/* Grid lines */}
                  <line className="dd-chart__grid" x1="32" y1="16" x2="690" y2="16" />
                  <line className="dd-chart__grid" x1="32" y1="62" x2="690" y2="62" />
                  <line className="dd-chart__grid" x1="32" y1="108" x2="690" y2="108" />
                  <line className="dd-chart__grid" x1="32" y1="154" x2="690" y2="154" />
                  <line className="dd-chart__axisline" x1="32" y1="200" x2="690" y2="200" />
                  <line className="dd-chart__axisline" x1="32" y1="16" x2="32" y2="200" />

                  {/* Y Axis text */}
                  <g textAnchor="end">
                    {yTicks.map((t) => (
                      <text key={t.y} className="dd-chart__axis" x="24" y={t.y + 4}>
                        {t.val}
                      </text>
                    ))}
                  </g>

                  {/* X Axis text */}
                  <g textAnchor="middle">
                    {monthlyData.map((m) => {
                      const isSelected =
                        monthWindow !== null &&
                        m.monthNum >= monthWindow.startMonth &&
                        m.monthNum <= monthWindow.endMonth;
                      return (
                        <text
                          key={m.name}
                          className="dd-chart__axis"
                          x={m.x}
                          y="220"
                          style={
                            isSelected
                              ? {
                                  fill: "var(--chart-blue-primary)",
                                  fontWeight: 700,
                                }
                              : undefined
                          }
                        >
                          {m.name}
                        </text>
                      );
                    })}
                  </g>

                  {/* Intake Polyline (Blue) */}
                  <polyline
                    points={intakePolyline}
                    fill="none"
                    stroke="var(--chart-blue-primary)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Go-Live Polyline (Green) */}
                  <polyline
                    points={golivePolyline}
                    fill="none"
                    stroke="var(--chart-green)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Blue Dots */}
                  <g className="dd-line__dot" stroke="var(--chart-blue-primary)">
                    {intakePoints.map((p, i) => {
                      const m = monthlyData[i];
                      const isSelected =
                        monthWindow !== null &&
                        m &&
                        m.monthNum >= monthWindow.startMonth &&
                        m.monthNum <= monthWindow.endMonth;
                      return (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={isSelected ? "5.5" : "3.5"}
                          strokeWidth={isSelected ? "2.5" : "2"}
                        />
                      );
                    })}
                  </g>

                  {/* Green Dots */}
                  <g className="dd-line__dot" stroke="var(--chart-green)">
                    {golivePoints.map((p, i) => {
                      const m = monthlyData[i];
                      const isSelected =
                        monthWindow !== null &&
                        m &&
                        m.monthNum >= monthWindow.startMonth &&
                        m.monthNum <= monthWindow.endMonth;
                      return (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={isSelected ? "5.5" : "3.5"}
                          strokeWidth={isSelected ? "2.5" : "2"}
                        />
                      );
                    })}
                  </g>
                </svg>

                {/* Hover Columns Overlay */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    pointerEvents: "none",
                  }}
                >
                  {monthlyData.map((m, i) => {
                    const isRightSide = i >= Math.floor(monthlyData.length / 2);
                    const isSelected =
                      monthWindow !== null &&
                      m.monthNum >= monthWindow.startMonth &&
                      m.monthNum <= monthWindow.endMonth;
                    return (
                      <div
                        key={m.name}
                        className={`hv hvcol ${isSelected ? "hvcol--active" : ""}`}
                        tabIndex={0}
                        style={{
                          left: m.left,
                          width: m.width,
                          background: isSelected
                            ? "rgba(59, 130, 246, 0.08)"
                            : undefined,
                          borderRadius: 6,
                        }}
                      >
                        <span className="gl2" style={{ left: "50%" }} />
                        <div
                          className="tip"
                          style={{
                            [isRightSide ? "right" : "left"]: "62%",
                            top: 10,
                          }}
                        >
                          <div className="tipcard">
                            <div className="tipcard__h">{m.full}</div>
                            <div className="tipcard__r">
                              <span>Intake</span>
                              <span>{m.intake} proyek</span>
                            </div>
                            <div className="tipcard__r">
                              <span>Go-live</span>
                              <span>{m.golive} proyek</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Card: Active Pipeline */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">Active pipeline</h2>
                <p className="dd-card__subtitle">Klik tahap untuk melihat proyek</p>
              </div>
            </div>
            <div
              className="dd-card__body"
              style={{ justifyContent: "flex-start", gap: 14 }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  className="dd-num"
                  style={{
                    font: "var(--text-hero)",
                    letterSpacing: "var(--ls-display)",
                  }}
                >
                  {activeCount}
                </span>
                <span style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>
                  proyek aktif
                </span>
              </div>

              {/* Segmented Bar Track */}
              <div className="dd-comp__track">
                {pipelineGroups.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    className="dd-seg-part"
                    title={`${g.name} · ${g.n} proyek`}
                    aria-label={`${g.name} ${g.n} proyek`}
                    onClick={() => {
                      if (g.modal === "inprog") {
                        setActiveModal({
                          type: "inprog",
                          title: "In progress projects",
                          subtitle: `${g.n} proyek di FSD, DEV, SIT dan change request`,
                        });
                      } else {
                        setActiveModal({
                          type: "group",
                          title: g.name,
                          subtitle: `${g.n} proyek aktif`,
                          groupName: g.name,
                          groupCount: g.n,
                        });
                      }
                    }}
                    style={{
                      width: g.w,
                      background: g.color,
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>

              {/* Breakdown Legend List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, margin: "0 -7px" }}>
                {pipelineGroups.map((g) => (
                  <button
                    key={g.name}
                    className="dd-donut__lrow"
                    type="button"
                    onClick={() => {
                      if (g.modal === "inprog") {
                        setActiveModal({
                          type: "inprog",
                          title: "In progress projects",
                          subtitle: `${g.n} proyek di FSD, DEV, SIT dan change request`,
                        });
                      } else {
                        setActiveModal({
                          type: "group",
                          title: g.name,
                          subtitle: `${g.n} proyek aktif`,
                          groupName: g.name,
                          groupCount: g.n,
                        });
                      }
                    }}
                    style={{
                      border: 0,
                      background: "transparent",
                      fontFamily: "inherit",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <span className="dd-chart__dot" style={{ background: g.color }} />
                    <span className="dd-donut__lname" style={{ textAlign: "left" }}>
                      {g.name}
                    </span>
                    <span className="dd-donut__lcount">{g.n}</span>
                    <span className="dd-donut__lpct">{g.p}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Equal Row: UAT Rescheduled + DEV SLA Year-on-Year */}
        <div className="dd-cardrow dd-cardrow--equal" style={{ "--cols": 2, marginTop: 10 } as React.CSSProperties}>
          {/* Card: UAT Rescheduled */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">UAT rescheduled</h2>
                <p className="dd-card__subtitle">Proyek dengan jadwal UAT bergeser</p>
              </div>
              <div className="dd-card__actions">
                <div className="dd-seg" role="tablist">
                  <button
                    className={`dd-seg__btn ${uatTab === "aktif" ? "dd-seg__btn--active" : ""}`}
                    type="button"
                    role="tab"
                    onClick={() => setUatTab("aktif")}
                  >
                    Aktif {uatActiveCount}
                  </button>
                  <button
                    className={`dd-seg__btn ${uatTab === "riwayat" ? "dd-seg__btn--active" : ""}`}
                    type="button"
                    role="tab"
                    onClick={() => setUatTab("riwayat")}
                  >
                    Riwayat {uatHistoryCount}
                  </button>
                </div>
              </div>
            </div>

            <div
              className="dd-card__body"
              style={{ justifyContent: "flex-start", marginTop: 12 }}
            >
              {currentUatList.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {currentUatList.slice(0, 10).map((u, i) => (
                    <div
                      key={u.originalProject?.notion_page_id || `${u.name}-${i}`}
                      onClick={() => {
                        if (u.originalProject) {
                          setActiveModal({
                            type: "project",
                            title: u.name,
                            subtitle: `Status: ${u.status}`,
                            project: u.originalProject,
                          });
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: u.originalProject ? "pointer" : "default",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          font: "var(--text-cell)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.name}
                      </span>
                      <span className={`dd-pill dd-pill--${u.tone}`}>
                        <span className="dd-pill__dot" />
                        {u.status}
                      </span>
                      <span
                        className="dd-count"
                        style={{ minWidth: 36, justifyContent: "center" }}
                      >
                        {u.n}×
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dd-empty">
                  <div className="dd-empty__title">
                    {uatTab === "aktif"
                      ? "Tidak ada proyek reschedule aktif"
                      : "Tidak ada riwayat reschedule"}
                  </div>
                  <div className="dd-empty__msg">
                    {uatTab === "aktif"
                      ? "Semua proyek aktif berjalan sesuai jadwal UAT."
                      : "Belum ada catatan reschedule UAT pada periode ini."}
                  </div>
                </div>
              )}

              {/* Review button banner at bottom */}
              <button
                type="button"
                onClick={() => onNavigateToTab(2)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  padding: "10px 12px",
                  border: 0,
                  cursor: "pointer",
                  borderRadius: "var(--radius-panel)",
                  background: "var(--status-red-bg)",
                  color: "var(--status-red-fg)",
                  font: "var(--text-control)",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span style={{ flex: 1 }}>{needsAttentionProjects.length} proyek masih terlambat</span>
                <span>Review →</span>
              </button>
            </div>
          </section>

          {/* Card: DEV SLA Year-on-Year */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">DEV SLA year-on-year</h2>
                <p className="dd-card__subtitle">
                  Ketercapaian SLA Development per tahun · klik bar untuk detail
                </p>
              </div>
              <div className="dd-card__actions">
                <span className={`dd-delta ${devSlaYoY.isUp ? "dd-delta--up" : "dd-delta--down"}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    {devSlaYoY.isUp ? (
                      <path d="M12 6 4 16h16z" />
                    ) : (
                      <path d="M12 18 4 8h16z" />
                    )}
                  </svg>
                  {Math.abs(devSlaYoY.diff)} pt
                </span>
              </div>
            </div>

            <div
              className="dd-card__body"
              style={{ justifyContent: "stretch", flex: 1, minHeight: 0 }}
            >
              <div
                role="img"
                aria-label={`DEV SLA ${devSlaYoY.prevYear} ${devSlaYoY.prevEval.rate} persen, ${devSlaYoY.currYear} ${devSlaYoY.currEval.rate} persen, target 93 persen`}
                style={{
                  flex: 1,
                  minHeight: 200,
                  display: "grid",
                  gridTemplateColumns: "40px minmax(0, 1fr)",
                  gridTemplateRows: "minmax(0, 1fr) 24px",
                  columnGap: 8,
                }}
              >
                {/* Y Axis ticks */}
                <div
                  style={{
                    position: "relative",
                    font: "var(--text-axis)",
                    color: "var(--chart-axis)",
                  }}
                >
                  <span style={{ position: "absolute", right: 0, top: 0, transform: "translateY(-50%)" }}>100%</span>
                  <span style={{ position: "absolute", right: 0, top: "25%", transform: "translateY(-50%)" }}>75%</span>
                  <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>50%</span>
                  <span style={{ position: "absolute", right: 0, top: "75%", transform: "translateY(-50%)" }}>25%</span>
                  <span style={{ position: "absolute", right: 0, top: "100%", transform: "translateY(-50%)" }}>0%</span>
                </div>

                {/* Plot Area */}
                <div
                  style={{
                    position: "relative",
                    marginTop: 22,
                    borderLeft: "1px solid var(--chart-axis)",
                    borderBottom: "1px solid var(--chart-axis)",
                  }}
                >
                  {/* Grid lines */}
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "25%", borderTop: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "50%", borderTop: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "75%", borderTop: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "100%", borderTop: "1px solid var(--chart-grid)" }} />

                  {/* Target 93% line */}
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "93%", borderTop: "1.5px dashed var(--chart-green)" }} />
                  <span
                    style={{
                      position: "absolute",
                      right: 4,
                      bottom: "calc(93% + 3px)",
                      font: "var(--text-axis)",
                      color: "var(--status-green-fg)",
                    }}
                  >
                    Target 93%
                  </span>

                  {/* Bar Prev Year */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: `DEV SLA ${devSlaYoY.prevYear}`,
                        subtitle: `Detail pencapaian SLA Development tahun ${devSlaYoY.prevYear}`,
                        stageData: {
                          name: `DEV SLA ${devSlaYoY.prevYear}`,
                          pct: `${devSlaYoY.prevEval.rate}%`,
                          data: devSlaYoY.prevEval.data,
                          ok: devSlaYoY.prevEval.ok,
                          miss: devSlaYoY.prevEval.miss,
                          achievedProjects: devSlaYoY.prevEval.achievedProjects,
                          missedProjects: devSlaYoY.prevEval.missedProjects,
                        },
                      })
                    }
                    aria-label={`DEV SLA ${devSlaYoY.prevYear}, klik untuk detail`}
                    style={{
                      position: "absolute",
                      left: "22%",
                      width: "22%",
                      bottom: 0,
                      height: `${Math.min(100, Math.max(0, devSlaYoY.prevEval.rate))}%`,
                      background: "none",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className="bar"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "var(--chart-blue-light)",
                        borderRadius: "6px 6px 0 0",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: -20,
                        textAlign: "center",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      {devSlaYoY.prevEval.rate}%
                    </span>
                    <span
                      className="tip tipcard"
                      style={{ left: "calc(100% + 12px)", top: 0 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun {devSlaYoY.prevYear}</span>
                        <span className="dd-pill dd-pill--blue">
                          <span className="dd-pill__dot" />
                          {devSlaYoY.prevEval.rate}% SLA
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Jumlah data</span>
                        <span>{devSlaYoY.prevEval.data} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Achieved</span>
                        <span style={{ color: "var(--status-green-fg)" }}>
                          {devSlaYoY.prevEval.ok} proyek
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Not achieved</span>
                        <span style={{ color: "var(--status-red-fg)" }}>
                          {devSlaYoY.prevEval.miss} proyek
                        </span>
                      </span>
                      <span className="dd-table__secondary" style={{ margin: 0 }}>
                        Klik untuk melihat detail
                      </span>
                    </span>
                  </button>

                  {/* Bar Curr Year */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: `DEV SLA ${devSlaYoY.currYear}`,
                        subtitle: `Detail pencapaian SLA Development tahun ${devSlaYoY.currYear}`,
                        stageData: {
                          name: `DEV SLA ${devSlaYoY.currYear}`,
                          pct: `${devSlaYoY.currEval.rate}%`,
                          data: devSlaYoY.currEval.data,
                          ok: devSlaYoY.currEval.ok,
                          miss: devSlaYoY.currEval.miss,
                          achievedProjects: devSlaYoY.currEval.achievedProjects,
                          missedProjects: devSlaYoY.currEval.missedProjects,
                        },
                      })
                    }
                    aria-label={`DEV SLA ${devSlaYoY.currYear}, klik untuk detail`}
                    style={{
                      position: "absolute",
                      left: "58%",
                      width: "22%",
                      bottom: 0,
                      height: `${Math.min(100, Math.max(0, devSlaYoY.currEval.rate))}%`,
                      background: "none",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      className="bar"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "var(--chart-blue-primary)",
                        borderRadius: "6px 6px 0 0",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: -20,
                        textAlign: "center",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      {devSlaYoY.currEval.rate}%
                    </span>
                    <span
                      className="tip tipcard"
                      style={{ right: "calc(100% + 12px)", top: 0 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun {devSlaYoY.currYear}</span>
                        <span className="dd-pill dd-pill--blue">
                          <span className="dd-pill__dot" />
                          {devSlaYoY.currEval.rate}% SLA
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Jumlah data</span>
                        <span>{devSlaYoY.currEval.data} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Achieved</span>
                        <span style={{ color: "var(--status-green-fg)" }}>
                          {devSlaYoY.currEval.ok} proyek
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Not achieved</span>
                        <span style={{ color: "var(--status-red-fg)" }}>
                          {devSlaYoY.currEval.miss} proyek
                        </span>
                      </span>
                      <span className="dd-table__secondary" style={{ margin: 0 }}>
                        Klik untuk melihat detail
                      </span>
                    </span>
                  </button>
                </div>

                <div />
                {/* X Axis labels */}
                <div
                  style={{
                    position: "relative",
                    font: "var(--text-axis)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "33%",
                      transform: "translateX(-50%)",
                      top: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {devSlaYoY.prevYear} · {devSlaYoY.prevEval.data} data
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: "69%",
                      transform: "translateX(-50%)",
                      top: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {devSlaYoY.currYear} · {devSlaYoY.currEval.data} data
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Shared Modals */}
      <PicMonitoringModals
        modal={activeModal}
        onClose={() => setActiveModal(null)}
        onSelectProject={(project) =>
          setActiveModal({
            type: "project",
            title: project["Project Name"],
            subtitle: `${project.Ticket} · ${project["Type Project"]}`,
            project,
          })
        }
      />
    </>
  );
}
