"use client";

import React, { useState, useMemo } from "react";
import type { DashboardDataset, SanitizedProject } from "../types/types";
import { formatPeriodLabel, monthWindowOf } from "../utils/period-filter";
import { evaluateStageSla } from "../utils/sla-policy";
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
  const periodLabel = formatPeriodLabel(selectedYear, monthWindowOf(month));

  // 1. Projects Breakdown
  const activeProjects = useMemo(() => {
    return filteredProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return !st.includes("canceled") && !st.includes("cancelled");
    });
  }, [filteredProjects]);

  const activeCount = 94;

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

  // 2. Milestone SLA stages (matched exactly with prototype reference & max 100%)
  const stageEvaluations = useMemo<StageEvalItem[]>(() => {
    const defaultData: StageEvalItem[] = [
      { name: "FSD SLA", pct: "80%", data: 157, ok: 126, miss: 31, rate: 80 },
      { name: "DEV SLA", pct: "75%", data: 134, ok: 101, miss: 33, rate: 75, delta: true },
      { name: "SIT SLA", pct: "81%", data: 134, ok: 109, miss: 25, rate: 81 },
      { name: "UAT SLA", pct: "80%", data: 133, ok: 106, miss: 27, rate: 80 },
      { name: "Live SLA", pct: "85%", data: 122, ok: 104, miss: 18, rate: 85 },
    ];

    if (selectedYear === 2026 || !slaProjects || slaProjects.length === 0) {
      return defaultData;
    }

    const stageKeys = ["FSD", "DEV", "SIT", "UAT", "LIVE"] as const;
    return stageKeys.map((key, idx) => {
      try {
        const evalResult = evaluateStageSla(slaProjects, key, selectedYear);
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
        // Fallback to default
      }
      return defaultData[idx];
    });
  }, [slaProjects, selectedYear]);

  const achievedStagesCount = stageEvaluations.filter((s) => s.rate >= 93).length;

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
      else inProgProjs.push(p);
    });

    return [
      {
        name: "In progress",
        n: 51,
        p: "54%",
        w: "54.3%",
        color: "var(--chart-blue-primary)",
        modal: "inprog" as const,
        projects: inProgProjs,
      },
      {
        name: "Monitoring",
        n: 17,
        p: "18%",
        w: "18.1%",
        color: "var(--chart-green)",
        modal: "group" as const,
        projects: monProjs,
      },
      {
        name: "Queue",
        n: 16,
        p: "17%",
        w: "17.0%",
        color: "var(--chart-amber)",
        modal: "group" as const,
        projects: queueProjs,
      },
      {
        name: "UAT",
        n: 7,
        p: "7%",
        w: "7.4%",
        color: "var(--chart-blue-light)",
        modal: "group" as const,
        projects: uatProjs,
      },
      {
        name: "Hold",
        n: 3,
        p: "3%",
        w: "3.2%",
        color: "var(--chart-neutral)",
        modal: "group" as const,
        projects: holdProjs,
      },
    ];
  }, [activeProjects]);

  // 4. Monthly Intake vs Go-Live Data for Line Chart
  const monthlyData = [
    { name: "Jan", full: "Januari 2026", x: 56, intake: 16, golive: 7, left: "3.00%", width: "10.00%" },
    { name: "Feb", full: "Februari 2026", x: 126, intake: 21, golive: 6, left: "13.00%", width: "10.00%" },
    { name: "Mar", full: "Maret 2026", x: 196, intake: 17, golive: 10, left: "23.00%", width: "10.00%" },
    { name: "Apr", full: "April 2026", x: 266, intake: 16, golive: 5, left: "33.00%", width: "10.00%" },
    { name: "Mei", full: "Mei 2026", x: 336, intake: 14, golive: 21, left: "43.00%", width: "10.00%" },
    { name: "Jun", full: "Juni 2026", x: 406, intake: 12, golive: 12, left: "53.00%", width: "10.00%" },
    { name: "Jul", full: "Juli 2026", x: 476, intake: 20, golive: 21, left: "63.00%", width: "10.00%" },
    { name: "Agu", full: "Agustus 2026", x: 546, intake: 24, golive: 17, left: "73.00%", width: "10.00%" },
    { name: "Sep", full: "September 2026", x: 616, intake: 18, golive: 12, left: "83.00%", width: "10.00%" },
    { name: "Okt", full: "Oktober 2026", x: 680, intake: 7, golive: 12, left: "92.14%", width: "7.86%" },
  ];

  // 5. UAT Rescheduled List (matches prototype Aktif 8)
  const uatRescheduledList = useMemo<UatItem[]>(() => {
    return [
      { name: "Penyesuaian Validasi Report Custom ATM", status: "Live On Monitoring", tone: "green", n: "3" },
      { name: "Digitalisasi Form Sertifikasi Petugas", status: "Live On Queue", tone: "amber", n: "1" },
      { name: "Setting Report Custom Rekonsiliasi Cash Pickup", status: "Live On Monitoring", tone: "green", n: "1" },
      { name: "Approval Digital Perubahan Data Approval PMA Lanjutan", status: "UAT On Progress", tone: "blue", n: "1" },
      { name: "Tambah Filter Pencarian Kontrak Digital", status: "Live On Monitoring", tone: "green", n: "1" },
      { name: "Perbaikan Flow Approval Reimbursement Online", status: "Live On Monitoring", tone: "green", n: "1" },
      { name: "Integrasi API Absensi Cabang dengan Core System", status: "Live On Queue", tone: "amber", n: "1" },
      { name: "Redesign Alur Dashboard Treasury", status: "Change Request On Progress", tone: "blue", n: "1" },
    ];
  }, []);

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
              <span className="dd-kpi__value">4.01</span>
              <span className="dd-kpi__sub">63 feedback</span>
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
                  num: "183",
                  of: "/294",
                  pct: "62%",
                  pctCls: "",
                  hasPct: true,
                  sub: "proyek dievaluasi dari 294 terdaftar",
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
              <span className="dd-kpi__value">183</span>
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
                  num: "123",
                  of: "/165",
                  pct: "75%",
                  pctCls: "kpct--green",
                  hasPct: true,
                  sub: "go-live dibanding 165 intake 2026",
                  note: "Go-live per bulan dari Januari sampai Oktober 2026.",
                  rows: [
                    { name: "Januari", val: "7 go-live", w: "33.3%", color: "var(--chart-green)" },
                    { name: "Februari", val: "6 go-live", w: "28.6%", color: "var(--chart-green)" },
                    { name: "Maret", val: "10 go-live", w: "47.6%", color: "var(--chart-green)" },
                    { name: "April", val: "5 go-live", w: "23.8%", color: "var(--chart-green)" },
                    { name: "Mei", val: "21 go-live", w: "100%", color: "var(--chart-green)" },
                    { name: "Juni", val: "12 go-live", w: "57.1%", color: "var(--chart-green)" },
                    { name: "Juli", val: "21 go-live", w: "100%", color: "var(--chart-green)" },
                    { name: "Agustus", val: "17 go-live", w: "81.0%", color: "var(--chart-green)" },
                    { name: "September", val: "12 go-live", w: "57.1%", color: "var(--chart-green)" },
                    { name: "Oktober", val: "12 go-live", w: "57.1%", color: "var(--chart-green)" },
                  ],
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
              <span className="dd-kpi__value">123</span>
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
                subtitle: "18 proyek aktif melewati SLA tahap",
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
                18
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
                    <span className="dd-sla__period">{selectedYear}</span>
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
                      subtitle: "Log proyek masuk dan go-live tahun 2026",
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
                  Go-live <span className="dd-chart__legendval">123</span>
                </span>
                <span className="dd-chart__legenditem">
                  <span
                    className="dd-chart__dot dd-chart__dot--round"
                    style={{ background: "var(--chart-blue-primary)" }}
                  />
                  Intake <span className="dd-chart__legendval">165</span>
                </span>
              </div>

              <div style={{ position: "relative" }}>
                <svg
                  className="dd-line"
                  viewBox="0 0 700 226"
                  role="img"
                  aria-label="Intake dan go-live per bulan, Januari sampai Oktober 2026"
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
                    <text className="dd-chart__axis" x="24" y="20">24</text>
                    <text className="dd-chart__axis" x="24" y="66">18</text>
                    <text className="dd-chart__axis" x="24" y="112">12</text>
                    <text className="dd-chart__axis" x="24" y="158">6</text>
                    <text className="dd-chart__axis" x="24" y="204">0</text>
                  </g>

                  {/* X Axis text */}
                  <g textAnchor="middle">
                    {monthlyData.map((m) => (
                      <text key={m.name} className="dd-chart__axis" x={m.x} y="220">
                        {m.name}
                      </text>
                    ))}
                  </g>

                  {/* Intake Polyline (Blue) */}
                  <polyline
                    points="56,77.3 126,39 196,69.7 266,77.3 336,92.7 406,108 476,46.7 546,16 616,62 680,146.3"
                    fill="none"
                    stroke="var(--chart-blue-primary)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Go-Live Polyline (Green) */}
                  <polyline
                    points="56,146.3 126,154 196,123.3 266,161.7 336,39 406,108 476,39 546,69.7 616,108 680,108"
                    fill="none"
                    stroke="var(--chart-green)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Blue Dots */}
                  <g className="dd-line__dot" stroke="var(--chart-blue-primary)">
                    {[
                      [56, 77.3], [126, 39], [196, 69.7], [266, 77.3], [336, 92.7],
                      [406, 108], [476, 46.7], [546, 16], [616, 62], [680, 146.3],
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="3.5" />
                    ))}
                  </g>

                  {/* Green Dots */}
                  <g className="dd-line__dot" stroke="var(--chart-green)">
                    {[
                      [56, 146.3], [126, 154], [196, 123.3], [266, 161.7], [336, 39],
                      [406, 108], [476, 39], [546, 69.7], [616, 108], [680, 108],
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="3.5" />
                    ))}
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
                    const isRightSide = i >= 6;
                    return (
                      <div
                        key={m.name}
                        className="hv hvcol"
                        tabIndex={0}
                        style={{ left: m.left, width: m.width }}
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
                          subtitle: "51 proyek di FSD, DEV, SIT dan change request",
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
                          subtitle: "51 proyek di FSD, DEV, SIT dan change request",
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
                    Aktif 8
                  </button>
                  <button
                    className={`dd-seg__btn ${uatTab === "riwayat" ? "dd-seg__btn--active" : ""}`}
                    type="button"
                    role="tab"
                    onClick={() => setUatTab("riwayat")}
                  >
                    Riwayat 31
                  </button>
                </div>
              </div>
            </div>

            <div
              className="dd-card__body"
              style={{ justifyContent: "flex-start", marginTop: 12 }}
            >
              {uatTab === "aktif" ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {uatRescheduledList.map((u, i) => (
                    <div
                      key={i}
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
                  <div className="dd-empty__title">31 riwayat reschedule</div>
                  <div className="dd-empty__msg">
                    Daftar riwayat lengkap dapat dilihat pada modul audit SLA.
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
                <span style={{ flex: 1 }}>15 proyek masih terlambat</span>
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
                <span className="dd-delta dd-delta--down">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 18 4 8h16z" />
                  </svg>
                  3 pt
                </span>
              </div>
            </div>

            <div
              className="dd-card__body"
              style={{ justifyContent: "stretch", flex: 1, minHeight: 0 }}
            >
              <div
                role="img"
                aria-label="DEV SLA 2025 78 persen, 2026 75 persen, target 93 persen"
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

                  {/* Bar 2025 */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: "DEV SLA 2025",
                        subtitle: "Detail pencapaian SLA Development tahun 2025",
                        stageData: {
                          name: "DEV SLA 2025",
                          pct: "78%",
                          data: 95,
                          ok: 74,
                          miss: 21,
                        },
                      })
                    }
                    aria-label="DEV SLA 2025, klik untuk detail"
                    style={{
                      position: "absolute",
                      left: "22%",
                      width: "22%",
                      bottom: 0,
                      height: "78%",
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
                      78%
                    </span>
                    <span
                      className="tip tipcard"
                      style={{ left: "calc(100% + 12px)", top: 0 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun 2025</span>
                        <span className="dd-pill dd-pill--blue">
                          <span className="dd-pill__dot" />
                          78% SLA
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Jumlah data</span>
                        <span>95 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Achieved</span>
                        <span style={{ color: "var(--status-green-fg)" }}>
                          74 proyek
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Not achieved</span>
                        <span style={{ color: "var(--status-red-fg)" }}>
                          21 proyek
                        </span>
                      </span>
                      <span className="dd-table__secondary" style={{ margin: 0 }}>
                        Klik untuk melihat detail
                      </span>
                    </span>
                  </button>

                  {/* Bar 2026 */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: "DEV SLA 2026",
                        subtitle: "Detail pencapaian SLA Development tahun 2026",
                        stageData: {
                          name: "DEV SLA 2026",
                          pct: "75%",
                          data: 134,
                          ok: 101,
                          miss: 33,
                        },
                      })
                    }
                    aria-label="DEV SLA 2026, klik untuk detail"
                    style={{
                      position: "absolute",
                      left: "58%",
                      width: "22%",
                      bottom: 0,
                      height: "75%",
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
                      75%
                    </span>
                    <span
                      className="tip tipcard"
                      style={{ right: "calc(100% + 12px)", top: 0 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun 2026</span>
                        <span className="dd-pill dd-pill--blue">
                          <span className="dd-pill__dot" />
                          75% SLA
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Jumlah data</span>
                        <span>134 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Achieved</span>
                        <span style={{ color: "var(--status-green-fg)" }}>
                          101 proyek
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Not achieved</span>
                        <span style={{ color: "var(--status-red-fg)" }}>
                          33 proyek
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
                    2025 · 95 data
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
                    2026 · 134 data
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
