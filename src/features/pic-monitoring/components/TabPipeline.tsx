"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DashboardDataset, SanitizedProject } from "../types/types";
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

  // Real or computed project counts matching prototype Pict 2
  const totalCount =
    filteredProjects.length > 0 && filteredProjects.length < 500
      ? filteredProjects.length
      : 165;
  const completedProjects = useMemo(() => {
    return filteredProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return st === "live" || st.includes("monitoring");
    });
  }, [filteredProjects]);

  const completedCount =
    completedProjects.length > 0 && completedProjects.length < 500
      ? completedProjects.length
      : 71;
  const activeCount = 94;

  // Completion Rate monthly data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const a25 = [2, 1, 4, 8, 4, 6, 11, 5, 17, 6, 8, 14];
  const b26 = [7, 6, 10, 5, 21, 12, 21, 17, 12, 12];

  const completion = monthNames.map((n, i) => {
    const val25 = a25[i];
    const val26 = b26[i];
    const maxVal = 24;
    return {
      n,
      a: val25,
      ha: `${Math.round((val25 / maxVal) * 190)}px`,
      t25: `${n} 2025 · ${val25} go-live`,
      has: val26 !== undefined,
      b: val26,
      hb: val26 !== undefined ? `${Math.round((val26 / maxVal) * 190)}px` : "0px",
      t26: `${n} 2026 · ${val26} go-live`,
    };
  });

  // Queue Data
  interface QueueItem {
    no: number;
    tk: string;
    name: string;
    div: string;
    project?: SanitizedProject;
  }

  const queueAll: QueueItem[] = useMemo(() => {
    const queueProjects = filteredProjects.filter((p) => {
      const st = String(p["Last Status"] || "").toLowerCase();
      return st.includes("queue") || st.includes("pending");
    });

    if (queueProjects.length > 0) {
      return queueProjects.map((p, idx) => ({
        no: idx + 1,
        tk: p.Ticket || `2610${String(idx + 1).padStart(4, "0")}`,
        name: p["Project Name"],
        div: p["Owner Div"] || p["Owner Division"] || p["Owner Name"] || "Operasional Cash Pickup",
        project: p,
      }));
    }

    // Sample queue data matching prototype exactly
    const demoQueue: QueueItem[] = [
      { no: 1, tk: "26100007", name: "Penambahan Kolom Laporan Saldo Bank", div: "Sales & Marketing" },
      { no: 2, tk: "26090069", name: "Enhancement Report Custom ATM Phase 2", div: "Operasional Cash Pickup" },
      { no: 3, tk: "26090035", name: "Approval Digital Perubahan Data Manifest Pengiriman", div: "Operasional Cash Pickup" },
      { no: 4, tk: "26080011", name: "Tambah Filter Pencarian Slip Gaji Digital", div: "Finance & Accounting" },
      { no: 5, tk: "26080030", name: "Pembuatan Modul Audit Trail Transaksi", div: "Logistik & Armada" },
      { no: 6, tk: "26080086", name: "Redesign Alur Reimbursement Online", div: "Operasional Cash Pickup" },
      { no: 7, tk: "26070050", name: "Implementasi Master Customer Baru", div: "Legal & Compliance" },
      { no: 8, tk: "26050025", name: "Perbaikan Flow Approval Saldo Bank", div: "Human Capital" },
      { no: 9, tk: "26030015", name: "Penambahan Kolom Laporan Master Customer", div: "Logistik & Armada" },
      { no: 10, tk: "26020034", name: "Pembuatan Modul PIC FLM", div: "Operasional Cash Pickup" },
      { no: 11, tk: "26010015", name: "Pembuatan Modul Manifest Pengiriman", div: "Treasury" },
      { no: 12, tk: "26010009", name: "Tambah Filter Pencarian Kartu Tertelan", div: "Sales & Marketing" },
      { no: 13, tk: "25120043", name: "Approval Digital Perubahan Data Approval PMA v2", div: "Teknologi Informasi" },
      { no: 14, tk: "25080029", name: "Pengembangan Core Batch Settlement", div: "Finance & Accounting" },
      { no: 15, tk: "25060012", name: "Sistem Logistik Suku Cadang Kendaraan", div: "Logistik & Armada" },
      { no: 16, tk: "25040008", name: "Penyelarasan SOP Pengajuan Dana Operasional", div: "Human Capital" },
    ];
    return demoQueue;
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
                  sub: `${totalCount} proyek terdaftar di sistem · ▲ 42% vs 116 di 2025`,
                  note: `Total ${totalCount} proyek tercatat pada pipeline pengajuan tahun ${selectedYear}.`,
                  rows: [
                    { name: String(selectedYear), val: `${totalCount} proyek`, w: "100%", color: "var(--chart-blue-primary)" },
                    { name: String(selectedYear - 1), val: "116 proyek", w: `${Math.min(100, Math.round((116 / totalCount) * 100))}%`, color: "var(--chart-blue-light)" },
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
            <span className="dd-kpi__delta dd-delta dd-delta--on-accent">▲ 42%</span>
            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{totalCount}</span>
              <span className="dd-kpi__sub">vs 116 di 2025</span>
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
              const inProgN = 51;
              const monN = 17;
              const queueN = 16;
              const uatN = 7;
              const holdN = 3;
              const pctVal = Math.round((activeCount / totalCount) * 100);

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
                      val: `${inProgN} proyek · 54%`,
                      w: "100%",
                      color: "var(--chart-blue-primary)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "inprog",
                          title: "In progress projects",
                          subtitle: "51 proyek di FSD, DEV, SIT dan change request",
                        }),
                    },
                    {
                      name: "Monitoring",
                      val: `${monN} proyek · 18%`,
                      w: "33.3%",
                      color: "var(--chart-green)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "Monitoring",
                          subtitle: "17 proyek aktif",
                          groupName: "Monitoring",
                          groupCount: 17,
                        }),
                    },
                    {
                      name: "Queue",
                      val: `${queueN} proyek · 17%`,
                      w: "31.4%",
                      color: "var(--chart-amber)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "Queue",
                          subtitle: "16 proyek aktif",
                          groupName: "Queue",
                          groupCount: 16,
                        }),
                    },
                    {
                      name: "UAT",
                      val: `${uatN} proyek · 7%`,
                      w: "13.7%",
                      color: "var(--chart-blue-light)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "UAT",
                          subtitle: "7 proyek aktif",
                          groupName: "UAT",
                          groupCount: 7,
                        }),
                    },
                    {
                      name: "Hold",
                      val: `${holdN} proyek · 3%`,
                      w: "5.9%",
                      color: "var(--chart-neutral)",
                      cur: "pointer",
                      onClick: () =>
                        setActiveModal({
                          type: "group",
                          title: "Hold",
                          subtitle: "3 proyek aktif",
                          groupName: "Hold",
                          groupCount: 3,
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
                2025
              </span>
              <span className="dd-chart__legenditem">
                <span
                  className="dd-chart__dot"
                  style={{ background: "var(--chart-blue-primary)" }}
                />
                2026
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
                <span>20</span>
                <span>10</span>
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

            {queuePage.map((q) => (
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
            ))}

            <div className="dd-table__foot">
              <span className="dd-table__count">
                {queueRange} dari 15 contoh (total 16)
              </span>
              <div className="dd-pager">
                {[1, 2, 3].map((n) => (
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
                aria-label="2025: 105 selesai dan 11 aktif. 2026: 71 selesai dan 94 aktif."
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
                  <span style={{ position: "absolute", right: 0, top: 0, transform: "translateY(-50%)" }}>180</span>
                  <span style={{ position: "absolute", right: 0, top: "25%", transform: "translateY(-50%)" }}>135</span>
                  <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>90</span>
                  <span style={{ position: "absolute", right: 0, top: "75%", transform: "translateY(-50%)" }}>45</span>
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

                  {/* 2025 Column: 116 (Active 11, Selesai 105) */}
                  <button
                    type="button"
                    className="hv"
                    aria-label="Tahun 2025, 116 proyek"
                    style={{
                      position: "absolute",
                      left: "17%",
                      width: "26%",
                      bottom: 0,
                      height: "64.44%",
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
                      116
                    </span>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: "9.48%",
                        background: "var(--chart-amber)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      11
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "90.52%",
                        background: "var(--chart-green)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      105
                    </div>
                    <span
                      className="tip tipcard"
                      style={{ left: -64, top: 34 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun 2025</span>
                        <span className="dd-pill dd-pill--blue">116 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Project volume</span>
                        <span>116 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Selesai</span>
                        <span style={{ color: "var(--status-green-fg)" }}>105 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Aktif</span>
                        <span style={{ color: "var(--status-amber-fg)" }}>11 proyek</span>
                      </span>
                    </span>
                  </button>

                  {/* 2026 Column: 165 (Active 94, Selesai 71) */}
                  <button
                    type="button"
                    className="hv"
                    aria-label="Tahun 2026, 165 proyek"
                    style={{
                      position: "absolute",
                      left: "57%",
                      width: "26%",
                      bottom: 0,
                      height: "91.67%",
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
                      165
                    </span>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: "56.97%",
                        background: "var(--chart-amber)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      94
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "43.03%",
                        background: "var(--chart-green)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-on-accent)",
                        font: "var(--text-cell-num)",
                      }}
                    >
                      71
                    </div>
                    <span
                      className="tip tipcard"
                      style={{ right: -28, top: 34 }}
                    >
                      <span className="tipcard__h">
                        <span>Tahun 2026</span>
                        <span className="dd-pill dd-pill--blue">165 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Project volume</span>
                        <span>165 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Selesai</span>
                        <span style={{ color: "var(--status-green-fg)" }}>71 proyek</span>
                      </span>
                      <span className="tipcard__r">
                        <span>Aktif</span>
                        <span style={{ color: "var(--status-amber-fg)" }}>94 proyek</span>
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
