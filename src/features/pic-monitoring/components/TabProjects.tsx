"use client";

import React, { useState, useMemo } from "react";
import type { SanitizedProject } from "../types/types";
import { PicMonitoringModals, type ModalPayload } from "./PicMonitoringModals";

interface TabProjectsProps {
  projects: SanitizedProject[];
  selectedYear: number;
}

function getTone(status: unknown): "blue" | "green" | "amber" | "red" | "gray" {
  const s = String(status ?? "").toLowerCase();
  if (s.includes("hold")) return "gray";
  if (s.includes("cancel")) return "red";
  if (s.includes("live") || s.includes("monitoring")) return "green";
  if (s.includes("queue") || s.includes("pending")) return "amber";
  return "blue";
}

// Prototype SVGs
const IC = {
  cal: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  layers: "m12 2 10 5-10 5L2 7zM2 12l10 5 10-5",
  org: "M3 21h18M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M14 11h3a1 1 0 0 1 1 1v9M9 8h2M9 12h2M9 16h2",
  route: "M6 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM18 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8.5 6H14a4 4 0 0 1 4 4v5.5",
  clock: "M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
};

export function TabProjects({ projects = [] }: TabProjectsProps) {
  const [activeModal, setActiveModal] = useState<ModalPayload | null>(null);

  // Filters & Search
  const [q, setQ] = useState("");
  const [pYear, setPYear] = useState("Semua");
  const [pType, setPType] = useState("Semua");
  const [pDiv, setPDiv] = useState("Semua");
  const [pPipe, setPPipe] = useState("Semua");
  const [pDelay, setPDelay] = useState("Semua");
  const [pSize, setPSize] = useState(25);
  const [pPage, setPPage] = useState(1);

  // Active open dropdown tracker
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Distinct Filter Options
  const divisions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      const d = p["Owner Div"] || p["Owner Division"];
      if (d && String(d).trim()) set.add(String(d).trim());
    });
    return Array.from(set).sort();
  }, [projects]);

  const projectTypes = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      const t = p["Type Project"];
      if (t && String(t).trim()) set.add(String(t).trim());
    });
    return Array.from(set).sort();
  }, [projects]);

  const years = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      const y = p.Year || p._year;
      if (y) set.add(String(y));
    });
    return Array.from(set).sort().reverse();
  }, [projects]);

  // Fallback demo projects if empty
  const projectList = useMemo(() => {
    if (projects.length > 0) return projects;
    // Mock sample items matching prototype
    const demo: SanitizedProject[] = [
      {
        Ticket: "26100002",
        "Project Name": "Tambah Filter Pencarian CPM Receive Version",
        "Type Project": "Enhance Kecil",
        "Owner Name": "Ayu Anggraini",
        "Owner Div": "Operasional Cash Pickup",
        "PIC Name": "Dina Maharani",
        "Last Status": "FSD On Progress",
        _year: "2026",
        "FSD SLA": "Achieved",
      } as unknown as SanitizedProject,
      {
        Ticket: "26100034",
        "Project Name": "Approval Digital Pengajuan Inventory Kendaraan",
        "Type Project": "Approval Digital",
        "Owner Name": "Budi Santoso",
        "Owner Div": "Cabang Jakarta",
        "PIC Name": "Candra Wijaya",
        "Last Status": "FSD On Progress",
        _year: "2026",
      } as unknown as SanitizedProject,
      {
        Ticket: "26100007",
        "Project Name": "Penambahan Kolom Laporan Saldo Bank",
        "Type Project": "Enhance Kecil",
        "Owner Name": "Agus Wibowo",
        "Owner Div": "Sales & Marketing",
        "PIC Name": "Farah Nabila",
        "Last Status": "On Queue",
        _year: "2026",
      } as unknown as SanitizedProject,
      {
        Ticket: "26100030",
        "Project Name": "Setting Report Custom Menu Tagihan Cabang",
        "Type Project": "Enhance Kecil",
        "Owner Name": "Ayu Anggraini",
        "Owner Div": "Operasional Cash Pickup",
        "PIC Name": "Eka Saputra",
        "Last Status": "Dev On Progress",
        _year: "2026",
        "DEV SLA": "Achieved",
      } as unknown as SanitizedProject,
      {
        Ticket: "26100019",
        "Project Name": "Pengembangan E-HR Attendance Phase 1",
        "Type Project": "Project Utama",
        "Owner Name": "Budi Santoso",
        "Owner Div": "Cabang Jakarta",
        "PIC Name": "Eka Saputra",
        "Last Status": "Dev Pending Estimation",
        _year: "2026",
        "DEV SLA": "Achieved",
      } as unknown as SanitizedProject,
      {
        Ticket: "26100024",
        "Project Name": "Penyesuaian Validasi Jadwal Kunjungan Fase B",
        "Type Project": "Enhance Kecil",
        "Owner Name": "Rina Marlina",
        "Owner Div": "Sales & Marketing",
        "PIC Name": "Gilang Ramadhan",
        "Last Status": "FSD On Progress",
        _year: "2026",
      } as unknown as SanitizedProject,
      {
        Ticket: "26100017",
        "Project Name": "Approval Digital Pengajuan Rekonsiliasi Cash Pickup",
        "Type Project": "Approval Digital",
        "Owner Name": "Agus Wibowo",
        "Owner Div": "Logistik & Armada",
        "PIC Name": "Gilang Ramadhan",
        "Last Status": "FSD On Progress",
        _year: "2026",
        "(FSD) Late Days": 9,
      } as unknown as SanitizedProject,
      {
        Ticket: "26090037",
        "Project Name": "Migrasi CPM Receive Version ke Platform Baru",
        "Type Project": "Project Utama",
        "Owner Name": "Yoga Permana",
        "Owner Div": "Operasional Cash Pickup",
        "PIC Name": "Gilang Ramadhan",
        "Last Status": "Dev On Queue",
        _year: "2026",
      } as unknown as SanitizedProject,
      {
        Ticket: "26090015",
        "Project Name": "Approval Digital Perubahan Data Portal Vendor",
        "Type Project": "Approval Digital",
        "Owner Name": "Maya Puspita",
        "Owner Div": "Logistik & Armada",
        "PIC Name": "Gilang Ramadhan",
        "Last Status": "Dev On Progress",
        _year: "2026",
        "DEV SLA": "Achieved",
      } as unknown as SanitizedProject,
      {
        Ticket: "26090069",
        "Project Name": "Enhancement Report Custom ATM Phase 2",
        "Type Project": "Enhance Kecil",
        "Owner Name": "Ayu Anggraini",
        "Owner Div": "Operasional Cash Pickup",
        "PIC Name": "Candra Wijaya",
        "Last Status": "On Queue",
        _year: "2026",
      } as unknown as SanitizedProject,
    ];
    // Extend demo to 294 items matching prototype (294 total, 117 Queue)
    return Array.from({ length: 294 }, (_, i) => {
      const b = demo[i % demo.length];
      return i < demo.length
        ? b
        : ({
            ...b,
            Ticket: String(Number(b.Ticket) - Math.floor(i / 10) * 3 - (i % 10)),
          } as unknown as SanitizedProject);
    });
  }, [projects]);

  // Filtering Logic
  const filteredRows = useMemo(() => {
    return projectList.filter((p) => {
      const name = String(p["Project Name"] || "").toLowerCase();
      const ticket = String(p.Ticket || "").toLowerCase();
      const owner = String(p["Owner Name"] || "").toLowerCase();
      const div = String(p["Owner Div"] || p["Owner Division"] || "").toLowerCase();
      const pic = String(p["PIC Name"] || p["PIC Project"] || "").toLowerCase();

      // Search Query
      const query = q.trim().toLowerCase();
      if (query && !name.includes(query) && !ticket.includes(query) && !owner.includes(query) && !div.includes(query) && !pic.includes(query)) {
        return false;
      }

      // Year Filter
      if (pYear !== "Semua") {
        const y = String(p.Year || p._year || "");
        if (y !== pYear) return false;
      }

      // Type Filter
      if (pType !== "Semua") {
        if (p["Type Project"] !== pType) return false;
      }

      // Div Filter
      if (pDiv !== "Semua") {
        const pdiv = p["Owner Div"] || p["Owner Division"];
        if (pdiv !== pDiv) return false;
      }

      // Pipeline Filter
      if (pPipe !== "Semua") {
        const tn = getTone(p["Last Status"]);
        const isUAT = String(p["Last Status"]).toUpperCase().includes("UAT");
        let pipe = "Hold";
        if (isUAT) pipe = "UAT";
        else if (tn === "blue") pipe = "In progress";
        else if (tn === "amber") pipe = "Queue";
        else if (tn === "green") pipe = "Monitoring";
        if (pipe !== pPipe) return false;
      }

      // Delay Filter
      if (pDelay !== "Semua") {
        const late = Number(p["(UAT) Late Days"] || p["(Dev) Late Days"] || p["(FSD) Late Days"] || 0);
        const isLate = late > 0;
        if (pDelay === "Terlambat" && !isLate) return false;
        if (pDelay === "Tepat waktu" && isLate) return false;
      }

      return true;
    });
  }, [projectList, q, pYear, pType, pDiv, pPipe, pDelay]);

  // Pagination
  const totalCount = filteredRows.length;
  const totalPages = Math.ceil(totalCount / pSize) || 1;
  const currentPage = Math.min(pPage, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * pSize, currentPage * pSize);
  const rangeStart = totalCount > 0 ? (currentPage - 1) * pSize + 1 : 0;
  const rangeEnd = Math.min(currentPage * pSize, totalCount);

  // Milestone SLA Chips helper
  const renderMilestoneChips = (p: SanitizedProject) => {
    const stages = [
      { name: "FSD", result: p["FSD SLA"] },
      { name: "DEV", result: p["DEV SLA"] },
      { name: "SIT", result: p["SIT SLA"] },
      { name: "UAT", result: p["UAT SLA"] },
      { name: "LIVE", result: p["Live SLA"] },
    ];
    return (
      <div className="dd-chip-group" style={{ flexWrap: "nowrap" }}>
        {stages.map((st) => {
          let chipClass = "dd-chip--gray";
          if (st.result === "Achieved") chipClass = "dd-chip--green";
          else if (st.result === "Not Achieved") chipClass = "dd-chip--red";
          return (
            <span key={st.name} className={`dd-chip ${chipClass}`}>
              {st.name}
            </span>
          );
        })}
      </div>
    );
  };

  const downloadCsv = () => {
    const headers = ["Ticket", "Project Name", "Type Project", "Owner Division", "Last Status"];
    const rows = filteredRows.map((p) => [
      p.Ticket || "",
      `"${(p["Project Name"] || "").replace(/"/g, '""')}"`,
      p["Type Project"] || "",
      `"${(p["Owner Div"] || p["Owner Division"] || "").replace(/"/g, '""')}"`,
      p["Last Status"] || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pic-monitoring-projects-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <h1 className="dd-page__title">Project list</h1>
            <p className="dd-page__subtitle">
              Semua proyek beserta hasil SLA per tahap
            </p>
          </div>
          <button
            className="dd-btn dd-btn--primary dd-btn--md"
            type="button"
            onClick={downloadCsv}
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
            Spreadsheet (CSV)
          </button>
        </div>

        {/* Table Section */}
        <section className="dd-table" style={{ overflow: "visible" }}>
          {/* Table Toolbar */}
          <div className="dd-table__toolbar">
            <div className="dd-table__titlewrap" style={{ maxWidth: "100%", flexBasis: "100%" }}>
              <div className="dd-table__titlerow">
                <h2 className="dd-table__title">Projects</h2>
                <span className="dd-count">{totalCount}</span>
              </div>
              <p className="dd-table__hint">
                Ketik untuk mencari · klik baris untuk membuka detail
              </p>
            </div>

            {/* Search Input */}
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
                  aria-label="Cari proyek"
                  placeholder="Cari nama, tiket, owner, PIC"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPPage(1);
                  }}
                />
              </div>
            </div>

            {/* Dropdown Filters Bar (Pict 1: exact icons and active blue state) */}
            <div className="dd-table__filters">
              {/* Year Filter */}
              <div className="dd-dd" style={{ position: "relative" }}>
                {activeDropdown === "year" && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 1 }}
                    onClick={() => setActiveDropdown(null)}
                  />
                )}
                <button
                  type="button"
                  className={`dd-tfilter ${pYear !== "Semua" ? "dd-tfilter--active" : ""} ${activeDropdown === "year" ? "dd-tfilter--open" : ""}`}
                  onClick={() => setActiveDropdown(activeDropdown === "year" ? null : "year")}
                  style={{ flex: 1, position: "relative", zIndex: 2 }}
                >
                  <span className="dd-tfilter__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={IC.cal} />
                    </svg>
                  </span>
                  <span className="dd-tfilter__label">Intake year</span>
                  <span className="dd-tfilter__value">{pYear}</span>
                  <svg className="dd-tfilter__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {activeDropdown === "year" && (
                  <div className="dd-dd__menu" role="listbox" style={{ zIndex: 5, display: "block" }}>
                    <div className="dd-dd__opts">
                      {["Semua", ...years].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          className={`dd-dd__opt ${pYear === yr ? "dd-dd__opt--active" : ""}`}
                          onClick={() => {
                            setPYear(yr);
                            setPPage(1);
                            setActiveDropdown(null);
                          }}
                        >
                          <span className="dd-dd__opttext">{yr}</span>
                          {pYear === yr && (
                            <svg className="dd-dd__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Type Filter */}
              <div className="dd-dd" style={{ position: "relative" }}>
                {activeDropdown === "type" && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 1 }}
                    onClick={() => setActiveDropdown(null)}
                  />
                )}
                <button
                  type="button"
                  className={`dd-tfilter ${pType !== "Semua" ? "dd-tfilter--active" : ""} ${activeDropdown === "type" ? "dd-tfilter--open" : ""}`}
                  onClick={() => setActiveDropdown(activeDropdown === "type" ? null : "type")}
                  style={{ flex: 1, position: "relative", zIndex: 2 }}
                >
                  <span className="dd-tfilter__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={IC.layers} />
                    </svg>
                  </span>
                  <span className="dd-tfilter__label">Project type</span>
                  <span className="dd-tfilter__value">{pType}</span>
                  <svg className="dd-tfilter__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {activeDropdown === "type" && (
                  <div className="dd-dd__menu" role="listbox" style={{ zIndex: 5, display: "block" }}>
                    <div className="dd-dd__opts">
                      {["Semua", ...projectTypes].map((ty) => (
                        <button
                          key={ty}
                          type="button"
                          className={`dd-dd__opt ${pType === ty ? "dd-dd__opt--active" : ""}`}
                          onClick={() => {
                            setPType(ty);
                            setPPage(1);
                            setActiveDropdown(null);
                          }}
                        >
                          <span className="dd-dd__opttext">{ty}</span>
                          {pType === ty && (
                            <svg className="dd-dd__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Division Filter */}
              <div className="dd-dd" style={{ position: "relative" }}>
                {activeDropdown === "div" && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 1 }}
                    onClick={() => setActiveDropdown(null)}
                  />
                )}
                <button
                  type="button"
                  className={`dd-tfilter ${pDiv !== "Semua" ? "dd-tfilter--active" : ""} ${activeDropdown === "div" ? "dd-tfilter--open" : ""}`}
                  onClick={() => setActiveDropdown(activeDropdown === "div" ? null : "div")}
                  style={{ flex: 1, position: "relative", zIndex: 2 }}
                >
                  <span className="dd-tfilter__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={IC.org} />
                    </svg>
                  </span>
                  <span className="dd-tfilter__label">Owner division</span>
                  <span className="dd-tfilter__value">{pDiv}</span>
                  <svg className="dd-tfilter__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {activeDropdown === "div" && (
                  <div className="dd-dd__menu" role="listbox" style={{ zIndex: 5, display: "block", maxHeight: 260, overflowY: "auto" }}>
                    <div className="dd-dd__opts">
                      {["Semua", ...divisions].map((dv) => (
                        <button
                          key={dv}
                          type="button"
                          className={`dd-dd__opt ${pDiv === dv ? "dd-dd__opt--active" : ""}`}
                          onClick={() => {
                            setPDiv(dv);
                            setPPage(1);
                            setActiveDropdown(null);
                          }}
                        >
                          <span className="dd-dd__opttext">{dv}</span>
                          {pDiv === dv && (
                            <svg className="dd-dd__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pipeline Filter */}
              <div className="dd-dd" style={{ position: "relative" }}>
                {activeDropdown === "pipe" && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 1 }}
                    onClick={() => setActiveDropdown(null)}
                  />
                )}
                <button
                  type="button"
                  className={`dd-tfilter ${pPipe !== "Semua" ? "dd-tfilter--active" : ""} ${activeDropdown === "pipe" ? "dd-tfilter--open" : ""}`}
                  onClick={() => setActiveDropdown(activeDropdown === "pipe" ? null : "pipe")}
                  style={{ flex: 1, position: "relative", zIndex: 2 }}
                >
                  <span className="dd-tfilter__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={IC.route} />
                    </svg>
                  </span>
                  <span className="dd-tfilter__label">Pipeline</span>
                  <span className="dd-tfilter__value">{pPipe}</span>
                  <svg className="dd-tfilter__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {activeDropdown === "pipe" && (
                  <div className="dd-dd__menu" role="listbox" style={{ zIndex: 5, display: "block" }}>
                    <div className="dd-dd__opts">
                      {["Semua", "In progress", "Monitoring", "Queue", "UAT", "Hold"].map((pp) => (
                        <button
                          key={pp}
                          type="button"
                          className={`dd-dd__opt ${pPipe === pp ? "dd-dd__opt--active" : ""}`}
                          onClick={() => {
                            setPPipe(pp);
                            setPPage(1);
                            setActiveDropdown(null);
                          }}
                        >
                          <span className="dd-dd__opttext">{pp}</span>
                          {pPipe === pp && (
                            <svg className="dd-dd__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Delay Filter */}
              <div className="dd-dd" style={{ position: "relative" }}>
                {activeDropdown === "delay" && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 1 }}
                    onClick={() => setActiveDropdown(null)}
                  />
                )}
                <button
                  type="button"
                  className={`dd-tfilter ${pDelay !== "Semua" ? "dd-tfilter--active" : ""} ${activeDropdown === "delay" ? "dd-tfilter--open" : ""}`}
                  onClick={() => setActiveDropdown(activeDropdown === "delay" ? null : "delay")}
                  style={{ flex: 1, position: "relative", zIndex: 2 }}
                >
                  <span className="dd-tfilter__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={IC.clock} />
                    </svg>
                  </span>
                  <span className="dd-tfilter__label">Delay status</span>
                  <span className="dd-tfilter__value">{pDelay}</span>
                  <svg className="dd-tfilter__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {activeDropdown === "delay" && (
                  <div className="dd-dd__menu" role="listbox" style={{ zIndex: 5, display: "block" }}>
                    <div className="dd-dd__opts">
                      {["Semua", "Terlambat", "Tepat waktu"].map((dl) => (
                        <button
                          key={dl}
                          type="button"
                          className={`dd-dd__opt ${pDelay === dl ? "dd-dd__opt--active" : ""}`}
                          onClick={() => {
                            setPDelay(dl);
                            setPPage(1);
                            setActiveDropdown(null);
                          }}
                        >
                          <span className="dd-dd__opttext">{dl}</span>
                          {pDelay === dl && (
                            <svg className="dd-dd__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table Rows & Columns */}
          <div className="dd-table__scroll">
            <div style={{ minWidth: 1000 }}>
              <div
                className="dd-table__head"
                style={{
                  gridTemplateColumns: "56px 116px minmax(0, 2.3fr) minmax(0, 1.5fr) 88px minmax(0, 1.2fr) 48px",
                }}
              >
                <div className="dd-table__th">No</div>
                <div className="dd-table__th">Ticket</div>
                <div className="dd-table__th">Project</div>
                <div className="dd-table__th">Milestones SLA</div>
                <div className="dd-table__th" style={{ justifyContent: "flex-end" }}>
                  Late
                </div>
                <div className="dd-table__th">Status</div>
                <div className="dd-table__th" />
              </div>

              {pagedRows.map((r, idx) => {
                const late = Number(r["(UAT) Late Days"] || r["(Dev) Late Days"] || r["(FSD) Late Days"] || 0);
                const isLate = late > 0;
                const tone = getTone(r["Last Status"]);
                const rowNo = rangeStart + idx;

                return (
                  <div
                    key={r.notion_page_id || `${r.Ticket || "proj"}-${rowNo}`}
                    onClick={() =>
                      setActiveModal({
                        type: "project",
                        title: r["Project Name"],
                        subtitle: `${r.Ticket} · ${r["Type Project"]}`,
                        project: r,
                      })
                    }
                    className="dd-table__row dd-clickable"
                    style={{
                      gridTemplateColumns: "56px 116px minmax(0, 2.3fr) minmax(0, 1.5fr) 88px minmax(0, 1.2fr) 48px",
                      cursor: "pointer",
                    }}
                  >
                    <div className="dd-table__td">
                      <span className="dd-table__idx">{rowNo}</span>
                    </div>
                    <div className="dd-table__td">
                      <span style={{ font: "var(--text-cell-num)", color: "var(--text-secondary)" }}>
                        {r.Ticket}
                      </span>
                    </div>
                    <div className="dd-table__td">
                      <div className="dd-table__primary">{r["Project Name"]}</div>
                      <div className="dd-table__secondary">
                        {r["Type Project"]} · {r["Owner Div"] || r["Owner Division"] || r["Owner Name"]}
                      </div>
                    </div>
                    <div className="dd-table__td">{renderMilestoneChips(r)}</div>
                    <div className="dd-table__td" style={{ textAlign: "right" }}>
                      <span
                        style={{
                          font: "var(--text-cell-num)",
                          color: isLate ? "var(--status-red-fg)" : "var(--text-placeholder)",
                        }}
                      >
                        {isLate ? `+${late} hari` : "—"}
                      </span>
                    </div>
                    <div className="dd-table__td">
                      <span className={`dd-pill dd-pill--${tone}`}>
                        <span className="dd-pill__dot" />
                        {r["Last Status"]}
                      </span>
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
                );
              })}

              {pagedRows.length === 0 && (
                <div className="dd-empty">
                  <div className="dd-empty__title">Tidak ada hasil</div>
                  <div className="dd-empty__msg">
                    Periksa ejaan atau longgarkan filter.
                  </div>
                  <button
                    className="dd-btn dd-btn--secondary dd-btn--sm"
                    type="button"
                    onClick={() => {
                      setQ("");
                      setPYear("Semua");
                      setPType("Semua");
                      setPDiv("Semua");
                      setPPipe("Semua");
                      setPDelay("Semua");
                    }}
                    style={{ marginTop: 8 }}
                  >
                    Hapus pencarian
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table Footer with Page Size & Pager (Pict 3 & Pict 4) */}
          <div className="dd-table__foot">
            <span className="dd-table__count">
              Menampilkan {rangeStart}–{rangeEnd} dari {totalCount} data
              {projects.length === 0 && (
                <> · <span style={{ color: "var(--text-placeholder)" }}>data contoh diulang untuk prototipe</span></>
              )}
            </span>

            {/* Page Size Selector */}
            <div className="dd-dd" style={{ width: 215, marginLeft: "auto", position: "relative" }}>
              {activeDropdown === "psize" && (
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 1 }}
                  onClick={() => setActiveDropdown(null)}
                />
              )}
              <button
                type="button"
                className={`dd-tfilter ${activeDropdown === "psize" ? "dd-tfilter--open" : ""}`}
                onClick={() => setActiveDropdown(activeDropdown === "psize" ? null : "psize")}
                style={{ flex: 1, position: "relative", zIndex: 2 }}
              >
                <span className="dd-tfilter__icon" style={{ color: "var(--accent)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={IC.layers} />
                  </svg>
                </span>
                <span className="dd-tfilter__label">Baris per halaman</span>
                <span className="dd-tfilter__value" style={{ color: "var(--accent)" }}>{pSize}</span>
                <svg className="dd-tfilter__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={activeDropdown === "psize" ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
                </svg>
              </button>
              {activeDropdown === "psize" && (
                <div
                  className="dd-dd__menu"
                  role="listbox"
                  style={{ zIndex: 10, top: "auto", bottom: "calc(100% + 6px)", display: "block" }}
                >
                  <div className="dd-dd__opts">
                    {[10, 25, 50].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`dd-dd__opt ${pSize === sz ? "dd-dd__opt--active" : ""}`}
                        onClick={() => {
                          setPSize(sz);
                          setPPage(1);
                          setActiveDropdown(null);
                        }}
                      >
                        <span className="dd-dd__opttext">{sz}</span>
                        {pSize === sz && (
                          <svg className="dd-dd__tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Page Buttons (Pict 3: < 1 2 ... 5 >) */}
            <div className="dd-pager" style={{ marginLeft: 0 }}>
              <button
                type="button"
                className="dd-pager__btn"
                disabled={currentPage <= 1}
                onClick={() => setPPage((p) => Math.max(1, p - 1))}
                aria-label="Halaman sebelumnya"
                style={{ opacity: currentPage <= 1 ? 0.35 : 1, padding: "0 6px" }}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              {totalPages <= 5 ? (
                Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`dd-pager__btn ${n === currentPage ? "dd-pager__btn--active" : ""}`}
                    onClick={() => setPPage(n)}
                  >
                    {n}
                  </button>
                ))
              ) : (
                <>
                  <button
                    type="button"
                    className={`dd-pager__btn ${currentPage === 1 ? "dd-pager__btn--active" : ""}`}
                    onClick={() => setPPage(1)}
                  >
                    1
                  </button>
                  {currentPage > 3 && <span style={{ padding: "0 3px", color: "var(--text-placeholder)" }}>…</span>}
                  {currentPage > 2 && currentPage < totalPages && (
                    <button
                      type="button"
                      className="dd-pager__btn dd-pager__btn--active"
                      onClick={() => setPPage(currentPage)}
                    >
                      {currentPage}
                    </button>
                  )}
                  {currentPage === 2 && (
                    <button
                      type="button"
                      className="dd-pager__btn dd-pager__btn--active"
                      onClick={() => setPPage(2)}
                    >
                      2
                    </button>
                  )}
                  {currentPage < totalPages - 2 && <span style={{ padding: "0 3px", color: "var(--text-placeholder)" }}>…</span>}
                  <button
                    type="button"
                    className={`dd-pager__btn ${currentPage === totalPages ? "dd-pager__btn--active" : ""}`}
                    onClick={() => setPPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                className="dd-pager__btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman berikutnya"
                style={{ opacity: currentPage >= totalPages ? 0.35 : 1, padding: "0 6px" }}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
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
