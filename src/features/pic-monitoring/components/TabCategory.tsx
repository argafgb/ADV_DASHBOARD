"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DashboardDataset, SanitizedProject } from "../types/types";
import { formatPeriodLabel, monthWindowOf } from "../utils/period-filter";
import { evaluateStageSla, isStageRealizedInMonths } from "../utils/sla-policy";
import { getProjectIntakeYearMonth } from "../services/project-data";
import { PicMonitoringModals, type ModalPayload, getTone } from "./PicMonitoringModals";

interface TabCategoryProps {
  dataset: DashboardDataset;
  rawProjects?: SanitizedProject[];
  filteredProjects?: SanitizedProject[];
  slaProjects?: SanitizedProject[];
  startYear?: number;
  endYear?: number;
  month?: string;
  onUploadFile?: (file: File) => void;
}

export function TabCategory({
  filteredProjects = [],
  rawProjects = [],
  slaProjects = [],
  startYear = 2026,
  endYear = 2026,
  month = "ALL",
}: TabCategoryProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalPayload | null>(null);
  const [typeTab, setTypeTab] = useState<"semua" | "aktif">("semua");
  const selectedYear = endYear || startYear || 2026;
  const monthWindow = useMemo(() => monthWindowOf(month), [month]);
  const periodLabel = formatPeriodLabel(selectedYear, monthWindow);
  const slaPeriod = useMemo(
    () => ({
      year: selectedYear,
      months: monthWindow,
    }),
    [selectedYear, monthWindow],
  );

  const baseProjects = rawProjects.length > 0 ? rawProjects : filteredProjects;
  const allProjects = useMemo(() => {
    if (monthWindow === null) return baseProjects;
    return baseProjects.filter((p) => {
      const intake = getProjectIntakeYearMonth(p);
      if (intake && intake.year === selectedYear) {
        if (
          intake.month >= monthWindow.startMonth &&
          intake.month <= monthWindow.endMonth
        ) {
          return true;
        }
      }
      const stages = ["FSD", "DEV", "SIT", "UAT", "LIVE"] as const;
      for (const st of stages) {
        if (isStageRealizedInMonths(p, st, selectedYear, monthWindow)) {
          return true;
        }
      }
      return false;
    });
  }, [baseProjects, selectedYear, monthWindow]);

  const totalRegistered = allProjects.length;

  // Active projects
  const activeProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return !st.includes("canceled") && !st.includes("cancelled") && st !== "live";
    });
  }, [allProjects]);

  // Status Distribution
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    const projsByStatus: Record<string, SanitizedProject[]> = {};

    allProjects.forEach((p) => {
      const st = String(p["Last Status"] || "Other").trim();
      counts[st] = (counts[st] || 0) + 1;
      if (!projsByStatus[st]) projsByStatus[st] = [];
      projsByStatus[st].push(p);
    });

    const colorForStatus = (st: string) => {
      const s = st.toLowerCase();
      if (s === "live on queue" || s === "on queue") return "var(--chart-amber)";
      if (s === "live" || s.includes("monitoring")) return "var(--chart-green)";
      if (s.includes("fsd") || s.includes("dev") || s.includes("sit")) return "var(--chart-blue-primary)";
      if (s.includes("uat") || s.includes("change")) return "var(--chart-blue-light)";
      if (s.includes("queue") || s.includes("pending")) return "var(--chart-amber)";
      return "var(--chart-neutral)";
    };

    if (Object.keys(counts).length > 0) {
      const total = allProjects.length;
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, n]) => ({
          name,
          n,
          color: colorForStatus(name),
          p: `${Math.round((n / total) * 100)}%`,
          w: `${((n / total) * 100).toFixed(2)}%`,
          projects: projsByStatus[name] || [],
        }));
    }

    return [];
  }, [allProjects]);

  // Projects by Type
  const typeData = useMemo(() => {
    const targetPool = typeTab === "semua" ? allProjects : activeProjects;
    let enhanceCount = 0;
    let utamaCount = 0;
    let approvalCount = 0;
    const enhanceProjs: SanitizedProject[] = [];
    const utamaProjs: SanitizedProject[] = [];
    const approvalProjs: SanitizedProject[] = [];

    targetPool.forEach((p) => {
      const tp = String(p["Type Project"] || "").toLowerCase();
      if (tp.includes("enhance")) {
        enhanceCount++;
        enhanceProjs.push(p);
      } else if (tp.includes("utama")) {
        utamaCount++;
        utamaProjs.push(p);
      } else if (tp.includes("approval")) {
        approvalCount++;
        approvalProjs.push(p);
      }
    });

    const tot = enhanceCount + utamaCount + approvalCount || 1;

    return [
      {
        name: "Enhance Kecil",
        n: enhanceCount,
        color: "var(--chart-blue-primary)",
        p: `${Math.round((enhanceCount / tot) * 100)}%`,
        projects: enhanceProjs,
      },
      {
        name: "Project Utama",
        n: utamaCount,
        color: "var(--chart-green)",
        p: `${Math.round((utamaCount / tot) * 100)}%`,
        projects: utamaProjs,
      },
      {
        name: "Approval Digital",
        n: approvalCount,
        color: "var(--chart-amber)",
        p: `${Math.round((approvalCount / tot) * 100)}%`,
        projects: approvalProjs,
      },
    ];
  }, [typeTab, allProjects, activeProjects]);

  const typeTotal = typeData.reduce((acc, t) => acc + t.n, 0);

  // SVG Donut circumference = 2 * PI * 56 ≈ 351.858
  const C = 351.858;
  const safeTotal = typeTotal || 1;
  const ring0 = {
    color: typeData[0].color,
    dash: `${((typeData[0].n / safeTotal) * C).toFixed(2)} ${C}`,
    off: "0",
  };
  const ring1 = {
    color: typeData[1].color,
    dash: `${((typeData[1].n / safeTotal) * C).toFixed(2)} ${C}`,
    off: `-${((typeData[0].n / safeTotal) * C).toFixed(2)}`,
  };
  const ring2 = {
    color: typeData[2].color,
    dash: `${((typeData[2].n / safeTotal) * C).toFixed(2)} ${C}`,
    off: `-${(((typeData[0].n + typeData[1].n) / safeTotal) * C).toFixed(2)}`,
  };

  // Active by Division
  const actDivs = useMemo(() => {
    const counts: Record<string, { n: number; projects: SanitizedProject[] }> = {};
    activeProjects.forEach((p) => {
      const div = String(p["Owner Div"] || p["Owner Division"] || p["Owner Name"] || "Other").trim();
      if (div && div !== "-") {
        if (!counts[div]) counts[div] = { n: 0, projects: [] };
        counts[div].n += 1;
        counts[div].projects.push(p);
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1].n - a[1].n);
    const maxN = sorted[0]?.[1].n || 1;

    return sorted.slice(0, 10).map(([name, data], i) => ({
      rank: i + 1,
      name,
      n: data.n,
      w: `${Math.round((data.n / maxN) * 100)}%`,
      projects: data.projects,
    }));
  }, [activeProjects]);

  const actMaxN = useMemo(() => {
    const top = actDivs[0]?.n || 20;
    return Math.max(10, Math.ceil(top / 5) * 5);
  }, [actDivs]);

  // Projects by Division (All Years)
  const reqDivs = useMemo(() => {
    const counts: Record<string, { n: number; projects: SanitizedProject[] }> = {};
    allProjects.forEach((p) => {
      const div = String(p["Owner Div"] || p["Owner Division"] || p["Owner Name"] || "Other").trim();
      if (div && div !== "-") {
        if (!counts[div]) counts[div] = { n: 0, projects: [] };
        counts[div].n += 1;
        counts[div].projects.push(p);
      }
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1].n - a[1].n);
    const maxN = sorted[0]?.[1].n || 1;

    return sorted.slice(0, 10).map(([name, data], i) => ({
      rank: i + 1,
      name,
      n: data.n,
      w: `${Math.round((data.n / maxN) * 100)}%`,
      projects: data.projects,
    }));
  }, [allProjects]);

  const reqMaxN = useMemo(() => {
    const top = reqDivs[0]?.n || 45;
    return Math.max(10, Math.ceil(top / 5) * 5);
  }, [reqDivs]);

  const divs = reqDivs;

  // Division SLA Leaderboard (Dynamically computed per division)
  const leaderboard = useMemo(() => {
    const targetProjects: readonly SanitizedProject[] = slaProjects && slaProjects.length > 0 ? slaProjects : allProjects;
    const divStats: Record<string, { ev: number; ok: number; na: number; days: number }> = {};

    targetProjects.forEach((p: SanitizedProject) => {
      const yVal = p["DEV SLA YEAR"];
      if (String(yVal) !== String(selectedYear)) return;
      const res = p["DEV SLA"];
      if (res !== "Achieved" && res !== "Not Achieved") return;

      const div = String(p["Owner Div"] || p["Owner Division"] || p["Owner Name"] || "Other").trim();
      if (!isStageRealizedInMonths(p, "DEV", selectedYear, monthWindow)) return;
      if (!divStats[div]) divStats[div] = { ev: 0, ok: 0, na: 0, days: 0 };
      divStats[div].ev += 1;
      if (res === "Achieved") divStats[div].ok += 1;
      if (res === "Not Achieved") {
        divStats[div].na += 1;
        const late = Number(p["(Dev) Late Days"]) || 0;
        if (late > 0) divStats[div].days += late;
      }
    });

    const entries = Object.entries(divStats);
    if (entries.length === 0) return [];

    return entries
      .map(([name, s]) => {
        const p = s.ev > 0 ? Math.round((s.ok / s.ev) * 100) : 0;
        return {
          name,
          p,
          ev: s.ev,
          na: s.na,
          days: s.days,
        };
      })
      .sort((a, b) => b.p - a.p || b.ev - a.ev)
      .slice(0, 10)
      .map((b, i) => ({
        rank: i + 1,
        name: b.name,
        pct: `${b.p}%`,
        ev: b.ev,
        na: b.na,
        color: b.p >= 93 ? "var(--chart-green)" : "var(--chart-red)",
        ink: b.p >= 93 ? "var(--status-green-fg)" : "var(--status-red-fg)",
        over: b.days > 0 ? `${b.days} hari` : "—",
      }));
  }, [slaProjects, allProjects, selectedYear, monthWindow]);

  // Overall SLA across all 5 stages for selectedYear
  const overallSla = useMemo(() => {
    const targetProjects: readonly SanitizedProject[] = slaProjects && slaProjects.length > 0 ? slaProjects : allProjects;
    const stages = ["FSD", "DEV", "SIT", "UAT", "LIVE"] as const;
    let totalData = 0;
    let totalAchieved = 0;
    const rows: { name: string; val: string; w: string; color: string }[] = [];

    stages.forEach((st) => {
      const res = evaluateStageSla(targetProjects, st, slaPeriod);
      const n = res.contributors;
      const ok = res.achieved;
      const pct = res.percentage !== null ? Math.round(res.percentage) : 0;
      totalData += n;
      totalAchieved += ok;
      rows.push({
        name: `${st === "LIVE" ? "Live" : st} SLA`,
        val: `${n} data · ${pct}%`,
        w: `${pct}%`,
        color: "var(--chart-blue-primary)",
      });
    });

    const rate = totalData > 0 ? Math.round((totalAchieved / totalData) * 100) : 0;
    return { totalData, totalAchieved, rate, rows };
  }, [slaProjects, allProjects, slaPeriod]);

  // Lowest SLA division
  const lowestDivisions = useMemo(() => {
    if (leaderboard.length === 0) return [];
    return [...leaderboard]
      .sort((a, b) => {
        const pA = parseInt(a.pct, 10) || 0;
        const pB = parseInt(b.pct, 10) || 0;
        return pA - pB;
      })
      .slice(0, 5);
  }, [leaderboard]);

  const lowestDiv = lowestDivisions[0] || null;

  const leftCardRef = React.useRef<HTMLElement | null>(null);
  const [leftCardHeight, setLeftCardHeight] = useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (!leftCardRef.current) return;
    const updateHeight = () => {
      if (leftCardRef.current) {
        const h = leftCardRef.current.clientHeight;
        setLeftCardHeight((prev) => (prev === h ? prev : h));
      }
    };
    updateHeight();
    const ro = new ResizeObserver(() => updateHeight());
    ro.observe(leftCardRef.current);
    return () => ro.disconnect();
  }, []);

  const handleTypeClick = (typeName: string, fallbackCount?: number) => {
    const item = typeData.find((t) => t.name === typeName);
    const count = fallbackCount ?? item?.n ?? 0;
    setActiveModal({
      type: "group",
      title: typeName,
      subtitle: `${count} proyek ${typeTab === "semua" ? "terdaftar" : "aktif"}`,
      groupName: typeName,
      groupCount: count,
      groupStatus: ["On Progress", "blue"],
      groupProjects: item?.projects || [],
    });
  };

  return (
    <>
      <div style={{ paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 10 }}>
          <h1 className="dd-page__title">Category &amp; Division</h1>
          <p className="dd-page__subtitle">
            {totalRegistered} proyek terdaftar · {periodLabel}
          </p>
        </div>

        {/* 4 Top KPIs */}
        <div className="dd-kpi-grid dd-kpi-grid--4">
          {/* Card 1: Project types */}
          <button
            type="button"
            className="dd-kpi dd-kpi--accent dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "kpi",
                title: "Project types",
                subtitle: periodLabel,
                kpiKey: "ctypes",
                kpiData: {
                  num: String(typeData[0]?.n || 0),
                  of: `/${typeTotal}`,
                  pct: `${typeTotal > 0 ? Math.round(((typeData[0]?.n || 0) / typeTotal) * 100) : 0}%`,
                  pctCls: "",
                  hasPct: true,
                  sub: `${typeData[0]?.name || "-"} · terbanyak dari ${typeData.length} jenis`,
                  note: "Jumlah proyek per kategori.",
                  rows: typeData.map((t) => ({
                    name: t.name,
                    val: `${t.n} proyek`,
                    w: `${typeTotal > 0 ? Math.round((t.n / typeTotal) * 100) : 0}%`,
                    color: t.color,
                  })),
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
                  aria-hidden="true"
                >
                  <path d="m12 2 10 5-10 5L2 7z" />
                </svg>
              </span>
              <span className="dd-kpi__label">Project types</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{typeData.length}</span>
              <span className="dd-kpi__sub">{typeData[0]?.name || "-"} terbanyak</span>
            </div>
          </button>

          {/* Card 2: Requesting divisions */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "kpi",
                title: "Requesting divisions",
                subtitle: "Semua tahun",
                kpiKey: "cdivs",
                kpiData: {
                  num: String(reqDivs[0]?.n || 0),
                  of: `/${totalRegistered}`,
                  pct: `${totalRegistered > 0 ? Math.round(((reqDivs[0]?.n || 0) / totalRegistered) * 100) : 0}%`,
                  pctCls: "",
                  hasPct: true,
                  sub: `${reqDivs[0]?.name || "-"} · terbanyak dari ${reqDivs.length} divisi`,
                  note: "Menampilkan 10 divisi peminta terbanyak. Klik divisi untuk melihat proyeknya.",
                  rows: reqDivs.map((d) => ({
                    name: d.name,
                    val: `${d.n} proyek`,
                    w: d.w,
                    color: "var(--chart-blue-primary)",
                  })),
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
                  aria-hidden="true"
                >
                  <circle cx="9" cy="7" r="4" />
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                </svg>
              </span>
              <span className="dd-kpi__label">Requesting divisions</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{reqDivs.length}</span>
              <span className="dd-kpi__sub">divisi</span>
            </div>
          </button>

          {/* Card 3: Overall SLA */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "kpi",
                title: `Overall SLA ${selectedYear}`,
                subtitle: "Ketercapaian per tahap",
                kpiKey: "csla",
                kpiData: {
                  num: String(overallSla.totalAchieved),
                  of: `/${overallSla.totalData}`,
                  pct: `${overallSla.rate}%`,
                  pctCls: overallSla.rate >= 93 ? "kpct--green" : "kpct--amber",
                  hasPct: true,
                  sub: "evaluasi tercapai · target 93%",
                  note: "Klik tahap untuk melihat proyek not achieved.",
                  rows: overallSla.rows,
                  goLabel: "Buka Milestone & SLA",
                  onGo: () => router.push("/dashboard/pic-monitoring/sla"),
                },
              })
            }
          >
            <div className="dd-kpi__top">
              <span
                className="dd-kpi__tile"
                style={{
                  background: overallSla.rate >= 93 ? "var(--status-green-bg)" : "var(--status-amber-bg)",
                  color: overallSla.rate >= 93 ? "var(--status-green-fg)" : "var(--status-amber-fg)",
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
                  <path d="m12 14 4-4" />
                  <path d="M3.3 19a10 10 0 1 1 17.4 0" />
                </svg>
              </span>
              <span className="dd-kpi__label">Overall SLA {selectedYear}</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{overallSla.rate}%</span>
              <span className="dd-kpi__sub">{overallSla.totalData} evaluasi</span>
            </div>
          </button>

          {/* Card 4: Lowest SLA division */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "kpi",
                title: "Lowest SLA division",
                subtitle: `DEV SLA ${selectedYear} · target 93%`,
                kpiKey: "clow",
                kpiData: {
                  num: String(lowestDiv ? lowestDiv.ev - lowestDiv.na : 0),
                  of: `/${lowestDiv ? lowestDiv.ev : 0}`,
                  pct: lowestDiv ? lowestDiv.pct : "0%",
                  pctCls: "kpct--red",
                  hasPct: true,
                  sub: `${lowestDiv ? lowestDiv.name : "-"} · dievaluasi, tercapai DEV SLA`,
                  note: "Lima divisi dengan ketercapaian DEV SLA terendah.",
                  rows: lowestDivisions.map((d) => ({
                    name: d.name,
                    val: `${d.pct} · ${d.na} not achieved`,
                    w: d.pct,
                    color: "var(--chart-red)",
                    ink: "var(--status-red-fg)",
                  })),
                },
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
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <span className="dd-kpi__label">Lowest SLA division</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value" style={{ color: "var(--status-red-fg)" }}>
                {lowestDiv ? lowestDiv.pct : "—"}
              </span>
              <span className="dd-kpi__sub">{lowestDiv ? lowestDiv.name : "Tidak ada data"}</span>
            </div>
          </button>
        </div>

        {/* Status Distribution Card */}
        <section className="dd-card" style={{ marginTop: 10 }} aria-label="Status distribution">
          <div className="dd-card__head">
            <div>
              <h2 className="dd-card__title">Status distribution</h2>
              <p className="dd-card__subtitle">
                Semua tahun · klik status untuk melihat proyek
              </p>
            </div>
          </div>

          <div
            className="dd-card__body"
            style={{ justifyContent: "flex-start", gap: 16 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                className="dd-num"
                style={{
                  font: "var(--text-hero)",
                  letterSpacing: "var(--ls-display)",
                }}
              >
                {totalRegistered}
              </span>
              <span style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>
                proyek terdaftar
              </span>
            </div>

            {/* Segmented Full Width Track */}
            <div className="dd-comp__track" style={{ height: 16 }}>
              {statusDistribution.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  className="dd-seg-part"
                  title={`${g.name} · ${g.n} proyek`}
                  aria-label={`${g.name} ${g.n} proyek`}
                  onClick={() =>
                    setActiveModal({
                      type: "group",
                      title: g.name,
                      subtitle: `${g.n} proyek ${g.name.toLowerCase() === "live" ? "aktif" : "terdaftar"}`,
                      groupName: g.name,
                      groupCount: g.n,
                      groupProjects: g.projects,
                      groupStatus: [g.name, getTone(g.name)],
                    })
                  }
                  style={{
                    width: g.w,
                    background: g.color,
                    border: 0,
                    borderRight: "2px solid var(--bg-card)",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>

            {/* Grid of Status Tiles */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 10,
              }}
            >
              {statusDistribution.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() =>
                    setActiveModal({
                      type: "group",
                      title: g.name,
                      subtitle: `${g.n} proyek ${g.name.toLowerCase() === "live" ? "aktif" : "terdaftar"}`,
                      groupName: g.name,
                      groupCount: g.n,
                      groupProjects: g.projects,
                      groupStatus: [g.name, getTone(g.name)],
                    })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    background: "var(--bg-card)",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    textAlign: "left",
                    minWidth: 0,
                  }}
                >
                  <span
                    className="dd-chart__dot"
                    style={{ background: g.color, flex: "none" }}
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      font: "var(--text-cell)",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.name}
                  </span>
                  <span className="dd-num" style={{ font: "var(--text-cell-num)" }}>
                    {g.n}
                  </span>
                  <span
                    style={{
                      font: "var(--text-label)",
                      color: "var(--text-placeholder)",
                      width: 32,
                      textAlign: "right",
                    }}
                  >
                    {g.p}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Equal Row 1: Projects by type (Donut) + Active by division */}
        <div
          className="dd-cardrow dd-cardrow--equal"
          style={{ "--cols": 2, marginTop: 10 } as React.CSSProperties}
        >
          {/* Card: Projects by type */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">Projects by type</h2>
                <p className="dd-card__subtitle">
                  {typeTab === "semua"
                    ? `Semua tahun · ${typeTotal} dari ${totalRegistered} proyek berkategori`
                    : `Proyek aktif · ${typeTotal} dari ${activeProjects.length || 104} proyek berkategori`}
                </p>
              </div>
              <div className="dd-card__actions">
                <div className="dd-seg" role="tablist">
                  <button
                    className={`dd-seg__btn ${typeTab === "semua" ? "dd-seg__btn--active" : ""}`}
                    type="button"
                    onClick={() => setTypeTab("semua")}
                  >
                    Semua
                  </button>
                  <button
                    className={`dd-seg__btn ${typeTab === "aktif" ? "dd-seg__btn--active" : ""}`}
                    type="button"
                    onClick={() => setTypeTab("aktif")}
                  >
                    Aktif
                  </button>
                </div>
              </div>
            </div>

            <div className="dd-card__body" style={{ justifyContent: "center" }}>
              <div className="dd-donut" style={{ flexDirection: "column", gap: 22 }}>
                {/* Donut SVG Ring */}
                <div className="dd-donut__ring" style={{ width: 176, height: 176 }}>
                  <svg
                    viewBox="0 0 156 156"
                    width="176"
                    height="176"
                    role="img"
                    aria-label="Distribusi tipe proyek"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="78"
                      cy="78"
                      r="56"
                      fill="none"
                      stroke="var(--chart-gray-track)"
                      strokeWidth="22"
                    />
                    <circle
                      cx="78"
                      cy="78"
                      r="56"
                      fill="none"
                      stroke={ring0.color}
                      strokeWidth="22"
                      strokeDasharray={ring0.dash}
                      strokeDashoffset={ring0.off}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleTypeClick("Enhance Kecil", typeData[0]?.n)}
                    />
                    <circle
                      cx="78"
                      cy="78"
                      r="56"
                      fill="none"
                      stroke={ring1.color}
                      strokeWidth="22"
                      strokeDasharray={ring1.dash}
                      strokeDashoffset={ring1.off}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleTypeClick("Project Utama", typeData[1]?.n)}
                    />
                    <circle
                      cx="78"
                      cy="78"
                      r="56"
                      fill="none"
                      stroke={ring2.color}
                      strokeWidth="22"
                      strokeDasharray={ring2.dash}
                      strokeDashoffset={ring2.off}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleTypeClick("Approval Digital", typeData[2]?.n)}
                    />
                  </svg>
                  <div className="dd-donut__center">
                    <span className="dd-donut__pct">{typeTotal}</span>
                    <span className="dd-donut__caption">proyek</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="dd-donut__legend" style={{ width: "100%", maxWidth: 380, flex: "none" }}>
                  {typeData.map((t) => (
                    <button
                      key={t.name}
                      className="dd-donut__lrow"
                      type="button"
                      onClick={() => handleTypeClick(t.name, t.n)}
                      style={{
                        border: 0,
                        background: "transparent",
                        fontFamily: "inherit",
                        width: "100%",
                        cursor: "pointer",
                      }}
                    >
                      <span className="dd-chart__dot" style={{ background: t.color }} />
                      <span className="dd-donut__lname" style={{ textAlign: "left" }}>
                        {t.name}
                      </span>
                      <span className="dd-donut__lcount">{t.n}</span>
                      <span className="dd-donut__lpct">{t.p}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Card: Active by division */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">Active by division</h2>
                <p className="dd-card__subtitle">Proyek aktif per divisi · klik bar untuk detail</p>
              </div>
            </div>

            <div className="dd-card__body" style={{ justifyContent: "flex-start" }}>
              <div className="dd-hbar" style={{ "--cat-w": "190px", "--val-w": "28px", "--bar-gap": "11px" } as React.CSSProperties}>
                {actDivs.map((d) => (
                  <React.Fragment key={d.name}>
                    <span className="dd-hbar__ylabel dd-rbar__yl">
                      <span className="dd-rbar__rank">{d.rank}</span>
                      <span className="dd-rbar__name">{d.name}</span>
                    </span>
                    <div className="dd-hbar__plot">
                      <div className="dd-rbar__track">
                        <div
                          className="dd-rbar__fill dd-clickable"
                          onClick={() =>
                            setActiveModal({
                              type: "group",
                              title: d.name,
                              subtitle: `${d.n} proyek aktif`,
                              groupName: d.name,
                              groupCount: d.n,
                              groupStatus: ["On Progress", "blue"],
                              groupProjects: activeProjects
                                .filter((p) => (p["Owner Div"] || p["Owner Division"]) === d.name)
                                .slice(0, d.n),
                            })
                          }
                          style={{ width: d.w, background: "var(--chart-blue-primary)" }}
                        />
                      </div>
                    </div>
                    <span className="dd-hbar__val dd-chart__value">{d.n}</span>
                  </React.Fragment>
                ))}
                <div className="dd-hbar__xaxis">
                  <span className="dd-hbar__tick dd-hbar__tick--first" style={{ left: 0 }}>0</span>
                  <span className="dd-hbar__tick" style={{ left: "50%" }}>{Math.round(actMaxN / 2)}</span>
                  <span className="dd-hbar__tick dd-hbar__tick--last" style={{ left: "100%" }}>{actMaxN}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Equal Row 2: Projects by division + Division SLA leaderboard */}
        <div
          className="dd-cardrow dd-cardrow--equal"
          style={{ "--cols": 2, marginTop: 10 } as React.CSSProperties}
        >
          {/* Card: Projects by division */}
          <section className="dd-card" ref={leftCardRef}>
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">Projects by division</h2>
                <p className="dd-card__subtitle">
                  Semua tahun · 10 divisi peminta terbanyak · klik bar untuk detail
                </p>
              </div>
            </div>

            <div className="dd-card__body" style={{ justifyContent: "flex-start" }}>
              <div className="dd-hbar" style={{ "--cat-w": "190px", "--val-w": "28px", "--bar-gap": "11px" } as React.CSSProperties}>
                {divs.map((d) => (
                  <React.Fragment key={d.name}>
                    <span className="dd-hbar__ylabel dd-rbar__yl">
                      <span className="dd-rbar__rank">{d.rank}</span>
                      <span className="dd-rbar__name">{d.name}</span>
                    </span>
                    <div className="dd-hbar__plot">
                      <div className="dd-rbar__track">
                        <div
                          className="dd-rbar__fill dd-clickable"
                          onClick={() =>
                            setActiveModal({
                              type: "group",
                              title: d.name,
                              subtitle: `${d.n} proyek terdaftar`,
                              groupName: d.name,
                              groupCount: d.n,
                              groupStatus: ["On Progress", "blue"],
                              groupProjects: allProjects
                                .filter((p) => (p["Owner Div"] || p["Owner Division"]) === d.name)
                                .slice(0, d.n),
                            })
                          }
                          style={{ width: d.w, background: "var(--chart-blue-primary)" }}
                        />
                      </div>
                    </div>
                    <span className="dd-hbar__val dd-chart__value">{d.n}</span>
                  </React.Fragment>
                ))}
                <div className="dd-hbar__xaxis">
                  <span className="dd-hbar__tick dd-hbar__tick--first" style={{ left: 0 }}>0</span>
                  <span className="dd-hbar__tick" style={{ left: "50%" }}>{Math.round(reqMaxN / 2)}</span>
                  <span className="dd-hbar__tick dd-hbar__tick--last" style={{ left: "100%" }}>{reqMaxN}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Table: Division SLA leaderboard */}
          <section
            className="dd-table"
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              height: leftCardHeight || 485,
              maxHeight: leftCardHeight || 485,
              overflow: "hidden",
              contain: "size",
            }}
          >
            <div className="dd-table__toolbar">
              <div className="dd-table__titlewrap" style={{ maxWidth: "none" }}>
                <div className="dd-table__titlerow">
                  <h2 className="dd-table__title">Division SLA leaderboard</h2>
                  <span className="dd-count">{leaderboard.length}</span>
                </div>
                <p className="dd-table__hint">DEV SLA {selectedYear} · target 93%</p>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarGutter: "stable" }}>
              <div
                className="dd-table__head"
                style={{
                  gridTemplateColumns: "52px minmax(0, 1fr) 150px 84px",
                  paddingRight: 24,
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  background: "var(--bg-card)",
                }}
              >
                <div className="dd-table__th">#</div>
                <div className="dd-table__th">Division</div>
                <div className="dd-table__th">DEV SLA</div>
                <div className="dd-table__th" style={{ justifyContent: "flex-end" }}>
                  Over SLA
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary)", font: "var(--text-body)" }}>
                  Tidak ada data evaluasi DEV SLA divisi pada tahun {selectedYear}
                </div>
              ) : (
                leaderboard.map((b) => (
                  <div
                    key={b.name}
                    className="dd-table__row"
                    style={{
                      gridTemplateColumns: "52px minmax(0, 1fr) 150px 84px",
                      minHeight: 50,
                      paddingRight: 24,
                    }}
                  >
                    <div className="dd-table__td">
                      <span className="dd-rbar__rank">{b.rank}</span>
                    </div>
                    <div className="dd-table__td">
                      <div className="dd-table__primary">{b.name}</div>
                      <div className="dd-table__secondary">
                        {b.ev} dievaluasi · {b.na} not achieved
                      </div>
                    </div>
                    <div className="dd-table__td">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="dd-rbar__track" style={{ flex: 1 }}>
                          <div
                            className="dd-rbar__fill"
                            style={{ width: b.pct, background: b.color }}
                          />
                        </div>
                        <span
                          className="dd-chart__value"
                          style={{ width: 36, textAlign: "right", color: b.ink }}
                        >
                          {b.pct}
                        </span>
                      </div>
                    </div>
                    <div className="dd-table__td" style={{ textAlign: "right" }}>
                      <span style={{ font: "var(--text-cell-num)", color: "var(--text-secondary)" }}>
                        {b.over}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div style={{ height: 20, flex: "none" }} />
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
