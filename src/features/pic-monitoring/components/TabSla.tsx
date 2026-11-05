"use client";

import React, { useState, useMemo, useRef } from "react";
import type { DashboardDataset, SanitizedProject, RawProject } from "../types/types";
import { formatPeriodLabel, monthWindowOf } from "../utils/period-filter";
import {
  evaluateStageSla,
  selectMultiStageFailures,
  isStageRealizedInMonths,
} from "../utils/sla-policy";
import { getProjectIntakeYearMonth } from "../services/project-data";
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
  const prevYear = selectedYear - 1;
  const monthWindow = useMemo(() => monthWindowOf(month), [month]);
  const periodLabel = formatPeriodLabel(selectedYear, monthWindow);
  const slaPeriod = useMemo(
    () => ({
      year: selectedYear,
      months: monthWindow,
    }),
    [selectedYear, monthWindow],
  );

  // DEV SLA YoY and Annual Data
  const devAnnualData = useMemo(() => {
    const getDevSla = (yr: number) => {
      const res = evaluateStageSla(slaProjects, "DEV", {
        year: yr,
        months: monthWindow,
      });
      const ok = res.achieved;
      const miss = res.notAchieved;
      const tot = res.contributors;
      const rate = res.percentage !== null ? Math.round(res.percentage) : 0;
      return {
        ok,
        miss,
        tot,
        rate,
        achievedProjects: res.achievedProjects,
        missedProjects: res.notAchievedProjects,
      };
    };

    const prev = getDevSla(prevYear);
    const curr = getDevSla(selectedYear);
    const maxTot = Math.max(prev.tot, curr.tot, 1);
    const ceiling = Math.max(140, Math.ceil(maxTot / 35) * 35);

    return { prev, curr, ceiling };
  }, [slaProjects, prevYear, selectedYear, monthWindow]);

  const devYoYDelta = devAnnualData.curr.rate - devAnnualData.prev.rate;

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

  // 1. Stage evaluations
  const stageEvaluations = useMemo<StageEvalItem[]>(() => {
    const stageKeys = ["FSD", "DEV", "SIT", "UAT", "LIVE"] as const;
    return stageKeys.map((key) => {
      try {
        const evalResult = evaluateStageSla(slaProjects, key, slaPeriod);
        if (evalResult) {
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
      return {
        name: `${key === "LIVE" ? "Live" : key} SLA`,
        pct: "0%",
        data: 0,
        ok: 0,
        miss: 0,
        rate: 0,
        delta: key === "DEV",
      };
    });
  }, [slaProjects, slaPeriod]);

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

  // 2. Delay Tracker data
  const delayAll = useMemo(() => {
    if (!slaProjects || slaProjects.length === 0) return [];

    const result: Array<{
      no: number;
      name: string;
      tk: string;
      cause: string;
      total: number;
      gates: string[];
      project: SanitizedProject;
    }> = [];

    slaProjects.forEach((p) => {
      const yr = String(p._year || p.Year || "");
      const fsdYr = String(p["FSD SLA YEAR"] || "");
      const devYr = String(p["DEV SLA YEAR"] || "");
      const sitYr = String(p["SIT SLA YEAR"] || "");
      const uatYr = String(p["UAT SLA YEAR"] || "");
      const liveYr = String(p["LIVE SLA YEAR"] || "");

      const isMatchYear =
        yr === String(selectedYear) ||
        fsdYr === String(selectedYear) ||
        devYr === String(selectedYear) ||
        sitYr === String(selectedYear) ||
        uatYr === String(selectedYear) ||
        liveYr === String(selectedYear);

      if (!isMatchYear) return;

      if (monthWindow !== null) {
        let matchedInMonth = false;
        const stages = ["FSD", "DEV", "SIT", "UAT", "LIVE"] as const;
        for (const st of stages) {
          if (isStageRealizedInMonths(p, st, selectedYear, monthWindow)) {
            matchedInMonth = true;
            break;
          }
        }
        if (!matchedInMonth) {
          const intake = getProjectIntakeYearMonth(p);
          if (
            intake &&
            intake.year === selectedYear &&
            intake.month >= monthWindow.startMonth &&
            intake.month <= monthWindow.endMonth
          ) {
            matchedInMonth = true;
          }
        }
        if (!matchedInMonth) return;
      }

      const gates: string[] = [];
      let total = 0;

      const fsdLate = Number(p["(FSD) Late Days"]) || 0;
      if (fsdLate > 0) {
        gates.push(`FSD ${fsdLate} hari`);
        total += fsdLate;
      }

      const devLate = Number(p["(Dev) Late Days"]) || 0;
      if (devLate > 0) {
        gates.push(`DEV ${devLate} hari`);
        total += devLate;
      }

      const sitLate = Number(p["(SIT) Late Days"]) || 0;
      if (sitLate > 0) {
        gates.push(`SIT ${sitLate} hari`);
        total += sitLate;
      }

      const uatLate = Number(p["(UAT) Late Days"]) || 0;
      if (uatLate > 0) {
        gates.push(`UAT ${uatLate} hari`);
        total += uatLate;
      }

      const liveLate = Number(p["(Live) Late Days"]) || 0;
      if (liveLate > 0) {
        gates.push(`LIVE ${liveLate} hari`);
        total += liveLate;
      }

      if (total > 0 || gates.length > 0) {
        const causeList: string[] = [];
        [
          p["(FSD) Kategori Alasan Terlambat >=2022"],
          p["(Dev) Kategori Alasan Terlambat >=2022"],
          p["(SIT) Kategori Alasan Terlambat >=2022"],
          p["(UAT) Kategori Alasan Terlambat >=2022"],
          p["(Live) Kategori Alasan Terlambat >=2022"],
        ].forEach((c) => {
          if (c && typeof c === "string" && c.trim() && !causeList.includes(c.trim())) {
            causeList.push(c.trim());
          }
        });

        result.push({
          no: 0,
          name: p["Project Name"] || "Untitled Project",
          tk: p.Ticket || "-",
          cause: causeList.length > 0 ? causeList.join(", ") : "Belum diisi",
          total,
          gates,
          project: p,
        });
      }
    });

    return result
      .sort((a, b) => b.total - a.total)
      .map((d, idx) => ({ ...d, no: idx + 1 }));
  }, [slaProjects, selectedYear, monthWindow]);

  const avgDelay = useMemo(() => {
    if (delayAll.length === 0) return 0;
    const sum = delayAll.reduce((acc, d) => acc + d.total, 0);
    return Math.round(sum / delayAll.length);
  }, [delayAll]);

  // 3. Delay root causes
  const causesRaw = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalCauses = 0;

    delayAll.forEach((d) => {
      if (d.cause && d.cause !== "Belum diisi") {
        d.cause.split(",").forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
            totalCauses += 1;
          }
        });
      }
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) return [];

    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, n]) => ({
        name,
        n,
        p: `${Math.round((n / totalCauses) * 100)}%`,
      }));
  }, [delayAll]);

  const maxCauseN = useMemo(() => {
    const top = causesRaw[0]?.n || 1;
    return Math.max(10, Math.ceil(top / 5) * 5);
  }, [causesRaw]);

  const causes = causesRaw.map((c, i) => {
    const isSelected = selectedCause === c.name;
    const isDimmed = selectedCause !== null && !isSelected;
    return {
      rank: i + 1,
      name: c.name,
      n: c.n,
      p: c.p,
      w: `${Math.round((c.n / maxCauseN) * 100)}%`,
      color: isDimmed ? "var(--chart-blue-light)" : "var(--chart-blue-primary)",
      ink: isSelected ? "var(--dd-accent)" : "var(--text-primary)",
    };
  });

  // 4. Multi-Stage SLA Failures
  const multiStageFailures = useMemo(() => {
    if (!slaProjects || slaProjects.length === 0) return [];
    const list = selectMultiStageFailures(slaProjects, slaPeriod);
    return list.map((item) => {
      const p = item.project;
      const stages = item.failedStages.map((s) => `${s.stage} · Not achieved`);
      return {
        name: (p["Project Name"] as string) || "Untitled Project",
        stages,
        year: String(p._year || p.Year || selectedYear),
        status: (p["Last Status"] as string) || "On Progress",
        project: p as SanitizedProject,
      };
    });
  }, [slaProjects, slaPeriod, selectedYear]);

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
                      className={`dd-delta ${devYoYDelta >= 0 ? "dd-delta--up" : "dd-delta--down"}`}
                      style={{ marginLeft: "auto" }}
                      title={`Dibanding ${prevYear}: ${devAnnualData.prev.rate}%`}
                    >
                      {devYoYDelta >= 0 ? `▲ ${devYoYDelta} pt` : `▼ ${Math.abs(devYoYDelta)} pt`}
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
                  <span style={{ position: "absolute", left: "20%", transform: "translateX(-50%)" }}>{Math.round(maxCauseN * 0.2)}</span>
                  <span style={{ position: "absolute", left: "40%", transform: "translateX(-50%)" }}>{Math.round(maxCauseN * 0.4)}</span>
                  <span style={{ position: "absolute", left: "60%", transform: "translateX(-50%)" }}>{Math.round(maxCauseN * 0.6)}</span>
                  <span style={{ position: "absolute", left: "80%", transform: "translateX(-50%)" }}>{Math.round(maxCauseN * 0.8)}</span>
                  <span style={{ position: "absolute", left: "100%", transform: "translateX(-50%)" }}>{maxCauseN}</span>
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
                aria-label={`DEV SLA ${prevYear}: ${devAnnualData.prev.ok} achieved, ${devAnnualData.prev.miss} not achieved. ${selectedYear}: ${devAnnualData.curr.ok} achieved, ${devAnnualData.curr.miss} not achieved`}
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
                  <span style={{ position: "absolute", right: 0, top: 0, transform: "translateY(-50%)" }}>{devAnnualData.ceiling}</span>
                  <span style={{ position: "absolute", right: 0, top: "25%", transform: "translateY(-50%)" }}>{Math.round(devAnnualData.ceiling * 0.75)}</span>
                  <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>{Math.round(devAnnualData.ceiling * 0.5)}</span>
                  <span style={{ position: "absolute", right: 0, top: "75%", transform: "translateY(-50%)" }}>{Math.round(devAnnualData.ceiling * 0.25)}</span>
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

                  {/* Prev Year Column */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: `DEV SLA ${prevYear}`,
                        subtitle: `${devAnnualData.prev.ok} achieved, ${devAnnualData.prev.miss} not achieved`,
                        stageData: {
                          name: `DEV SLA ${prevYear}`,
                          pct: `${devAnnualData.prev.rate}%`,
                          data: devAnnualData.prev.tot,
                          ok: devAnnualData.prev.ok,
                          miss: devAnnualData.prev.miss,
                          achievedProjects: devAnnualData.prev.achievedProjects,
                          missedProjects: devAnnualData.prev.missedProjects,
                        },
                      })
                    }
                    aria-label={`DEV SLA ${prevYear}, klik untuk detail`}
                    style={{
                      position: "absolute",
                      left: "17%",
                      width: "26%",
                      bottom: 0,
                      height: `${Math.min(100, Math.round((devAnnualData.prev.tot / devAnnualData.ceiling) * 100))}%`,
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
                        height: `${devAnnualData.prev.tot > 0 ? (devAnnualData.prev.ok / devAnnualData.prev.tot) * 100 : 0}%`,
                        background: "var(--chart-blue-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      {devAnnualData.prev.ok}
                    </span>
                    <span
                      className="bar"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: `${devAnnualData.prev.tot > 0 ? (devAnnualData.prev.miss / devAnnualData.prev.tot) * 100 : 0}%`,
                        background: "var(--chart-red)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      {devAnnualData.prev.miss}
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
                      {devAnnualData.prev.rate}%
                    </span>
                    <span
                      className="tip tipcard"
                      style={{ left: "calc(100% + 12px)", top: 0 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun {prevYear}</span>
                        <span className="dd-pill dd-pill--blue">
                          <span className="dd-pill__dot" />
                          {devAnnualData.prev.rate}% SLA
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Jumlah data</span>
                        <span>{devAnnualData.prev.tot} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Achieved</span>
                        <span style={{ color: "var(--status-green-fg)" }}>
                          {devAnnualData.prev.ok} proyek
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Not achieved</span>
                        <span style={{ color: "var(--status-red-fg)" }}>
                          {devAnnualData.prev.miss} proyek
                        </span>
                      </span>
                    </span>
                  </button>

                  {/* Current Year Column */}
                  <button
                    type="button"
                    className="hv"
                    onClick={() =>
                      setActiveModal({
                        type: "stage",
                        title: `DEV SLA ${selectedYear}`,
                        subtitle: `${devAnnualData.curr.ok} achieved, ${devAnnualData.curr.miss} not achieved`,
                        stageData: {
                          name: `DEV SLA ${selectedYear}`,
                          pct: `${devAnnualData.curr.rate}%`,
                          data: devAnnualData.curr.tot,
                          ok: devAnnualData.curr.ok,
                          miss: devAnnualData.curr.miss,
                          achievedProjects: devAnnualData.curr.achievedProjects,
                          missedProjects: devAnnualData.curr.missedProjects,
                        },
                      })
                    }
                    aria-label={`DEV SLA ${selectedYear}, klik untuk detail`}
                    style={{
                      position: "absolute",
                      left: "57%",
                      width: "26%",
                      bottom: 0,
                      height: `${Math.min(100, Math.round((devAnnualData.curr.tot / devAnnualData.ceiling) * 100))}%`,
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
                        height: `${devAnnualData.curr.tot > 0 ? (devAnnualData.curr.ok / devAnnualData.curr.tot) * 100 : 0}%`,
                        background: "var(--chart-blue-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      {devAnnualData.curr.ok}
                    </span>
                    <span
                      className="bar"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: `${devAnnualData.curr.tot > 0 ? (devAnnualData.curr.miss / devAnnualData.curr.tot) * 100 : 0}%`,
                        background: "var(--chart-red)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      {devAnnualData.curr.miss}
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
                      {devAnnualData.curr.rate}%
                    </span>
                    <span
                      className="tip tipcard"
                      style={{ right: "calc(100% + 12px)", top: 0 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun {selectedYear}</span>
                        <span className="dd-pill dd-pill--blue">
                          <span className="dd-pill__dot" />
                          {devAnnualData.curr.rate}% SLA
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Jumlah data</span>
                        <span>{devAnnualData.curr.tot} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Achieved</span>
                        <span style={{ color: "var(--status-green-fg)" }}>
                          {devAnnualData.curr.ok} proyek
                        </span>
                      </span>
                      <span className="tipcard__r">
                        <span>Not achieved</span>
                        <span style={{ color: "var(--status-red-fg)" }}>
                          {devAnnualData.curr.miss} proyek
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
                    {prevYear}
                  </span>
                  <span style={{ position: "absolute", left: "70%", transform: "translateX(-50%)", top: 6 }}>
                    {selectedYear}
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
              &nbsp;{multiStageFailures.length} warnings
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

          {multiStageFailures.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary)", font: "var(--text-body)" }}>
              Tidak ada kegagalan multi-tahap pada tahun {selectedYear}
            </div>
          ) : (
            multiStageFailures.map((m, idx) => (
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
            ))
          )}
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
                Klik baris untuk melihat detail · rata-rata keterlambatan {avgDelay} hari
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
