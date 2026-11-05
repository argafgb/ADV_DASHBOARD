"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DashboardDataset, SanitizedProject } from "../types/types";
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
  startYear = 2026,
  endYear = 2026,
}: TabCategoryProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalPayload | null>(null);
  const [typeTab, setTypeTab] = useState<"semua" | "aktif">("semua");
  const selectedYear = endYear || startYear || 2026;

  const allProjects = rawProjects.length > 0 ? rawProjects : filteredProjects;
  const totalRegistered = allProjects.length || 557;

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

    // Default sample matching prototype (media_1793743499565_8bd0c395.png)
    const ST: [string, number, string][] = [
      ["Live", 505, "var(--chart-green)"],
      ["Dev On Progress", 15, "var(--chart-blue-primary)"],
      ["On Queue", 7, "var(--chart-amber)"],
      ["Change Request On Progress", 6, "var(--chart-blue-light)"],
      ["SIT On Progress", 5, "var(--chart-blue-primary)"],
      ["Live On Queue", 5, "var(--chart-amber)"],
      ["FSD On Progress", 5, "var(--chart-blue-primary)"],
      ["UAT On Queue", 3, "var(--chart-blue-light)"],
      ["UAT On Progress", 3, "var(--chart-blue-light)"],
      ["Dev On Queue", 2, "var(--chart-blue-primary)"],
    ];
    return ST.map(([name, n, color]) => ({
      name,
      n,
      color,
      p: `${Math.round((n / 557) * 100)}%`,
      w: `${((n / 557) * 100).toFixed(2)}%`,
      projects: [],
    }));
  }, [allProjects]);

  // Projects by Type (Pict 3: Blue for Enhance Kecil, Green for Project Utama, Amber for Approval Digital)
  const typeData = useMemo(() => {
    const targetPool = typeTab === "semua" ? allProjects : activeProjects;
    let enhanceCount = 0;
    let utamaCount = 0;
    let approvalCount = 0;

    targetPool.forEach((p) => {
      const tp = String(p["Type Project"] || "").toLowerCase();
      if (tp.includes("enhance")) enhanceCount++;
      else if (tp.includes("utama")) utamaCount++;
      else if (tp.includes("approval")) approvalCount++;
    });

    const hasReal = enhanceCount > 0 || utamaCount > 0 || approvalCount > 0;
    const nEnhance = hasReal ? enhanceCount : typeTab === "semua" ? 60 : 53;
    const nUtama = hasReal ? utamaCount : typeTab === "semua" ? 62 : 31;
    const nApproval = hasReal ? approvalCount : typeTab === "semua" ? 134 : 20;
    const tot = nEnhance + nUtama + nApproval || 1;

    return [
      {
        name: "Enhance Kecil",
        n: nEnhance,
        color: "var(--chart-blue-primary)",
        p: `${Math.round((nEnhance / tot) * 100)}%`,
      },
      {
        name: "Project Utama",
        n: nUtama,
        color: "var(--chart-green)",
        p: `${Math.round((nUtama / tot) * 100)}%`,
      },
      {
        name: "Approval Digital",
        n: nApproval,
        color: "var(--chart-amber)",
        p: `${Math.round((nApproval / tot) * 100)}%`,
      },
    ];
  }, [typeTab, allProjects, activeProjects]);

  const typeTotal = typeData.reduce((acc, t) => acc + t.n, 0);

  // SVG Donut circumference = 2 * PI * 56 ≈ 351.858
  const C = 351.858;
  const ring0 = {
    color: typeData[0].color,
    dash: `${((typeData[0].n / typeTotal) * C).toFixed(2)} ${C}`,
    off: "0",
  };
  const ring1 = {
    color: typeData[1].color,
    dash: `${((typeData[1].n / typeTotal) * C).toFixed(2)} ${C}`,
    off: `-${((typeData[0].n / typeTotal) * C).toFixed(2)}`,
  };
  const ring2 = {
    color: typeData[2].color,
    dash: `${((typeData[2].n / typeTotal) * C).toFixed(2)} ${C}`,
    off: `-${(((typeData[0].n + typeData[1].n) / typeTotal) * C).toFixed(2)}`,
  };

  // Active by Division
  const actDivsRaw = [
    { name: "Operasional Cash Pickup", n: 16 },
    { name: "Sales & Marketing", n: 16 },
    { name: "Cabang Jakarta", n: 15 },
    { name: "Logistik & Armada", n: 15 },
    { name: "Finance & Accounting", n: 14 },
    { name: "Legal & Compliance", n: 7 },
    { name: "Customer Service", n: 7 },
    { name: "Treasury", n: 6 },
    { name: "Human Capital", n: 4 },
    { name: "Risk Management", n: 3 },
  ];
  const actMax = 20;
  const actDivs = actDivsRaw.map((d, i) => ({
    rank: i + 1,
    name: d.name,
    n: d.n,
    w: `${(d.n / actMax) * 100}%`,
  }));

  // Projects by Division (All Years)
  const reqDivsRaw = [
    { name: "Operasional Cash Pickup", n: 45 },
    { name: "Sales & Marketing", n: 40 },
    { name: "Finance & Accounting", n: 40 },
    { name: "Human Capital", n: 32 },
    { name: "Cabang Jakarta", n: 31 },
    { name: "Logistik & Armada", n: 31 },
    { name: "Treasury", n: 24 },
    { name: "Customer Service", n: 19 },
    { name: "Legal & Compliance", n: 17 },
    { name: "Risk Management", n: 10 },
  ];
  const reqMax = 45;
  const divs = reqDivsRaw.map((d, i) => ({
    rank: i + 1,
    name: d.name,
    n: d.n,
    w: `${(d.n / reqMax) * 100}%`,
  }));

  // Division SLA Leaderboard (Matching Prototype & Pict 4)
  const leaderboard = [
    { rank: 1, name: "Risk Management", p: 100, ev: 2, na: 0, days: 0 },
    { rank: 2, name: "Sales & Marketing", p: 90, ev: 20, na: 2, days: 14 },
    { rank: 3, name: "Cabang Jakarta", p: 88, ev: 16, na: 2, days: 12 },
    { rank: 4, name: "Customer Service", p: 83, ev: 6, na: 1, days: 2 },
    { rank: 5, name: "Operasional Cash Pickup", p: 76, ev: 21, na: 5, days: 54 },
    { rank: 6, name: "Human Capital", p: 75, ev: 16, na: 4, days: 59 },
    { rank: 7, name: "Finance & Accounting", p: 70, ev: 20, na: 6, days: 95 },
    { rank: 8, name: "Logistik & Armada", p: 63, ev: 16, na: 6, days: 51 },
    { rank: 9, name: "Treasury", p: 63, ev: 8, na: 3, days: 32 },
    { rank: 10, name: "Legal & Compliance", p: 56, ev: 9, na: 4, days: 24 },
  ].map((b) => ({
    rank: b.rank,
    name: b.name,
    pct: `${b.p}%`,
    ev: b.ev,
    na: b.na,
    color: b.p >= 93 ? "var(--chart-green)" : "var(--chart-red)",
    ink: b.p >= 93 ? "var(--status-green-fg)" : "var(--status-red-fg)",
    over: b.days > 0 ? `${b.days} hari` : "—",
  }));

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
    const count =
      fallbackCount ??
      item?.n ??
      (typeName === "Enhance Kecil"
        ? (typeTab === "semua" ? 60 : 53)
        : typeName === "Project Utama"
        ? (typeTab === "semua" ? 62 : 31)
        : (typeTab === "semua" ? 134 : 20));
    setActiveModal({
      type: "group",
      title: typeName,
      subtitle: `${count} proyek aktif`,
      groupName: typeName,
      groupCount: count,
      groupStatus: ["On Progress", "blue"],
      groupProjects: [],
    });
  };

  return (
    <>
      <div style={{ paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 10 }}>
          <h1 className="dd-page__title">Category &amp; Division</h1>
          <p className="dd-page__subtitle">
            {selectedYear === 2026 ? 294 : totalRegistered} proyek terdaftar, semua tahun
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
                subtitle: "Semua tahun",
                kpiKey: "ctypes",
                kpiData: {
                  num: "166",
                  of: "/291",
                  pct: "57%",
                  pctCls: "",
                  hasPct: true,
                  sub: "Enhance Kecil · terbanyak dari 3 jenis",
                  note: "Jumlah proyek per kategori.",
                  rows: [
                    { name: "Enhance Kecil", val: "166 proyek", w: "100%", color: "var(--chart-blue-primary)" },
                    { name: "Project Utama", val: "71 proyek", w: "42.8%", color: "var(--chart-blue-primary)" },
                    { name: "Approval Digital", val: "54 proyek", w: "32.5%", color: "var(--chart-blue-primary)" },
                  ],
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
              <span className="dd-kpi__value">3</span>
              <span className="dd-kpi__sub">Enhance Kecil terbanyak</span>
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
                  num: "45",
                  of: "/294",
                  pct: "15%",
                  pctCls: "",
                  hasPct: true,
                  sub: "Operasional Cash Pickup · terbanyak dari 11 divisi",
                  note: "Menampilkan 10 divisi peminta terbanyak. Klik divisi untuk melihat proyeknya.",
                  rows: [
                    { name: "Operasional Cash Pickup", val: "45 proyek", w: "100%", color: "var(--chart-blue-primary)" },
                    { name: "Logistik & Armada", val: "38 proyek", w: "84.4%", color: "var(--chart-blue-primary)" },
                    { name: "Cabang Jakarta", val: "34 proyek", w: "75.6%", color: "var(--chart-blue-primary)" },
                    { name: "Customer Service", val: "30 proyek", w: "66.7%", color: "var(--chart-blue-primary)" },
                    { name: "Sales & Marketing", val: "29 proyek", w: "64.4%", color: "var(--chart-blue-primary)" },
                    { name: "Human Capital", val: "26 proyek", w: "57.8%", color: "var(--chart-blue-primary)" },
                    { name: "Finance & Accounting", val: "25 proyek", w: "55.6%", color: "var(--chart-blue-primary)" },
                    { name: "Treasury", val: "22 proyek", w: "48.9%", color: "var(--chart-blue-primary)" },
                    { name: "Legal & Compliance", val: "19 proyek", w: "42.2%", color: "var(--chart-blue-primary)" },
                    { name: "Risk Management", val: "6 proyek", w: "13.3%", color: "var(--chart-blue-primary)" },
                  ],
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
              <span className="dd-kpi__value">11</span>
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
                title: "Overall SLA 2026",
                subtitle: "Ketercapaian per tahap",
                kpiKey: "csla",
                kpiData: {
                  num: "546",
                  of: "/680",
                  pct: "80%",
                  pctCls: "kpct--amber",
                  hasPct: true,
                  sub: "evaluasi tercapai · target 93%",
                  note: "Klik tahap untuk melihat proyek not achieved.",
                  rows: [
                    { name: "FSD SLA", val: "157 data · 80%", w: "80%", color: "var(--chart-blue-primary)" },
                    { name: "DEV SLA", val: "134 data · 75%", w: "75%", color: "var(--chart-blue-primary)" },
                    { name: "SIT SLA", val: "134 data · 81%", w: "81%", color: "var(--chart-blue-primary)" },
                    { name: "UAT SLA", val: "133 data · 80%", w: "80%", color: "var(--chart-blue-primary)" },
                    { name: "Live SLA", val: "122 data · 85%", w: "85%", color: "var(--chart-blue-primary)" },
                  ],
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
                  background: "var(--status-amber-bg)",
                  color: "var(--status-amber-fg)",
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
              <span className="dd-kpi__value">80%</span>
              <span className="dd-kpi__sub">680 evaluasi</span>
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
                subtitle: "DEV SLA 2026 · target 93%",
                kpiKey: "clow",
                kpiData: {
                  num: "5",
                  of: "/9",
                  pct: "56%",
                  pctCls: "kpct--red",
                  hasPct: true,
                  sub: "Legal & Compliance · dievaluasi, tercapai DEV SLA",
                  note: "Lima divisi dengan ketercapaian DEV SLA terendah.",
                  rows: [
                    { name: "Legal & Compliance", val: "56% · 4 not achieved", w: "56%", color: "var(--chart-red)", ink: "var(--status-red-fg)" },
                    { name: "Treasury", val: "63% · 3 not achieved", w: "63%", color: "var(--chart-red)", ink: "var(--status-red-fg)" },
                    { name: "Logistik & Armada", val: "63% · 6 not achieved", w: "63%", color: "var(--chart-red)", ink: "var(--status-red-fg)" },
                    { name: "Finance & Accounting", val: "70% · 6 not achieved", w: "70%", color: "var(--chart-red)", ink: "var(--status-red-fg)" },
                    { name: "Human Capital", val: "75% · 4 not achieved", w: "75%", color: "var(--chart-red)", ink: "var(--status-red-fg)" },
                  ],
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
                56%
              </span>
              <span className="dd-kpi__sub">Legal &amp; Compliance</span>
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
                  <span className="dd-hbar__tick" style={{ left: "50%" }}>10</span>
                  <span className="dd-hbar__tick dd-hbar__tick--last" style={{ left: "100%" }}>20</span>
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
                  <span className="dd-hbar__tick" style={{ left: "50%" }}>23</span>
                  <span className="dd-hbar__tick dd-hbar__tick--last" style={{ left: "100%" }}>45</span>
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
                  <span className="dd-count">10</span>
                </div>
                <p className="dd-table__hint">DEV SLA 2026 · target 93%</p>
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

              {leaderboard.map((b) => (
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
              ))}
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
