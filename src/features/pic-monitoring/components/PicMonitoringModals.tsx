"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { SanitizedProject } from "../types/types";

export type ModalType =
  | "needs"
  | "inprog"
  | "group"
  | "registry"
  | "stage"
  | "project"
  | "delay"
  | "kpi"
  | null;

export interface ModalPayload {
  type: ModalType;
  title?: string;
  subtitle?: string;
  // Stage modal
  stageIdx?: number;
  stageName?: string;
  stageData?: {
    name: string;
    pct: string;
    data: number;
    ok: number;
    miss: number;
    achievedProjects?: SanitizedProject[];
    missedProjects?: SanitizedProject[];
  };
  // Group modal
  groupName?: string;
  groupCount?: number;
  groupProjects?: SanitizedProject[];
  groupStatus?: [string, "blue" | "green" | "amber" | "red" | "gray"];
  // Delay modal
  delayItem?: {
    name: string;
    tk: string;
    cause: string;
    total: number;
    gates: string[];
    description?: string;
    ratio?: string;
    gateP?: { n: string; days: string; w: string }[];
    causeList?: { c: string; cls: string }[];
  };
  // KPI modal
  kpiKey?: string;
  kpiData?: {
    num: string | number;
    of: string;
    pct?: string;
    pctCls?: string;
    hasPct?: boolean;
    sub?: string;
    note: string;
    rows?: {
      name: string;
      val: string;
      w: string;
      color: string;
      ink?: string;
      cur?: string;
      onClick?: () => void;
    }[];
    goLabel?: string;
    onGo?: () => void;
    projects?: SanitizedProject[];
  };
  // Project detail modal
  project?: SanitizedProject | null;
  // Needs attention projects
  needsProjects?: SanitizedProject[];
  // Active / in-progress projects
  inprogProjects?: SanitizedProject[];
  // Registry projects
  registryProjects?: SanitizedProject[];
}

interface PicMonitoringModalsProps {
  modal: ModalPayload | null;
  onClose: () => void;
  onSelectProject?: (project: SanitizedProject) => void;
}


const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function getTone(status: unknown): "blue" | "green" | "amber" | "red" | "gray" {
  const s = String(status ?? "").toLowerCase();
  if (s.includes("hold")) return "gray";
  if (s.includes("cancel")) return "red";
  if (s === "live on queue" || s === "on queue" || s.startsWith("queue")) return "amber";
  if (s.includes("live") || s.includes("monitoring")) return "green";
  if (s.includes("queue") || s.includes("pending")) return "amber";
  return "blue";
}

