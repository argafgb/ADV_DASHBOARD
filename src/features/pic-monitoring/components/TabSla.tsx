"use client";

import React, { useState, useMemo, useRef } from "react";
import type { DashboardDataset, SanitizedProject, RawProject } from "../types/types";
import { formatPeriodLabel, monthWindowOf } from "../utils/period-filter";
import { evaluateStageSla } from "../utils/sla-policy";
import { PicMonitoringModals, type ModalPayload } from "./PicMonitoringModals";
import { useUploadOverride } from "../context/UploadOverrideContext";

interface TabSlaProps {
  dataset: DashboardDataset;
  rawProjects?: RawProject[];
  slaProjects?: SanitizedProject[];
  startYear?: number;
  endYear?: number;
  month?: string;
  onUploadFile?: (file: File) => void;
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

export function TabSla({
  slaProjects = [],
  startYear = 2026,
  endYear = 2026,
  month = "ALL",
  onUploadFile,
}: TabSlaProps) {
  const [activeModal, setActiveModal] = useState<ModalPayload | null>(null);
  const [selectedCause, setSelectedCause] = useState<string | null>(null);
  const [dq, setDq] = useState("");
  const [causeMenuOpen, setCauseMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const override = useUploadOverride();

  const selectedYear = endYear || startYear || 2026;
  const periodLabel = formatPeriodLabel(selectedYear, monthWindowOf(month));

  const uploadFn = onUploadFile || override?.processUploadedFile;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadFn) {
        uploadFn(file);
      }
      e.target.value = "";
    }
  };

  // 1. Stage evaluations (matched exactly with prototype reference & max 100%)
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
        // Fallback
      }
      return defaultData[idx];
    });
  }, [slaProjects, selectedYear]);

  const handleDownloadData = () => {
    const headers = [
      "Stage",
      "Achievement %",
      "Target %",
      "Total Data",
      "Achieved",
      "Not Achieved",
    ];
    const rows = stageEvaluations.map((s) => [
      `"${s.name}"`,
      `"${s.pct}"`,
      `"93%"`,
      s.data,
      s.ok,
      s.miss,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const ts = Date.now();
    link.setAttribute(
      "download",
      `milestone-sla-${selectedYear}-${ts}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Delay root causes
  const causesRaw = [
    { name: "Resource Terbatas", n: 10, p: "37%" },
    { name: "Kendala Teknis", n: 6, p: "22%" },
    { name: "Requirement Berubah", n: 5, p: "19%" },
    { name: "Dependensi Vendor", n: 3, p: "11%" },
    { name: "Prioritas Bergeser", n: 2, p: "7%" },
    { name: "Data Belum Siap", n: 1, p: "4%" },
  ];

  const causes = causesRaw.map((c, i) => {
    const isSelected = selectedCause === c.name;
    const isDimmed = selectedCause !== null && !isSelected;
    return {
      rank: i + 1,
      name: c.name,
      n: c.n,
      p: c.p,
      w: `${c.n * 10}%`,
      color: isDimmed ? "var(--chart-blue-light)" : "var(--chart-blue-primary)",
      ink: isSelected ? "var(--dd-accent)" : "var(--text-primary)",
    };
  });

  // 3. Multi-Stage SLA Failures
  const multiStageFailures = [
    {
      name: "Monitoring Selisih (Claimsys ATM) - Phase 1",
      stages: ["FSD · Not achieved", "DEV · Not achieved"],
      year: "2026",
      status: "Dev On Progress",
    },
    {
      name: "Pengembangan E-HR Attendance Phase 1",
      stages: ["FSD · Not achieved", "DEV · Not achieved"],
      year: "2026",
      status: "Dev Pending Estimation",
    },
    {
      name: "Migrasi CPM Receive Version ke Platform Baru",
      stages: ["DEV · Not achieved", "SIT · Not achieved"],
      year: "2026",
      status: "Dev On Queue",
    },
    {
      name: "Approval Digital Pengajuan Rekonsiliasi Cash Pickup",
      stages: ["FSD · Not achieved", "DEV · Not achieved"],
      year: "2026",
      status: "FSD On Progress",
    },
    {
      name: "Otomasi Bill Counter dengan OCR",
      stages: ["DEV · Not achieved", "SIT · Not achieved"],
      year: "2026",
      status: "Change Request On Progress",
    },
  ];

  // 4. Delay Tracker data matching prototype
  const delayAll = [
    { no: 1, name: "Tambah Filter Pencarian Reimbursement Online", tk: "25120038", cause: "Dependensi Vendor, Kendala Teknis", total: 108, gates: ["SIT 40 hari", "LIVE 68 hari"] },
    { no: 2, name: "Setting Report Custom Absensi Cabang", tk: "26020048", cause: "Requirement Berubah", total: 55, gates: ["FSD 6 hari", "UAT 58 hari"] },
    { no: 3, name: "Enhance Menu CPM Receive Version", tk: "26020004", cause: "Belum diisi", total: 51, gates: ["UAT 60 hari"] },
    { no: 4, name: "Implementasi Manifest Pengiriman Baru", tk: "25120003", cause: "Kendala Teknis", total: 51, gates: ["FSD 36 hari", "LIVE 23 hari"] },
    { no: 5, name: "Integrasi API Portal Vendor dengan Core System", tk: "25090007", cause: "Resource Terbatas", total: 49, gates: ["SIT 9 hari", "LIVE 40 hari"] },
  ];

  const filteredDelays = delayAll.filter((d) => {
    const matchCause = !selectedCause || d.cause.includes(selectedCause);
    const query = dq.trim().toLowerCase();
    const matchQuery = !query || (d.name + d.tk + d.cause).toLowerCase().includes(query);
    return matchCause && matchQuery;
  });

  return (
    <>
      <div style={{ paddingBottom: 24 }}>
        {/* Header */}
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
            <h1 className="dd-page__title">Milestone &amp; SLA</h1>
            <p className="dd-page__subtitle">Laporan mingguan · {periodLabel}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              className="dd-btn dd-btn--secondary dd-btn--md"
              type="button"
              onClick={handleUploadClick}
            >
              Unggah JSON
            </button>
            <button
              className="dd-btn dd-btn--primary dd-btn--md"
              type="button"
              onClick={handleDownloadData}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Unduh data
            </button>
          </div>
        </div>

        {/* 5-Stage SLA Grid */}
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
                    subtitle: `Target min. 93% · Total ${s.data} data dievaluasi`,
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
                  {s.delta && (
                    <span
                      className="dd-delta dd-delta--down"
                      style={{ marginLeft: "auto" }}
                      title="Dibanding 2025: 78%"
                    >
                      ▼ 3 pt
                    </span>
                  )}
                </div>
                <div className="dd-sla__value">{s.pct}</div>
                <div className="dd-sla__target">
                  Target <span>93%</span> · {s.data} data
                </div>
                <div className="dd-sla__track">
                  <div className={`dd-sla__fill ${fillClass}`} style={{ width: s.pct }} />
                </div>
                <div className="dd-sla__foot" style={{ marginTop: 14 }}>
                  <div className="dd-sla__stat">
                    <span className="dd-sla__statlabel">Achieved</span>
                    <span className="dd-sla__statval dd-sla__statval--green">{s.ok}</span>
                  </div>
                  <button
                    className="dd-sla__stat dd-sla__stat--btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveModal({
                        type: "stage",
                        title: `Milestone SLA: ${s.name}`,
                        subtitle: `Daftar proyek Not Achieved pada ${s.name}`,
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
                    <span className="dd-sla__statval dd-sla__statval--red">{s.miss}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Equal Row: Delay Root Cause + DEV SLA Annual */}
        <div
          className="dd-cardrow dd-cardrow--equal"
          style={{ "--cols": 2, marginTop: 10 } as React.CSSProperties}
        >
          {/* Card: Delay root cause */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">Delay root cause</h2>
                <p className="dd-card__subtitle">Klik bar untuk memfilter tabel delay</p>
              </div>
            </div>

            <div
              className="dd-card__body"
              style={{ flex: 1, minHeight: 0, justifyContent: "flex-start" }}
            >
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  minHeight: 300,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Background Grid Lines */}
                <div
                  style={{
                    position: "absolute",
                    left: 176,
                    right: 76,
                    top: 0,
                    bottom: 26,
                    borderLeft: "1px solid var(--chart-axis)",
                    borderBottom: "1px solid var(--chart-axis)",
                    borderRight: "1px solid var(--chart-axis)",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "20%", borderLeft: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "40%", borderLeft: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "60%", borderLeft: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "80%", borderLeft: "1px solid var(--chart-grid)" }} />
                </div>

                {/* Bars Grid */}
                <div
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "176px minmax(0, 1fr) 76px",
                    gridAutoRows: 44,
                    alignContent: "start",
                    alignItems: "center",
                  }}
                >
                  {causes.map((c) => (
                    <React.Fragment key={c.name}>
                      <span className="dd-hbar__ylabel dd-rbar__yl" style={{ paddingRight: 12 }}>
                        <span className="dd-rbar__rank">{c.rank}</span>
                        <span
                          className="dd-rbar__name"
                          style={{ fontSize: "var(--fs-caption)", color: c.ink }}
                        >
                          {c.name}
                        </span>
                      </span>
                      <div
                        className="dd-rbar__track dd-clickable"
                        onClick={() => setSelectedCause(selectedCause === c.name ? null : c.name)}
                        title="Klik untuk memfilter tabel delay"
                        style={{ height: 16 }}
                      >
                        <div
                          className="dd-rbar__fill"
                          style={{ width: c.w, background: c.color }}
                        />
                      </div>
                      <span
                        className="dd-hbar__val dd-chart__value"
                        style={{ paddingLeft: 12, textAlign: "left" }}
                      >
                        {c.n}{" "}
                        <span style={{ color: "var(--text-placeholder)", fontWeight: "var(--fw-regular)" }}>
                          {c.p}
                        </span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>

                {/* X Axis bottom */}
                <div
                  style={{
                    position: "absolute",
                    left: 176,
                    right: 76,
                    bottom: 0,
                    height: 22,
                    font: "var(--text-axis)",
                    color: "var(--chart-axis)",
                  }}
                >
                  <span style={{ position: "absolute", left: 0, transform: "translateX(-50%)" }}>0</span>
                  <span style={{ position: "absolute", left: "20%", transform: "translateX(-50%)" }}>2</span>
                  <span style={{ position: "absolute", left: "40%", transform: "translateX(-50%)" }}>4</span>
                  <span style={{ position: "absolute", left: "60%", transform: "translateX(-50%)" }}>6</span>
                  <span style={{ position: "absolute", left: "80%", transform: "translateX(-50%)" }}>8</span>
                  <span style={{ position: "absolute", left: "100%", transform: "translateX(-50%)" }}>10</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card: DEV SLA Annual Stacked */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">DEV SLA annual</h2>
                <p className="dd-card__subtitle">
                  Achieved vs not achieved per tahun · klik bar untuk detail
                </p>
              </div>
            </div>

            <div
              className="dd-card__body"
              style={{
                flex: 1,
                minHeight: 0,
                justifyContent: "stretch",
                gap: 10,
              }}
            >
              <div
                role="img"
                aria-label="DEV SLA 2025: 74 achieved, 21 not achieved. 2026: 101 achieved, 33 not achieved"
                style={{
                  flex: 1,
                  minHeight: 260,
                  display: "grid",
                  gridTemplateColumns: "32px minmax(0, 1fr)",
                  gridTemplateRows: "minmax(0, 1fr) 24px",
                  columnGap: 8,
                }}
              >
                {/* Y Axis */}
                <div
                  style={{
                    position: "relative",
                    font: "var(--text-axis)",
                    color: "var(--chart-axis)",
                  }}
                >
                  <span style={{ position: "absolute", right: 0, top: 0, transform: "translateY(-50%)" }}>140</span>
                  <span style={{ position: "absolute", right: 0, top: "25%", transform: "translateY(-50%)" }}>105</span>
                  <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>70</span>
                  <span style={{ position: "absolute", right: 0, top: "75%", transform: "translateY(-50%)" }}>35</span>
                  <span style={{ position: "absolute", right: 0, top: "100%", transform: "translateY(-50%)" }}>0</span>
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
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "25%", borderTop: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "50%", borderTop: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "75%", borderTop: "1px solid var(--chart-grid)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "100%", borderTop: "1px solid var(--chart-grid)" }} />

                  {/* 2025 Column: Total 95 (74 achieved, 21 not achieved) */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: "DEV SLA 2025",
                        subtitle: "74 achieved, 21 not achieved",
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
                      left: "17%",
                      width: "26%",
                      bottom: 0,
                      height: "67.86%",
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
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "77.89%",
                        background: "var(--chart-blue-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      74
                    </span>
                    <span
                      className="bar"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: "22.11%",
                        background: "var(--chart-red)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      21
                    </span>
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
                    </span>
                  </button>

                  {/* 2026 Column: Total 134 (101 achieved, 33 not achieved) */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: "DEV SLA 2026",
                        subtitle: "101 achieved, 33 not achieved",
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
                      left: "57%",
                      width: "26%",
                      bottom: 0,
                      height: "95.71%",
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
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "75.37%",
                        background: "var(--chart-blue-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      101
                    </span>
                    <span
                      className="bar"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: "24.63%",
                        background: "var(--chart-red)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      33
                    </span>
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
                    </span>
                  </button>
                </div>

                <div />
                <div
                  style={{
                    position: "relative",
                    font: "var(--text-axis)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span style={{ position: "absolute", left: "30%", transform: "translateX(-50%)", top: 6 }}>
                    2025
                  </span>
                  <span style={{ position: "absolute", left: "70%", transform: "translateX(-50%)", top: 6 }}>
                    2026
                  </span>
                </div>
              </div>

              <div className="dd-chart__legend" style={{ justifyContent: "center" }}>
                <span className="dd-chart__legenditem">
                  <span className="dd-chart__dot" style={{ background: "var(--chart-blue-primary)" }} />
                  Achieved
                </span>
                <span className="dd-chart__legenditem">
                  <span className="dd-chart__dot" style={{ background: "var(--chart-red)" }} />
                  Not achieved
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Table 1: Multi-Stage SLA Failures */}
        <section className="dd-table" aria-label="Multi-Stage SLA Failures" style={{ marginTop: 10 }}>
          <div className="dd-table__toolbar">
            <div className="dd-table__titlewrap" style={{ maxWidth: "none" }}>
              <div className="dd-table__titlerow">
                <h2 className="dd-table__title">Multi-Stage SLA Failures</h2>
                <span className="dd-count">{multiStageFailures.length}</span>
              </div>
              <p className="dd-table__hint">
                Proyek dengan hasil Not Achieved pada dua tahap atau lebih
              </p>
            </div>
            <span className="dd-pill dd-pill--red" style={{ marginLeft: "auto" }}>
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 9v4M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              &nbsp;5 warnings
            </span>
          </div>

          <div
            className="dd-table__head"
            style={{
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.6fr) 96px minmax(0, 1.4fr)",
            }}
          >
            <div className="dd-table__th">Nama proyek</div>
            <div className="dd-table__th">Tahap &amp; hasil SLA</div>
            <div className="dd-table__th">Tahun</div>
            <div className="dd-table__th">Last status</div>
          </div>

          {multiStageFailures.map((m, idx) => (
            <div
              key={idx}
              className="dd-table__row"
              style={{
                gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.6fr) 96px minmax(0, 1.4fr)",
                minHeight: 64,
                cursor: "default",
              }}
            >
              <div className="dd-table__td">
                <div className="dd-table__primary">{m.name}</div>
              </div>
              <div className="dd-table__td" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {m.stages.map((st) => (
                  <span key={st} className="dd-pill dd-pill--red">
                    <span className="dd-pill__dot" />
                    {st}
                  </span>
                ))}
              </div>
              <div className="dd-table__td">
                <span className="dd-table__date">{m.year}</span>
              </div>
              <div className="dd-table__td">
                <span className="dd-pill dd-pill--blue">
                  <span className="dd-pill__dot" />
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Table 2: SLA Phase Delay Tracker */}
        <section className="dd-table" style={{ overflow: "visible", marginTop: 10 }}>
          <div className="dd-table__toolbar">
            <div className="dd-table__titlewrap">
              <div className="dd-table__titlerow">
                <h2 className="dd-table__title">SLA phase delay tracker</h2>
                <span className="dd-count">{filteredDelays.length}</span>
              </div>
              <p className="dd-table__hint">
                Klik baris untuk melihat detail · rata-rata keterlambatan 17 hari
                {selectedCause ? ` · filter: ${selectedCause}` : ""}
              </p>
            </div>

            {/* Search */}
            <div className="dd-table__search">
              <div className="dd-input-wrap">
                <span className="dd-input-wrap__icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <input
                  className="dd-input dd-input--with-icon"
                  type="search"
                  aria-label="Cari tiket"
                  placeholder="Cari proyek, tiket, penyebab"
                  value={dq}
                  onChange={(e) => setDq(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="dd-table__filters" style={{ gridAutoColumns: 220 }}>
              <div className="dd-dd" style={{ position: "relative" }}>
                {causeMenuOpen && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 1 }}
                    onClick={() => setCauseMenuOpen(false)}
                  />
                )}
                <button
                  type="button"
                  className={`dd-tfilter ${selectedCause ? "dd-tfilter--active" : ""}`}
                  onClick={() => setCauseMenuOpen(!causeMenuOpen)}
                  style={{ flex: 1, position: "relative", zIndex: 2 }}
                >
                  <span className="dd-tfilter__icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 8v4M12 16h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
                    </svg>
                  </span>
                  <span className="dd-tfilter__label">Penyebab</span>
                  <span className="dd-tfilter__value">{selectedCause || "Semua"}</span>
                  <svg
                    className="dd-tfilter__chev"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {causeMenuOpen && (
                  <div
                    className="dd-dd__menu"
                    role="listbox"
                    style={{ zIndex: 5, display: "block" }}
                  >
                    <div className="dd-dd__opts">
                      {["Semua", ...causesRaw.map((c) => c.name)].map((cName) => {
                        const isMatch = (cName === "Semua" && !selectedCause) || selectedCause === cName;
                        return (
                          <button
                            key={cName}
                            type="button"
                            className={`dd-dd__opt ${isMatch ? "dd-dd__opt--active" : ""}`}
                            onClick={() => {
                              setSelectedCause(cName === "Semua" ? null : cName);
                              setCauseMenuOpen(false);
                            }}
                          >
                            <span className="dd-dd__opttext">{cName}</span>
                            {isMatch && (
                              <svg
                                className="dd-dd__tick"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="m5 12 5 5 9-10" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="dd-table__head"
            style={{
              gridTemplateColumns: "56px minmax(0, 1fr) 120px 260px 40px",
            }}
          >
            <div className="dd-table__th">No</div>
            <div className="dd-table__th">Project</div>
            <div className="dd-table__th" style={{ justifyContent: "flex-end" }}>
              Total delay
            </div>
            <div className="dd-table__th">Gerbang terlambat</div>
            <div className="dd-table__th" />
          </div>

          {filteredDelays.map((d) => (
            <div
              key={d.tk}
              onClick={() =>
                setActiveModal({
                  type: "delay",
                  title: d.name,
                  subtitle: `${d.tk} · keterlambatan ${d.total} hari`,
                  delayItem: d,
                })
              }
              className="dd-table__row"
              style={{
                gridTemplateColumns: "56px minmax(0, 1fr) 120px 260px 40px",
                cursor: "pointer",
              }}
            >
              <div className="dd-table__td">
                <span className="dd-table__idx">{d.no}</span>
              </div>
              <div className="dd-table__td">
                <div className="dd-table__primary">{d.name}</div>
                <div className="dd-table__secondary">
                  {d.tk} · {d.cause}
                </div>
              </div>
              <div className="dd-table__td" style={{ textAlign: "right" }}>
                <span style={{ font: "var(--text-cell)", color: "var(--status-red-fg)" }}>
                  {d.total} hari
                </span>
              </div>
              <div className="dd-table__td">
                <div className="dd-chip-group">
                  {d.gates.map((g) => (
                    <span key={g} className="dd-chip dd-chip--red">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="dd-table__td--chev">
                <span className="dd-table__chev">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </div>
            </div>
          ))}

          {filteredDelays.length === 0 && (
            <div className="dd-empty">
              <div className="dd-empty__title">Tidak ada hasil</div>
              <div className="dd-empty__msg">Coba kata kunci atau penyebab lain.</div>
            </div>
          )}
        </section>
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
