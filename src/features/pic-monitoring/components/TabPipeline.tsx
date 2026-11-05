"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DashboardDataset, SanitizedProject } from "../types/types";
import { buildMonthlyProjectPipeline } from "../services/project-data";
import { PicMonitoringModals, type ModalPayload } from "./PicMonitoringModals";

interface TabPipelineProps {
  dataset: DashboardDataset;
  filteredProjects: SanitizedProject[];
  startYear: number;
  endYear: number;
}

export function TabPipeline({
  filteredProjects = [],
  startYear = 2026,
  endYear = 2026,
}: TabPipelineProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalPayload | null>(null);
  const [qPage, setQPage] = useState(1);

  const selectedYear = endYear || startYear || 2026;
  const prevYear = selectedYear - 1;

  // Real project breakdown
  const yearProjects = useMemo(() => {
    const list = filteredProjects.filter((p) => {
      const y = String(p._year || p.Year || "");
      return y === String(selectedYear);
    });
    return list.length > 0 ? list : filteredProjects;
  }, [filteredProjects, selectedYear]);

  const activeProjects = useMemo(() => {
    return yearProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return !st.includes("canceled") && !st.includes("cancelled") && st !== "live";
    });
  }, [yearProjects]);

  const completedProjects = useMemo(() => {
    return yearProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return st === "live" || st.includes("monitoring");
    });
  }, [yearProjects]);

  const inProgProjs = useMemo(() => {
    return activeProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return !st.includes("monitoring") && !st.includes("queue") && !st.includes("pending") && !st.includes("uat") && !st.includes("hold");
    });
  }, [activeProjects]);

  const monProjs = useMemo(() => {
    return activeProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return st.includes("monitoring");
    });
  }, [activeProjects]);

  const queueProjs = useMemo(() => {
    return activeProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return st.includes("queue") || st.includes("pending");
    });
  }, [activeProjects]);

  const uatProjs = useMemo(() => {
    return activeProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return st.includes("uat");
    });
  }, [activeProjects]);

  const holdProjs = useMemo(() => {
    return activeProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return st.includes("hold");
    });
  }, [activeProjects]);

  const totalCount = yearProjects.length;
  const completedCount = completedProjects.length;
  const activeCount = activeProjects.length;

  const prevYearCount = useMemo(() => {
    return filteredProjects.filter((p) => {
      const y = String(p._year || p.Year || "");
      return y === String(prevYear);
    }).length;
  }, [filteredProjects, prevYear]);

  const totalDeltaPct = useMemo(() => {
    if (prevYearCount === 0) return 0;
    return Math.round(((totalCount - prevYearCount) / prevYearCount) * 100);
  }, [totalCount, prevYearCount]);

  // Completion Rate monthly data (derived dynamically from database)
  const pipelineCurr = useMemo(
    () => buildMonthlyProjectPipeline(filteredProjects, selectedYear, 1, 12),
    [filteredProjects, selectedYear],
  );
  const pipelinePrev = useMemo(
    () => buildMonthlyProjectPipeline(filteredProjects, prevYear, 1, 12),
    [filteredProjects, prevYear],
  );

  const maxVal = useMemo(() => {
    let peak = 1;
    for (let m = 1; m <= 12; m++) {
      const c1 = pipelineCurr.liveByMonth[m]?.length || 0;
      const c2 = pipelinePrev.liveByMonth[m]?.length || 0;
      if (c1 > peak) peak = c1;
      if (c2 > peak) peak = c2;
    }
    return Math.max(20, Math.ceil(peak / 5) * 5);
  }, [pipelineCurr, pipelinePrev]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const completion = useMemo(() => {
    return monthNames.map((n, i) => {
      const m = i + 1;
      const valPrev = pipelinePrev.liveByMonth[m]?.length || 0;
      const valCurr = pipelineCurr.liveByMonth[m]?.length || 0;
      return {
        n,
        a: valPrev,
        ha: `${Math.round((valPrev / maxVal) * 190)}px`,
        t25: `${n} ${prevYear} · ${valPrev} go-live`,
        has: true,
        b: valCurr,
        hb: `${Math.round((valCurr / maxVal) * 190)}px`,
        t26: `${n} ${selectedYear} · ${valCurr} go-live`,
      };
    });
  }, [pipelinePrev, pipelineCurr, maxVal, prevYear, selectedYear]);

  // Delivery by intake year
  const deliveryData = useMemo(() => {
    const getStats = (yr: number) => {
      const projs = filteredProjects.filter((p) => {
        const y = String(p._year || p.Year || "");
        return y === String(yr);
      });
      const comp = projs.filter((p) => {
        const st = String(p["Last Status"] || "").toLowerCase();
        return st === "live" || st.includes("monitoring");
      }).length;
      const act = projs.filter((p) => {
        const st = String(p["Last Status"] || "").toLowerCase();
        return !st.includes("canceled") && !st.includes("cancelled") && st !== "live";
      }).length;
      const tot = projs.length;
      return { tot, comp, act };
    };

    const prev = getStats(prevYear);
    const curr = getStats(selectedYear);
    const maxTot = Math.max(prev.tot, curr.tot, 1);
    const ceiling = Math.max(180, Math.ceil(maxTot / 40) * 40);

    return { prev, curr, ceiling };
  }, [filteredProjects, prevYear, selectedYear]);

  // Queue Data from real filtered projects
  interface QueueItem {
    no: number;
    tk: string;
    name: string;
    div: string;
    project?: SanitizedProject;
  }

  const queueAll: QueueItem[] = useMemo(() => {
    return filteredProjects
      .filter((p) => {
        const st = String(p["Last Status"] || "").toLowerCase();
        return st.includes("queue") || st.includes("pending");
      })
      .map((p, idx) => ({
        no: idx + 1,
        tk: p.Ticket || "-",
        name: p["Project Name"] || "Untitled Project",
        div: p["Owner Div"] || p["Owner Division"] || p["Owner Name"] || "-",
        project: p,
      }));
  }, [filteredProjects]);

  const qSize = 5;
  const qTotal = queueAll.length;
  const queuePage = queueAll.slice((qPage - 1) * qSize, qPage * qSize);
  const queueRange = `${(qPage - 1) * qSize + 1}–${Math.min(qPage * qSize, qTotal)}`;

  return (
    <>
      <div style={{ paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 10 }}>
          <h1 className="dd-page__title">Pipelines</h1>
          <p className="dd-page__subtitle">
            Throughput go-live dan antrean proyek tahun {selectedYear}
          </p>
        </div>

        {/* Top KPIs */}
        <div className="dd-kpi-grid dd-kpi-grid--pipelines">
          {/* Total projects */}
          <button
            type="button"
            className="dd-kpi dd-kpi--accent dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() =>
              setActiveModal({
                type: "kpi",
                title: "Total projects",
                subtitle: "Proyek per tahun pengajuan",
                kpiData: {
                  num: String(totalCount),
                  of: `/ ${totalCount}`,
                  pct: "100%",
                  pctCls: "",
                  hasPct: true,
                  sub: `${totalCount} proyek terdaftar di sistem · ${totalDeltaPct >= 0 ? "▲" : "▼"} ${Math.abs(totalDeltaPct)}% vs ${prevYearCount} di ${prevYear}`,
                  note: `Total ${totalCount} proyek tercatat pada pipeline pengajuan tahun ${selectedYear}.`,
                  rows: [
                    { name: String(selectedYear), val: `${totalCount} proyek`, w: "100%", color: "var(--chart-blue-primary)" },
                    { name: String(prevYear), val: `${prevYearCount} proyek`, w: `${totalCount > 0 ? Math.min(100, Math.round((prevYearCount / totalCount) * 100)) : 0}%`, color: "var(--chart-blue-light)" },
                  ],
                  goLabel: "Buka Project list",
                  onGo: () => router.push("/dashboard/pic-monitoring/projects"),
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
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
              </span>
              <span className="dd-kpi__label">Total projects</span>
            </div>
            <span className="dd-kpi__delta dd-delta dd-delta--on-accent">
              {totalDeltaPct >= 0 ? `▲ ${totalDeltaPct}%` : `▼ ${Math.abs(totalDeltaPct)}%`}
            </span>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{totalCount}</span>
              <span className="dd-kpi__sub">vs {prevYearCount} di {prevYear}</span>
            </div>
          </button>

          {/* Completed */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click"
            style={{ textAlign: "left" }}
            onClick={() => {
              const pctVal = Math.round((completedCount / totalCount) * 100);
              setActiveModal({
                type: "kpi",
                title: "Completed",
                subtitle: `Proyek berstatus Live · ${selectedYear}`,
                kpiData: {
                  num: String(completedCount),
                  of: `/${totalCount}`,
                  pct: `${pctVal}%`,
                  pctCls: "kpct--green",
                  hasPct: true,
                  sub: "proyek berstatus Live",
                  note: `Dari ${totalCount} proyek tahun pengajuan ${selectedYear}, ${completedCount} sudah Live dan ${activeCount} masih berjalan.`,
                  rows: [
                    {
                      name: "Selesai (Live)",
                      val: `${completedCount} proyek`,
                      w: `${pctVal}%`,
                      color: "var(--chart-green)",
                      ink: "var(--status-green-fg)",
                    },
                    {
                      name: "Aktif",
                      val: `${activeCount} proyek`,
                      w: `${Math.round((activeCount / totalCount) * 100)}%`,
                      color: "var(--chart-amber)",
                    },
                  ],
                  goLabel: "Buka Project list",
                  onGo: () => router.push("/dashboard/pic-monitoring/projects"),
                },
              });
            }}
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
                  <path d="m9 11 3 3L22 4" />
                </svg>
              </span>
              <span className="dd-kpi__label">Completed</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{completedCount}</span>
              <span className="dd-kpi__sub">status Live</span>
            </div>
          </button>

          {/* Active */}
          <button
            type="button"
            className="dd-kpi dd-kpi--click dd-kpi--span-full"
            style={{ textAlign: "left" }}
            onClick={() => {
              const inProgN = inProgProjs.length;
              const monN = monProjs.length;
              const queueN = queueProjs.length;
              const uatN = uatProjs.length;
              const holdN = holdProjs.length;
              const pctVal = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;
              const inProgPct = activeCount > 0 ? Math.round((inProgN / activeCount) * 100) : 0;
              const monPct = activeCount > 0 ? Math.round((monN / activeCount) * 100) : 0;
              const queuePct = activeCount > 0 ? Math.round((queueN / activeCount) * 100) : 0;
              const uatPct = activeCount > 0 ? Math.round((uatN / activeCount) * 100) : 0;
              const holdPct = activeCount > 0 ? Math.round((holdN / activeCount) * 100) : 0;

              setActiveModal({
                type: "kpi",
                title: "Active",
                subtitle: "Proyek aktif per kelompok status",
                kpiData: {
                  num: String(activeCount),
                  of: `/${totalCount}`,
                  pct: `${pctVal}%`,
                  pctCls: "",
                  hasPct: true,
                  sub: "proyek masih berjalan",
                  note: "Klik kelompok untuk melihat proyeknya.",
                  rows: [
                    {
                      name: "In progress",
                      val: `${inProgN} proyek · ${inProgPct}%`,
                      w: `${inProgPct}%`,
                      color: "var(--chart-blue-primary)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "inprog",
                          title: "In progress projects",
                          subtitle: `${inProgN} proyek di FSD, DEV, SIT dan change request`,
                        }),
                    },
                    {
                      name: "Monitoring",
                      val: `${monN} proyek · ${monPct}%`,
                      w: `${monPct}%`,
                      color: "var(--chart-green)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "Monitoring",
                          subtitle: `${monN} proyek aktif`,
                          groupName: "Monitoring",
                          groupCount: monN,
                          groupProjects: monProjs,
                        }),
                    },
                    {
                      name: "Queue",
                      val: `${queueN} proyek · ${queuePct}%`,
                      w: `${queuePct}%`,
                      color: "var(--chart-amber)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "Queue",
                          subtitle: `${queueN} proyek aktif`,
                          groupName: "Queue",
                          groupCount: queueN,
                          groupProjects: queueProjs,
                        }),
                    },
                    {
                      name: "UAT",
                      val: `${uatN} proyek · ${uatPct}%`,
                      w: `${uatPct}%`,
                      color: "var(--chart-blue-light)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "UAT",
                          subtitle: `${uatN} proyek aktif`,
                          groupName: "UAT",
                          groupCount: uatN,
                          groupProjects: uatProjs,
                        }),
                    },
                    {
                      name: "Hold",
                      val: `${holdN} proyek · ${holdPct}%`,
                      w: `${holdPct}%`,
                      color: "var(--chart-neutral)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "Hold",
                          subtitle: `${holdN} proyek aktif`,
                          groupName: "Hold",
                          groupCount: holdN,
                          groupProjects: holdProjs,
                        }),
                    },
                  ],
                  goLabel: "Buka Overview",
                  onGo: () => router.push("/dashboard/pic-monitoring"),
                },
              });
            }}
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
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </span>
              <span className="dd-kpi__label">Active</span>
            </div>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{activeCount}</span>
              <span className="dd-kpi__sub">masih berjalan</span>
            </div>
          </button>
        </div>

        {/* Completion Rate Chart Card */}
        <section className="dd-card" style={{ marginTop: 10 }}>
          <div className="dd-card__head">
            <div>
              <h2 className="dd-card__title">Completion rate</h2>
              <p className="dd-card__subtitle">
                Realisasi go-live per bulan · arahkan kursor ke bar
              </p>
            </div>
            <div className="dd-card__actions dd-chart__legend">
              <span className="dd-chart__legenditem">
                <span
                  className="dd-chart__dot"
                  style={{ background: "var(--chart-blue-light)" }}
                />
                {prevYear}
              </span>
              <span className="dd-chart__legenditem">
                <span
                  className="dd-chart__dot"
                  style={{ background: "var(--chart-blue-primary)" }}
                />
                {selectedYear}
              </span>
            </div>
          </div>

          <div className="dd-card__body">
            <div style={{ display: "flex", gap: 8 }}>
              {/* Y Axis */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: 200,
                  paddingTop: 18,
                  font: "var(--text-axis)",
                  color: "var(--chart-axis)",
                  textAlign: "right",
                  width: 22,
                }}
              >
                <span>{maxVal}</span>
                <span>{Math.round(maxVal / 2)}</span>
                <span>0</span>
              </div>

              {/* Bar plot grid */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  height: 218,
                  borderLeft: "1px solid var(--border-divider)",
                  borderBottom: "1px solid var(--border-divider)",
                  background:
                    "linear-gradient(var(--chart-grid) 1px, transparent 1px) 0 18px / 100% 100px",
                }}
              >
                {completion.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-end",
                      gap: 4,
                      height: "100%",
                    }}
                  >
                    {/* Bar 2025 */}
                    <div
                      title={c.t25}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <span className="dd-chart__barval" style={{ font: "var(--text-axis)" }}>
                        {c.a}
                      </span>
                      <div
                        style={{
                          width: 22,
                          borderRadius: "4px 4px 0 0",
                          background: "var(--chart-blue-light)",
                          height: c.ha,
                        }}
                      />
                    </div>

                    {/* Bar 2026 */}
                    {c.has && (
                      <div
                        title={c.t26}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <span style={{ font: "var(--text-axis)", color: "var(--text-secondary)" }}>
                          {c.b}
                        </span>
                        <div
                          style={{
                            width: 22,
                            borderRadius: "4px 4px 0 0",
                            background: "var(--chart-blue-primary)",
                            height: c.hb,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* X Axis labels */}
            <div style={{ display: "flex", marginLeft: 30, marginTop: 6 }}>
              {completion.map((c, i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    font: "var(--text-axis)",
                    color: "var(--chart-axis)",
                  }}
                >
                  {c.n}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Focus Row: Queue Table + Delivery by Intake Year */}
        <div className="dd-cardrow dd-cardrow--focus" style={{ marginTop: 10 }}>
          {/* Table: Queue */}
          <section className="dd-table">
            <div className="dd-table__toolbar">
              <div className="dd-table__titlewrap" style={{ maxWidth: "none" }}>
                <div className="dd-table__titlerow">
                  <h2 className="dd-table__title">Queue</h2>
                  <span className="dd-count">{qTotal}</span>
                </div>
                <p className="dd-table__hint">Backlog terverifikasi, urut prioritas</p>
              </div>
            </div>

            <div
              className="dd-table__head"
              style={{
                gridTemplateColumns: "56px 110px minmax(0, 1fr) 190px 110px",
              }}
            >
              <div className="dd-table__th">No</div>
              <div className="dd-table__th">Ticket</div>
              <div className="dd-table__th">Project</div>
              <div className="dd-table__th">Owner division</div>
              <div className="dd-table__th">Status</div>
            </div>

            {queuePage.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary)", font: "var(--text-body)" }}>
                Tidak ada proyek dalam antrean
              </div>
            ) : (
              queuePage.map((q) => (
                <div
                  key={q.tk}
                  className="dd-table__row"
                  style={{
                    gridTemplateColumns: "56px 110px minmax(0, 1fr) 190px 110px",
                    cursor: "default",
                  }}
                >
                  <div className="dd-table__td">
                    <span className="dd-table__idx">{q.no}</span>
                  </div>
                  <div className="dd-table__td">
                    <span style={{ font: "var(--text-cell-num)", color: "var(--text-secondary)" }}>
                      {q.tk}
                    </span>
                  </div>
                  <div className="dd-table__td">
                    <div className="dd-table__primary">{q.name}</div>
                  </div>
                  <div className="dd-table__td">
                    <span className="dd-chip dd-chip--entity">{q.div}</span>
                  </div>
                  <div className="dd-table__td">
                    <span className="dd-pill dd-pill--amber">
                      <span className="dd-pill__dot" />
                      On Queue
                    </span>
                  </div>
                </div>
              ))
            )}

            <div className="dd-table__foot">
              <span className="dd-table__count">
                {qTotal === 0 ? "0 proyek" : `${queueRange} dari total ${qTotal} proyek`}
              </span>
              <div className="dd-pager">
                {Array.from({ length: Math.ceil(qTotal / qSize) || 1 }, (_, i) => i + 1).slice(0, 5).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`dd-pager__btn ${n === qPage ? "dd-pager__btn--active" : ""}`}
                    onClick={() => setQPage(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Card: Delivery by intake year */}
          <section className="dd-card">
            <div className="dd-card__head">
              <div>
                <h2 className="dd-card__title">Delivery by intake year</h2>
                <p className="dd-card__subtitle">
                  Project volume: selesai vs aktif per tahun pengajuan
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
              <div style={{ font: "var(--text-axis)", color: "var(--text-muted)" }}>
                Project volume · jumlah proyek per tahun pengajuan
              </div>

              <div
                role="img"
                aria-label={`${prevYear}: ${deliveryData.prev.comp} selesai dan ${deliveryData.prev.act} aktif. ${selectedYear}: ${deliveryData.curr.comp} selesai dan ${deliveryData.curr.act} aktif.`}
                style={{
                  flex: 1,
                  minHeight: 220,
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
                  <span style={{ position: "absolute", right: 0, top: 0, transform: "translateY(-50%)" }}>{deliveryData.ceiling}</span>
                  <span style={{ position: "absolute", right: 0, top: "25%", transform: "translateY(-50%)" }}>{Math.round(deliveryData.ceiling * 0.75)}</span>
                  <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>{Math.round(deliveryData.ceiling * 0.5)}</span>
                  <span style={{ position: "absolute", right: 0, top: "75%", transform: "translateY(-50%)" }}>{Math.round(deliveryData.ceiling * 0.25)}</span>
                  <span style={{ position: "absolute", right: 0, top: "100%", transform: "translateY(-50%)" }}>0</span>
                </div>

                {/* Plot Area */}
                <div
                  style={{
                    position: "relative",
                    marginTop: 22,
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
                    aria-label={`Tahun ${prevYear}, ${deliveryData.prev.tot} proyek`}
                    style={{
                      position: "absolute",
                      left: "17%",
                      width: "26%",
                      bottom: 0,
                      height: `${Math.min(100, Math.round((deliveryData.prev.tot / deliveryData.ceiling) * 100))}%`,
                      background: "none",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
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
                      {deliveryData.prev.tot}
                    </span>
                    {deliveryData.prev.act > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          height: `${(deliveryData.prev.act / deliveryData.prev.tot) * 100}%`,
                          background: "var(--chart-amber)",
                          borderRadius: "6px 6px 0 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-on-accent)",
                          font: "var(--text-cell-num)",
                        }}
                      >
                        {deliveryData.prev.act}
                      </div>
                    )}
                    {deliveryData.prev.comp > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: `${(deliveryData.prev.comp / deliveryData.prev.tot) * 100}%`,
                          background: "var(--chart-green)",
                          borderRadius: deliveryData.prev.act === 0 ? "6px 6px 0 0" : 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-on-accent)",
                          font: "var(--text-cell-num)",
                        }}
                      >
                        {deliveryData.prev.comp}
                      </div>
                    )}
                    <span
                      className="tip tipcard"
                      style={{ left: -64, top: 34 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun {prevYear}</span>
                        <span className="dd-pill dd-pill--blue">{deliveryData.prev.tot} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Project volume</span>
                        <span>{deliveryData.prev.tot} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Selesai</span>
                        <span style={{ color: "var(--status-green-fg)" }}>{deliveryData.prev.comp} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Aktif</span>
                        <span style={{ color: "var(--status-amber-fg)" }}>{deliveryData.prev.act} proyek</span>
                      </span>
                    </span>
                  </button>

                  {/* Current Year Column */}
                  <button
                    type="button"
                    className="hv"
                    aria-label={`Tahun ${selectedYear}, ${deliveryData.curr.tot} proyek`}
                    style={{
                      position: "absolute",
                      left: "57%",
                      width: "26%",
                      bottom: 0,
                      height: `${Math.min(100, Math.round((deliveryData.curr.tot / deliveryData.ceiling) * 100))}%`,
                      background: "none",
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
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
                      {deliveryData.curr.tot}
                    </span>
                    {deliveryData.curr.act > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          height: `${(deliveryData.curr.act / deliveryData.curr.tot) * 100}%`,
                          background: "var(--chart-amber)",
                          borderRadius: "6px 6px 0 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-on-accent)",
                          font: "var(--text-cell-num)",
                        }}
                      >
                        {deliveryData.curr.act}
                      </div>
                    )}
                    {deliveryData.curr.comp > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: `${(deliveryData.curr.comp / deliveryData.curr.tot) * 100}%`,
                          background: "var(--chart-green)",
                          borderRadius: deliveryData.curr.act === 0 ? "6px 6px 0 0" : 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-on-accent)",
                          font: "var(--text-cell-num)",
                        }}
                      >
                        {deliveryData.curr.comp}
                      </div>
                    )}
                    <span
                      className="tip tipcard"
                      style={{ right: -28, top: 34 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun {selectedYear}</span>
                        <span className="dd-pill dd-pill--blue">{deliveryData.curr.tot} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Project volume</span>
                        <span>{deliveryData.curr.tot} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Selesai</span>
                        <span style={{ color: "var(--status-green-fg)" }}>{deliveryData.curr.comp} proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Aktif</span>
                        <span style={{ color: "var(--status-amber-fg)" }}>{deliveryData.curr.act} proyek</span>
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
                  <span className="dd-chart__dot" style={{ background: "var(--chart-green)" }} />
                  Selesai
                </span>
                <span className="dd-chart__legenditem">
                  <span className="dd-chart__dot" style={{ background: "var(--chart-amber)" }} />
                  Aktif
                </span>
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