export function PicMonitoringModals({
  modal,
  onClose,
  onSelectProject,
}: PicMonitoringModalsProps) {
  const mounted = useIsMounted();
  const [ipTab, setIpTab] = useState<string>("Semua");
  const [copied, setCopied] = useState(false);
  const [prevModal, setPrevModal] = useState(modal);

  const getInitialVisible = (m: ModalPayload | null) => {
    const cnt = m?.groupCount || (m?.groupProjects?.length ?? 0);
    if (cnt > 0 && cnt <= 200) return cnt;
    return 100;
  };

  const [visibleGroupCount, setVisibleGroupCount] = useState(() => getInitialVisible(modal));

  if (modal !== prevModal) {
    setPrevModal(modal);
    setVisibleGroupCount(getInitialVisible(modal));
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (modal) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [modal, onClose]);

  if (!mounted || !modal || !modal.type) return null;

  const { type, title, subtitle, project } = modal;

  // In-progress tab definitions matching prototype
  const inprogTabs = [
    { id: "Semua", label: "Semua 51" },
    { id: "FSD", label: "FSD 8" },
    { id: "DEV", label: "DEV 25" },
    { id: "SIT", label: "SIT 7" },
    { id: "CR", label: "CR 11" },
  ];

  // Sample POOL and generator matching prototype
  const POOL: [string, string, string][] = [
    ["26090065", "Penyesuaian Validasi Portal Vendor", "Andi"],
    ["26090026", "Approval Digital Pengajuan Sistem Klaim Asuransi", "Andi"],
    ["26090011", "Penyesuaian Validasi SOMA Monitoring", "Gilang"],
    ["26090045", "Enhance Menu Report Custom ATM", "Farah"],
    ["26070016", "Approval Digital Pengajuan Saldo Bank", "Candra"],
    ["26080041", "Tambah Filter Pencarian Inventory Kendaraan", "Andi"],
    ["26080025", "Perbaikan Flow Approval Ticketing Helpdesk", "Bella"],
    ["26070014", "Migrasi Audit Trail Transaksi ke Platform Baru", "Bella"],
    ["26080068", "Perubahan Tampilan Inventory Kendaraan", "Hana"],
    ["26070011", "Perubahan Tampilan Approval PMA", "Bella"],
    ["26100002", "Tambah Filter Pencarian CPM Receive Version", "Dina"],
    ["26100034", "Approval Digital Pengajuan Inventory Kendaraan", "Candra"],
    ["26100017", "Approval Digital Pengajuan Rekonsiliasi Cash Pickup", "Gilang"],
    ["26100024", "Penyesuaian Validasi Jadwal Kunjungan Fase B", "Gilang"],
    ["26090056", "Pengembangan Saldo Bank Phase 1", "Hana"],
    ["26090044", "Redesign Alur Slip Gaji Digital", "Andi"],
  ];

  const mk = (
    n: number,
    stat: (i: number) => [string, "blue" | "green" | "amber" | "red" | "gray"],
    tail?: (i: number) => string,
  ) =>
    Array.from({ length: n }, (_, i) => {
      const q = POOL[i % POOL.length];
      const st = stat(i);
      return {
        no: i + 1,
        name: q[1],
        sub: `${q[0]} · ${q[2]}`,
        status: st[0],
        tone: st[1],
        tail: tail ? tail(i) : "",
      };
    });

  const mixed: [string, "blue"][] = [
    ["FSD On Progress", "blue"],
    ["Dev On Progress", "blue"],
    ["SIT On Progress", "blue"],
    ["Change Request On Progress", "blue"],
  ];

  const cntMap: Record<string, number> = { Semua: 51, FSD: 8, DEV: 25, SIT: 7, CR: 11 };
  const oneMap: Record<string, [string, "blue"]> = {
    FSD: mixed[0],
    DEV: mixed[1],
    SIT: mixed[2],
    CR: mixed[3],
  };

  const inprogCount = cntMap[ipTab] || 51;
  const oneStatus = oneMap[ipTab];
  const inprogRows = mk(inprogCount, (i) => oneStatus || mixed[i % 4]);

  const gCountMap: Record<string, number> = {
    Monitoring: 17,
    Queue: 16,
    UAT: 7,
    Hold: 3,
  };

  const groupName = modal.groupName || modal.title || "Live";
  const groupTone = modal.groupStatus?.[1] || getTone(groupName);
  const statusLabel = modal.groupStatus?.[0] || groupName;
  const targetCount =
    modal.groupCount ||
    (modal.groupProjects && modal.groupProjects.length > 0 ? modal.groupProjects.length : 0) ||
    gCountMap[groupName] ||
    (groupName.toLowerCase().includes("live") ? 189 : 16);

  interface GroupRowItem {
    no: number;
    name: string;
    sub: string;
    status: string;
    tone: "blue" | "green" | "amber" | "red" | "gray";
    raw?: SanitizedProject;
  }

  const groupRows: GroupRowItem[] = (() => {
    const realProjs = modal.groupProjects || [];
    const rows: GroupRowItem[] = [];

    for (let i = 0; i < targetCount; i++) {
      if (i < realProjs.length) {
        const p = realProjs[i];
        const st = modal.groupStatus ? modal.groupStatus[0] : String(p["Last Status"] || statusLabel);
        const tn = modal.groupStatus ? modal.groupStatus[1] : getTone(st);
        rows.push({
          no: i + 1,
          name: String(p["Project Name"] || "Proyek"),
          sub: `${p.Ticket || "26090000"} · ${p["PIC Name"] || p.PIC || p["Owner Name"] || "Andi"}`,
          status: st,
          tone: tn,
          raw: p,
        });
      } else {
        const q = POOL[i % POOL.length];
        const st = modal.groupStatus ? modal.groupStatus[0] : statusLabel;
        const tn = modal.groupStatus ? modal.groupStatus[1] : groupTone;
        rows.push({
          no: i + 1,
          name: q[1],
          sub: `${q[0]} · ${q[2]}`,
          status: st,
          tone: tn,
          raw: undefined,
        });
      }
    }
    return rows;
  })();

  // Stage failures generator matching prototype exactly
  const stSet: [string, "blue" | "green" | "amber" | "red" | "gray"][] = [
    ["Dev On Queue", "amber"],
    ["Dev On Progress", "blue"],
    ["SIT On Progress", "blue"],
    ["UAT On Progress", "blue"],
    ["Live On Monitoring", "green"],
  ];
  const stageReasons = [
    "Requirement Berubah",
    "Resource Terbatas",
    "Environment Belum Siap",
    "Kendala Teknis",
  ];

  const stageIdx = modal.stageIdx ?? 0;
  const stageMiss = modal.stageData?.miss ?? 31;
  const stageTotal = modal.stageData?.data ?? 157;
  const stageOk = modal.stageData?.ok ?? 126;
  const stageRawPct = modal.stageData?.pct ?? "80%";
  const stagePctNum = Math.min(100, Math.max(0, parseInt(String(stageRawPct).replace(/\D/g, "")) || 0));
  const stagePctStr = `${stagePctNum}%`;
  const isStageTargetMet = stagePctNum >= 93;

  const stageFailures = mk(stageMiss, (i) => stSet[(i + stageIdx) % 5], (i) => stageReasons[i % 4]);

  const modalNode = (
    <div
      className="pic-monitoring-scope"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: "auto",
      }}
    >
      <div
        className="dd-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "rgba(17, 24, 39, 0.45)",
          backdropFilter: "blur(2px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
        onClick={onClose}
      >
        <div
          className="dd-modal dd-modal--lg"
          role="dialog"
          aria-modal="true"
          style={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 100000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="dd-modal__head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="dd-modal__title">{title || "Detail"}</h2>
              {subtitle && <p className="dd-card__subtitle">{subtitle}</p>}
            </div>
            <button
              className="dd-iconbtn dd-iconbtn--ghost"
              type="button"
              aria-label="Tutup"
              onClick={onClose}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body: Needs Attention */}
          {type === "needs" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  padding: "16px 22px 4px",
                }}
              >
                <span
                  className="dd-num"
                  style={{
                    font: "var(--text-hero)",
                    letterSpacing: "var(--ls-display)",
                    color: "var(--status-red-fg)",
                  }}
                >
                  {modal.needsProjects?.length ?? 18}
                </span>
                <span className="kof" style={{ fontSize: 26 }}>
                  / 94
                </span>
                <span
                  className="kpct kpct--red"
                  style={{ height: 28, fontSize: "var(--fs-body)" }}
                >
                  {Math.round(((modal.needsProjects?.length ?? 18) / 94) * 100)}%
                </span>
                <span
                  style={{
                    font: "var(--text-label)",
                    color: "var(--text-muted)",
                    marginLeft: 4,
                  }}
                >
                  proyek telat dari 94 proyek aktif
                </span>
              </div>
              <div className="dd-modal__body" style={{ paddingTop: 6 }}>
                <div className="dd-table__secondary" style={{ padding: "4px 0 8px" }}>
                  Klik baris proyek untuk melihat detail lengkap
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(modal.needsProjects ?? []).slice(0, 15).map((p, idx) => {
                    const tone = getTone(p["Last Status"]);
                    const lateDays = Math.max(
                      Number(p["(UAT) Late in Days"] || 0),
                      Number(p["(Dev) Late in Days"] || 0),
                      Number(p["(FSD) Late in Days"] || 0),
                    );
                    return (
                      <div
                        key={p.notion_page_id || `${p.Ticket || "proj"}-${idx}`}
                        onClick={() => onSelectProject?.(p)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "11px 0",
                          borderBottom: "1px solid var(--border-subtle)",
                          cursor: "pointer",
                        }}
                      >
                        <span className="dd-rbar__rank" style={{ width: 22, height: 22 }}>
                          {idx + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="dd-table__primary">{p["Project Name"]}</div>
                          <div className="dd-table__secondary">
                            {p.Ticket} · {p["Type Project"]} · {p["Owner Div"] || p["Owner Division"] || p["Owner Name"]}
                          </div>
                        </div>
                        <span className="dd-chip dd-chip--red">
                          {lateDays > 0 ? `+${lateDays} hari` : "Terlambat"}
                        </span>
                        <span className={`dd-pill dd-pill--${tone}`}>
                          <span className="dd-pill__dot" />
                          {p["Last Status"]}
                        </span>
                        <span className="dd-table__chev">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Modal Body: In Progress */}
          {type === "inprog" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ padding: "14px 22px 0" }}>
                <div className="dd-seg" role="tablist">
                  {inprogTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`dd-seg__btn ${ipTab === tab.id ? "dd-seg__btn--active" : ""}`}
                      onClick={() => setIpTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="dd-modal__body" style={{ paddingTop: 6 }}>
                <div className="dd-table__secondary" style={{ padding: "4px 0 8px" }}>
                  Daftar contoh: nama dan tiket diputar dari sampel proyek; jumlah baris mengikuti dashboard.
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {inprogRows.map((p) => (
                    <div
                      key={p.no}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span className="dd-rbar__rank" style={{ width: 22, height: 22 }}>
                        {p.no}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="dd-table__primary">{p.name}</div>
                        <div className="dd-table__secondary">{p.sub}</div>
                      </div>
                      <span className={`dd-pill dd-pill--${p.tone}`}>
                        <span className="dd-pill__dot" />
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal Body: Active Group / Status */}
          {type === "group" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div className="dd-modal__body" style={{ paddingTop: 6 }}>
                <div className="dd-table__secondary" style={{ padding: "4px 0 8px" }}>
                  Daftar contoh: nama dan tiket diputar dari sampel proyek; jumlah baris mengikuti dashboard.
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {groupRows.slice(0, visibleGroupCount).map((p) => (
                    <div
                      key={p.no}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span className="dd-rbar__rank" style={{ width: 22, height: 22 }}>
                        {p.no}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="dd-table__primary">{p.name}</div>
                        <div className="dd-table__secondary">{p.sub}</div>
                      </div>
                      <span className={`dd-pill dd-pill--${p.tone}`}>
                        <span className="dd-pill__dot" />
                        {p.status}
                      </span>
                    </div>
                  ))}
                  {groupRows.length > visibleGroupCount && (
                    <button
                      type="button"
                      onClick={() => setVisibleGroupCount((c) => Math.min(c + 50, groupRows.length))}
                      style={{
                        margin: "12px 0 6px",
                        padding: "9px 16px",
                        borderRadius: "var(--radius-input)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-hover)",
                        font: "var(--fw-semibold) var(--fs-caption)/1 var(--dd-font-sans)",
                        color: "var(--dd-accent)",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "background var(--dur-fast)",
                      }}
                    >
                      Muat 50 lagi (menampilkan {visibleGroupCount} dari {groupRows.length} proyek)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Body: Stage SLA (Pict 3 & Pict 2) */}
          {type === "stage" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div
                style={{
                  padding: "16px 22px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div className="dd-panel dd-panel--sunken">
                  <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Achieved</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    <span
                      style={{
                        font: "var(--text-stat)",
                        color: isStageTargetMet ? "var(--status-green-fg)" : "var(--status-red-fg)",
                      }}
                    >
                      {stageOk}
                    </span>
                    <span className="kof">/{stageTotal}</span>
                    <span className={`kpct ${isStageTargetMet ? "kpct--green" : "kpct--red"}`}>
                      {stagePctStr}
                    </span>
                  </div>
                </div>
                <div className="dd-panel dd-panel--sunken">
                  <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Evaluated</div>
                  <div style={{ font: "var(--text-stat)", marginTop: 6 }}>
                    {stageTotal}
                  </div>
                </div>
                <div className="dd-panel dd-panel--sunken">
                  <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Not achieved</div>
                  <div style={{ font: "var(--text-stat)", color: "var(--status-red-fg)", marginTop: 6 }}>
                    {stageMiss}
                  </div>
                </div>
              </div>

              <div className="dd-modal__body" style={{ paddingTop: 6 }}>
                <div className="dd-table__secondary" style={{ padding: "4px 0 8px" }}>
                  Daftar contoh: nama dan tiket diputar dari sampel proyek; jumlah baris mengikuti dashboard.
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {stageFailures.map((p, idx) => (
                    <div
                      key={`${p.no}-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span className="dd-rbar__rank" style={{ width: 22, height: 22 }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="dd-table__primary">{p.name}</div>
                        <div className="dd-table__secondary">
                          {p.sub}
                        </div>
                      </div>
                      <span className={`dd-pill dd-pill--${p.tone}`}>
                        <span className="dd-pill__dot" />
                        {p.status}
                      </span>
                      <span
                        style={{
                          width: 170,
                          font: "var(--text-label)",
                          color: "var(--status-red-fg)",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.tail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal Body: Project Detail (Pict 5: exact match to prototype) */}
          {type === "project" && project && (() => {
            const tk = String(project.Ticket || "26099997");
            const typeName = String(project["Type Project"] || "Project Utama");
            const divName = String(project["Owner Div"] || project["Owner Division"] || "Cabang Jakarta");
            const ownerName = String(project["Owner Name"] || "Budi Santoso");
            const picName = String(project["PIC Name"] || project["PIC Project"] || project.PIC || "Eka Saputra");
            const statusStr = String(project["Last Status"] || "Dev Pending Estimation");
            const tone = getTone(statusStr);

            const lateVal = Number(
              project["(FSD) Late Days"] ||
              project["(DEV) Late Days"] ||
              project["(SIT) Late Days"] ||
              project["(UAT) Late Days"] ||
              0
            );
            const isLate = lateVal > 0;

            // Milestone stage mapping: 0=FSD, 1=DEV, 2=SIT, 3=UAT, 4=Live
            const stN = ["FSD", "DEV", "SIT", "UAT", "Live"];
            const cur = /^FSD/i.test(statusStr)
              ? 0
              : /^Dev/i.test(statusStr)
              ? 1
              : /^SIT/i.test(statusStr)
              ? 2
              : /^UAT/i.test(statusStr)
              ? 3
              : /^Live/i.test(statusStr)
              ? 4
              : -1;

            const paused = /Queue|Pending/i.test(statusStr);

            const steps = stN.map((n, i) => {
              let bg = "var(--bg-card)";
              let fg = "var(--text-placeholder)";
              let bd = "1.5px solid var(--border-default)";
              let cap = "Menunggu";
              let capClr = "var(--text-placeholder)";
              let glyph = String(i + 1);
              let ring = "";

              if (cur > -1 && i < cur) {
                bg = "var(--chart-green)";
                fg = "var(--text-on-accent)";
                bd = "0";
                cap = "Selesai";
                capClr = "var(--status-green-fg)";
                glyph = "✓";
              } else if (i === cur) {
                const c = isLate
                  ? "var(--chart-red)"
                  : paused
                  ? "var(--chart-amber)"
                  : "var(--chart-blue-primary)";
                bg = c;
                fg = "var(--text-on-accent)";
                bd = "0";
                cap = isLate ? "Terlambat" : paused ? "Antre" : "Berjalan";
                capClr = isLate
                  ? "var(--status-red-fg)"
                  : paused
                  ? "var(--status-amber-fg)"
                  : "var(--accent)";
                ring = "0 0 0 4px var(--accent-tint)";
              }

              // Connected line: green if stage <= current progress, else gray track
              const hasGreenLine = cur > -1 && i <= cur;
              const lineBg = hasGreenLine ? "var(--chart-green)" : "var(--chart-gray-track)";

              return {
                n,
                cap,
                capClr,
                glyph,
                bg,
                fg,
                bd,
                ring,
                lineBg,
              };
            });

            const alertBg = isLate ? "var(--status-red-bg)" : "var(--bg-row-item)";
            const alertBd = isLate ? "var(--status-red-fg)" : "var(--border-subtle)";
            const alertIc = isLate ? "var(--chart-red)" : paused ? "var(--chart-amber)" : "var(--chart-green)";
            const alertFg = isLate ? "var(--status-red-fg)" : "var(--text-primary)";
            const alertTitle = isLate ? `Terlambat ${lateVal} hari` : paused ? "Menunggu antrean" : "Tidak ada keterlambatan";
            const alertMsg = isLate ? `Melewati SLA di tahap ${stN[Math.max(cur, 0)]}` : paused ? "Belum masuk pengerjaan aktif" : "Semua tahap berjalan sesuai SLA";
            const alertPath = isLate ? "M12 9v4M12 17h.01" : paused ? "M12 6v6l4 2" : "m5 12 5 5 9-10";

            const getIni = (s: string) =>
              String(s || "")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() || "")
                .join("");

            const picIni = getIni(picName) || "PIC";
            const ownerIni = getIni(ownerName) || "OW";
            const createdVal = String(project.Created || project["Created Date"] || project["Tanggal Dibuat"] || "");
            const intakeYear = String(project.Year || project._year || project["SLA Year"] || "2026");

            return (
              <div className="dd-modal__body" style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 16 }}>
                {/* Status & Tags Row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className={`dd-pill dd-pill--${tone}`} style={{ fontSize: "var(--fs-body)" }}>
                    <span className="dd-pill__dot" />
                    {statusStr}
                  </span>
                  <span className="dd-chip dd-chip--entity">{typeName}</span>
                  <span className="dd-chip">{tk}</span>
                </div>

                {/* Status Alert Banner */}
                <div
                  className="dd-panel"
                  style={{
                    background: alertBg,
                    borderColor: alertBd,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: "var(--radius-panel)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: alertIc,
                      color: "var(--text-on-accent)",
                      flex: "none",
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d={alertPath} />
                    </svg>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "var(--text-cell)", color: alertFg }}>{alertTitle}</div>
                    <div className="dd-table__secondary">{alertMsg}</div>
                  </div>
                </div>

                {/* Progres Milestone Stepper (Pict 5) */}
                <div>
                  <div className="dd-eyebrow" style={{ marginBottom: 14 }}>Progres milestone</div>
                  <div style={{ display: "flex", position: "relative" }}>
                    {steps.map((st, i) => (
                      <div
                        key={st.n}
                        style={{
                          flex: 1,
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                        }}
                      >
                        {/* Connecting line to previous */}
                        {i > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: 13,
                              right: "50%",
                              width: "100%",
                              height: 2,
                              background: st.lineBg,
                              zIndex: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            font: "var(--text-cell-num)",
                            position: "relative",
                            zIndex: 1,
                            background: st.bg,
                            color: st.fg,
                            border: st.bd,
                            boxShadow: st.ring || undefined,
                          }}
                        >
                          {st.glyph}
                        </span>
                        <div style={{ font: "var(--text-cell)" }}>{st.n}</div>
                        <div style={{ font: "var(--text-label)", color: st.capClr }}>{st.cap}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detail Proyek Grid (Pict 5) */}
                <div>
                  <div className="dd-eyebrow" style={{ marginBottom: 10 }}>Detail proyek</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    <div className="dd-panel dd-panel--sunken" style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
                      <span
                        className="dd-avatar dd-avatar--md"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: "var(--accent-tint)",
                          color: "var(--accent)",
                          fontWeight: "bold",
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {picIni}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>PIC</div>
                        <div className="dd-table__primary" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{picName}</div>
                      </div>
                    </div>
                    <div className="dd-panel dd-panel--sunken" style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
                      <span
                        className="dd-avatar dd-avatar--md"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: "var(--status-gray-bg)",
                          color: "var(--status-gray-fg)",
                          fontWeight: "bold",
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {ownerIni}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Owner</div>
                        <div className="dd-table__primary" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownerName}</div>
                      </div>
                    </div>
                    <div className="dd-panel dd-panel--sunken" style={{ padding: 12 }}>
                      <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Division</div>
                      <div className="dd-table__primary" style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{divName}</div>
                    </div>
                    <div className="dd-panel dd-panel--sunken" style={{ padding: 12 }}>
                      <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Project type</div>
                      <div className="dd-table__primary" style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{typeName}</div>
                    </div>
                    <div className="dd-panel dd-panel--sunken" style={{ padding: 12 }}>
                      <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Tanggal dibuat</div>
                      <div className="dd-table__primary" style={{ marginTop: 4, color: createdVal ? "var(--text-primary)" : "var(--text-placeholder)" }}>{createdVal || "Belum diisi"}</div>
                    </div>
                    <div className="dd-panel dd-panel--sunken" style={{ padding: 12 }}>
                      <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Intake year</div>
                      <div className="dd-table__primary" style={{ marginTop: 4 }}>{intakeYear}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Modal Body: Delay Root Cause Detail */}
          {type === "delay" && modal.delayItem && (() => {
            const d = modal.delayItem;
            const gateP = d.gateP || d.gates.map((g) => {
              const m = g.match(/^(\S+)\s+(\d+)/);
              const dn = m ? parseInt(m[2], 10) : 0;
              return {
                n: m ? m[1] : g,
                days: `${dn} hari`,
                w: `${Math.min(100, (dn / (d.total || 1)) * 100).toFixed(1)}%`,
              };
            });
            const ratio = d.ratio || `${(d.total / 17).toFixed(1).replace(".", ",")}×`;
            const causeList = d.causeList || d.cause.split(", ").map((c) => ({
              c,
              cls: c === "Belum diisi" ? "dd-chip dd-chip--gray" : "dd-chip dd-chip--red",
            }));

            return (
              <div className="dd-modal__body" style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                  <div className="dd-panel dd-panel--sunken" style={{ padding: 14 }}>
                    <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Total delay</div>
                    <div style={{ font: "var(--text-stat)", color: "var(--status-red-fg)", marginTop: 6 }}>
                      {d.total} hari
                    </div>
                  </div>
                  <div className="dd-panel dd-panel--sunken" style={{ padding: 14 }}>
                    <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Vs rata-rata 17 hari</div>
                    <div style={{ font: "var(--text-stat)", marginTop: 6 }}>
                      {ratio}
                    </div>
                  </div>
                  <div className="dd-panel dd-panel--sunken" style={{ padding: 14 }}>
                    <div style={{ font: "var(--text-label)", color: "var(--text-muted)" }}>Gerbang terlambat</div>
                    <div style={{ font: "var(--text-stat)", marginTop: 6 }}>
                      {d.gates.length}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="dd-eyebrow" style={{ marginBottom: 10 }}>Rincian per gerbang</div>
                  {gateP.map((g, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "64px minmax(0, 1fr) 80px",
                        gap: 14,
                        alignItems: "center",
                        padding: "11px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span className="dd-table__primary">{g.n}</span>
                      <div className="dd-rbar__track">
                        <div
                          className="dd-rbar__fill"
                          style={{ width: g.w, background: "var(--chart-red)" }}
                        />
                      </div>
                      <span style={{ font: "var(--text-cell-num)", textAlign: "right", color: "var(--status-red-fg)" }}>
                        {g.days}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="dd-eyebrow" style={{ marginBottom: 10 }}>Penyebab keterlambatan</div>
                  <div className="dd-chip-group">
                    {causeList.map((c, idx) => (
                      <span key={idx} className={c.cls}>
                        {c.c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="dd-table__secondary" style={{ whiteSpace: "normal" }}>
                  Data contoh dari tabel delay tracker. Rincian per bulan dan catatan PIC belum tersedia di prototipe.
                </div>
              </div>
            );
          })()}

          {/* Modal Body: General KPI (Total projects, Completed, Active) */}
          {type === "kpi" && modal.kpiData && (
            <div className="dd-modal__body" style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span className="dd-num" style={{ font: "var(--text-hero)", letterSpacing: "var(--ls-display)" }}>
                  {modal.kpiData.num}
                </span>
                <span className="kof" style={{ fontSize: 26 }}>
                  {modal.kpiData.of}
                </span>
                {modal.kpiData.hasPct && (
                  <span className={`kpct ${modal.kpiData.pctCls || ""}`} style={{ height: 28, fontSize: "var(--fs-body)" }}>
                    {modal.kpiData.pct}
                  </span>
                )}
                {modal.kpiData.sub && (
                  <span style={{ font: "var(--text-label)", color: "var(--text-muted)", marginLeft: 4 }}>
                    {modal.kpiData.sub}
                  </span>
                )}
              </div>

              <div className="dd-table__secondary" style={{ margin: 0, whiteSpace: "normal" }}>
                {modal.kpiData.note}
              </div>

              {/* Progress bars rows */}
              {modal.kpiData.rows && modal.kpiData.rows.length > 0 && (
                <div>
                  {modal.kpiData.rows.map((r, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={r.onClick}
                      disabled={!r.onClick}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr) 128px",
                        gap: 14,
                        alignItems: "center",
                        width: "100%",
                        padding: "11px 4px",
                        borderRadius: "var(--radius-input)",
                        border: 0,
                        borderBottom: "1px solid var(--border-subtle)",
                        background: "transparent",
                        fontFamily: "inherit",
                        textAlign: "left",
                        cursor: r.onClick ? "pointer" : "default",
                        transition: "background var(--dur-fast)",
                      }}
                      onMouseEnter={(e) => {
                        if (r.onClick) {
                          e.currentTarget.style.background = "var(--bg-hover)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (r.onClick) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span className="dd-table__primary">{r.name}</span>
                      <div className="dd-rbar__track">
                        <div
                          className="dd-rbar__fill"
                          style={{ width: r.w, background: r.color }}
                        />
                      </div>
                      <span
                        style={{
                          font: "var(--text-cell-num)",
                          textAlign: "right",
                          color: r.ink || "var(--text-primary)",
                        }}
                      >
                        {r.val}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Navigation button if available */}
              {modal.kpiData.goLabel && (
                <div>
                  <button
                    className="dd-btn dd-btn--secondary dd-btn--md"
                    type="button"
                    onClick={modal.kpiData.onGo}
                  >
                    {modal.kpiData.goLabel} →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer with 'Salin tiket' and 'Tutup' buttons (Pict 5) */}
          <div
            className="dd-modal__foot"
            style={{
              display: "flex",
              justifyContent: type === "project" ? "space-between" : "flex-end",
              alignItems: "center",
            }}
          >
            {type === "project" && (
              <button
                className="dd-btn dd-btn--secondary dd-btn--md"
                type="button"
                onClick={() => {
                  const tk = project?.Ticket || "26099997";
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(tk);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
              >
                {copied ? "Tiket disalin!" : "Salin tiket"}
              </button>
            )}
            <button
              className="dd-btn dd-btn--primary dd-btn--md"
              type="button"
              onClick={onClose}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

export default PicMonitoringModals;
