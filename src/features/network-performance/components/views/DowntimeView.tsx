"use client";

import React, { useMemo, useState } from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import { monthInRange } from "@/lib/network/month-range";
import { useHoverTip, tipTone, type TipData } from "../../context/TooltipLayer";
import SectionCard, { CardTitle } from "../SectionCard";
import DowntimeTable, { type DtRow } from "../DowntimeTable";
import CauseBreakdownGrid from "../CauseBreakdownGrid";
import IncidentDetailModal from "../modals/IncidentDetailModal";
import BranchIncidentsModal from "../modals/BranchIncidentsModal";
import IndonesiaMap from "../IndonesiaMap";
import EmptyYearNotice from "../EmptyYearNotice";
import type { MapPoint } from "../../services/mapPoints";
import { CAUSE_COLORS } from "../../data/colors";
import { useNetworkData } from "../../context/NetworkDataContext";
import { durMin, fmtDur, fmtSla, slaNum } from "../../services/format";

const sevRank: Record<string, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export default function DowntimeView() {
  const { tahun, bulan, bulanMonths, scope } = useFilters();
  const { sla, map, incidents, periods } = useNetworkData();
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  const [dtSortKey, setDtSortKey] = useState("sla");
  const [dtSortDir, setDtSortDir] = useState<"asc" | "desc">("asc");
  const [dtSearch, setDtSearch] = useState("");
  const [dtSeverity, setDtSeverity] = useState("all");
  const [dtCauses, setDtCauses] = useState<string[]>([]);
  const [detailRow, setDetailRow] = useState<DtRow | null>(null);
  const [branchModal, setBranchModal] = useState<{
    branchName: string;
    rows: DtRow[];
  } | null>(null);

  const toggleCause = (name: string) => {
    setDtCauses((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const d = useMemo(() => {
    const scopeSet = new Set(sla.scopeBranches(scope).map((b) => b.name));
    const byName = new Map(sla.branches.map((b) => [b.name, b]));
    // The top bar is a global period filter, so the table, the KPIs, the cause
    // breakdown and the map all have to honour it. `month` is already 0-indexed
    // by the query, matching `bulan`. Incidents with no timestamp cannot be
    // placed in a period and are excluded rather than shown under every filter.
    const downtimeF = incidents.filter(
      (i) =>
        scopeSet.has(i.site) &&
        i.year === tahun &&
        (bulanMonths != null
          ? i.month != null && bulanMonths.includes(i.month)
          : monthInRange(i.month, bulan)),
    );

    const dtBase = downtimeF.map((i) => {
      const b = byName.get(i.site);
      const sn = slaNum(i.sla);
      const tn = sla.tone(sn);
      return {
        id: i.id,
        site: i.site,
        region: b ? b.region : "—",
        periode: i.periode,
        sla: fmtSla(i.sla),
        slaNum: sn,
        durasi: i.durasi,
        durMin: durMin(i.durasi),
        problem: i.problem,
        impact: i.impact,
        solution: i.solution,
        downtimeStart: i.downtimeStart,
        uptimeEnd: i.uptimeEnd,
        level: i.level,
        cause: i.cause,
        causeCode: i.causeCode,
        verified: i.verified,
        tone: tn,
      };
    });

    // count is incidents; the chip list is distinct branches, since a branch
    // can hit the same cause more than once.
    const causeMap: Record<
      string,
      { n: number; code: string; branches: string[] }
    > = {};
    dtBase.forEach((i) => {
      const e = (causeMap[i.cause] = causeMap[i.cause] || {
        n: 0,
        code: i.causeCode,
        branches: [],
      });
      e.n++;
      if (!e.branches.includes(i.site)) e.branches.push(i.site);
    });
    const causeMax = Math.max(1, ...Object.values(causeMap).map((a) => a.n));
    const causeBreakdown = Object.keys(causeMap)
      .map((c) => ({
        name: c,
        code: causeMap[c].code,
        count: causeMap[c].n,
        branches: causeMap[c].branches,
      }))
      .sort((a, b) => b.count - a.count)
      .map((c, i) => ({
        name: c.name,
        count: c.count,
        branches: c.branches,
        color: i === 0 ? "var(--accent)" : CAUSE_COLORS[c.code] || "#6B7280",
        width: Math.round((c.count / causeMax) * 100) + "%",
        active: dtCauses.includes(c.name),
      }));
    const dtCauseOptions = causeBreakdown.map((c) => ({
      value: c.name,
      label: c.name + " (" + c.count + ")",
    }));

    const dtq = dtSearch.trim().toLowerCase();
    let dtRowsArr = dtBase.filter((i) => {
      if (dtSeverity !== "all" && i.level !== dtSeverity) return false;
      if (dtCauses.length > 0 && !dtCauses.includes(i.cause)) return false;
      if (
        dtq &&
        !(
          i.site.toLowerCase().includes(dtq) ||
          i.problem.toLowerCase().includes(dtq)
        )
      )
        return false;
      return true;
    });
    const sdir = dtSortDir === "asc" ? 1 : -1;
    const sortVal: Record<string, (x: (typeof dtBase)[number]) => unknown> = {
      sla: (x) => x.slaNum,
      cabang: (x) => x.site,
      periode: (x) => x.periode,
      durasi: (x) => x.durMin,
      severity: (x) => sevRank[x.level],
      cause: (x) => x.cause,
      problem: (x) => x.problem,
    };
    dtRowsArr = dtRowsArr.slice().sort((a, b) => {
      const va = sortVal[dtSortKey](a) as number | string;
      const vb = sortVal[dtSortKey](b) as number | string;
      if (va < vb) return -1 * sdir;
      if (va > vb) return 1 * sdir;
      return 0;
    });

    const dtDistinct = new Set(dtRowsArr.map((i) => i.site)).size;
    const dtTotMin = dtRowsArr.reduce((a, i) => a + i.durMin, 0);
    const dtWorst = dtRowsArr
      .slice()
      .sort((a, b) => (a.slaNum ?? 0) - (b.slaNum ?? 0))[0];
    const dtVerifiedCount = dtBase.filter((i) => i.verified).length;

    return {
      dtBase,
      dtRows: dtRowsArr as DtRow[],
      causeBreakdown,
      dtCauseOptions,
      dtDistinct,
      dtTotMin,
      dtWorst,
      dtVerifiedCount,
    };
  }, [
    sla,
    incidents,
    tahun,
    bulan,
    bulanMonths,
    scope,
    dtSearch,
    dtSeverity,
    dtCauses,
    dtSortKey,
    dtSortDir,
  ]);

  const points = useMemo(
    () => map.mapPointsDowntime(dtCauses, scope, tahun, bulan, bulanMonths),
    [map, dtCauses, scope, tahun, bulan, bulanMonths],
  );
  const sig =
    "down|" +
    tahun +
    "|" +
    bulan +
    "|" +
    scope +
    "|" +
    dtCauses.join(",") +
    "|" +
    points.length;

  const byId = useMemo(
    () => new Map((d.dtBase as DtRow[]).map((r) => [r.id, r])),
    [d.dtBase],
  );
  const handleMapPointClick = (p: MapPoint) => {
    const ids = p.incidentIds;
    if (!ids || ids.length === 0) return;
    if (ids.length === 1) {
      const row = byId.get(ids[0]);
      if (row) setDetailRow(row);
      return;
    }
    const rows = ids.map((id) => byId.get(id)).filter((r): r is DtRow => !!r);
    if (rows.length) setBranchModal({ branchName: p.branchName ?? "", rows });
  };

  const sortHead = (key: string, label: string) => ({
    label,
    arrow: dtSortKey === key ? (dtSortDir === "asc" ? "↑" : "↓") : "",
    onClick: () => {
      setDtSortDir(dtSortKey === key && dtSortDir === "asc" ? "desc" : "asc");
      setDtSortKey(key);
    },
  });

  const kpi = (
    label: string,
    value: React.ReactNode,
    tip: TipData,
    extraStyle: React.CSSProperties,
    hasBorderLeft = true,
  ) => {
    const toneColor = tipTone(tip.tone);
    return (
      <div
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderLeft =
            `3px solid ${toneColor}`;
          (e.currentTarget as HTMLDivElement).style.paddingLeft = hasBorderLeft
            ? "14px"
            : "12px";
          tipEnter(e, tip, "none");
        }}
        onMouseMove={(e) => tipMove(e)}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderLeft = hasBorderLeft
            ? "1px solid var(--border-subtle)"
            : "3px solid transparent";
          (e.currentTarget as HTMLDivElement).style.paddingLeft = hasBorderLeft
            ? "16px"
            : "12px";
          tipLeave();
        }}
        style={{
          cursor: "default",
          transition: "border-left 0.15s, padding-left 0.15s",
          ...extraStyle,
        }}
      >
        <div
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            fontWeight: 700,
            color: "var(--text-placeholder)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-2xl)",
            fontWeight: "var(--fw-black)" as React.CSSProperties["fontWeight"],
            color: "var(--text-primary)",
            marginTop: "3px",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>
    );
  };

  if (!periods.slaYears.includes(tahun)) {
    return (
      <EmptyYearNotice
        year={tahun}
        availableYears={periods.slaYears}
        suggestion="Data trafik untuk tahun ini tersedia di halaman ISP & bandwidth."
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--gap-section)",
      }}
    >
      <div style={{ display: "block" }}>
        <SectionCard
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <div
            className="network-inline-kpis"
            style={{
              display: "flex",
              alignItems: "stretch",
              marginBottom: "16px",
            }}
          >
            {kpi(
              "Total Incidents",
              d.dtRows.length,
              {
                title: "Total Incidents",
                primary: d.dtRows.length + " insiden",
                secondary:
                  "(" +
                  d.dtRows.length +
                  " insiden di " +
                  d.dtDistinct +
                  " cabang)",
                meta:
                  d.dtVerifiedCount +
                  " dari " +
                  d.dtBase.length +
                  " sudah tercatat di laporan bulanan cabang",
                tone: "blue",
              },
              {
                flex: 1,
                paddingRight: "16px",
                paddingLeft: "12px",
                borderLeft: "3px solid transparent",
              },
              false,
            )}
            {kpi(
              "Affected Branches",
              d.dtDistinct,
              {
                title: "Affected Branches",
                primary: d.dtDistinct + " cabang",
                secondary:
                  "(" +
                  d.dtDistinct +
                  " cabang dari " +
                  d.dtRows.length +
                  " insiden)",
                meta:
                  "Rata-rata " +
                  (d.dtDistinct
                    ? (d.dtRows.length / d.dtDistinct).toFixed(1)
                    : "0") +
                  " insiden per cabang terdampak",
                tone: "blue",
              },
              {
                flex: 1,
                padding: "0 16px",
                borderLeft: "1px solid var(--border-subtle)",
              },
              true,
            )}
            {kpi(
              "Total downtime",
              fmtDur(d.dtTotMin),
              {
                title: "Total downtime",
                primary: fmtDur(d.dtTotMin),
                secondary: "(" + d.dtRows.length + " insiden diakumulasi)",
                meta: "Jumlah durasi seluruh insiden pada filter aktif",
                tone: "amber",
              },
              {
                flex: 1,
                padding: "0 16px",
                borderLeft: "1px solid var(--border-subtle)",
              },
              true,
            )}
            <div
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderLeft =
                  "3px solid #DC2626";
                (e.currentTarget as HTMLDivElement).style.paddingLeft = "14px";
                tipEnter(
                  e,
                  d.dtWorst
                    ? {
                        title: "Worst SLA",
                        primary: d.dtWorst.sla,
                        secondary:
                          "(" + d.dtWorst.site + ", " + d.dtWorst.periode + ")",
                        meta: d.dtWorst.problem,
                        tone: "red",
                      }
                    : { title: "Worst SLA", primary: "—", tone: "gray" },
                  "none",
                );
              }}
              onMouseMove={(e) => tipMove(e)}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderLeft =
                  "1px solid var(--border-subtle)";
                (e.currentTarget as HTMLDivElement).style.paddingLeft = "16px";
                tipLeave();
              }}
              style={{
                flex: 1.3,
                paddingLeft: "16px",
                borderLeft: "1px solid var(--border-subtle)",
                cursor: "default",
                transition: "border-left 0.15s, padding-left 0.15s",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  fontWeight: 700,
                  color: "var(--text-placeholder)",
                }}
              >
                Worst SLA
              </div>
              <div style={{ marginTop: "3px", lineHeight: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-2xl)",
                    fontWeight:
                      "var(--fw-black)" as React.CSSProperties["fontWeight"],
                    color: "var(--status-red-fg)",
                  }}
                >
                  {d.dtWorst ? d.dtWorst.sla : "—"}
                </span>{" "}
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-placeholder)",
                    fontWeight: 600,
                  }}
                >
                  {d.dtWorst ? d.dtWorst.site : ""}
                </span>
              </div>
            </div>
          </div>

          <DowntimeTable
            rows={d.dtRows}
            heads={{
              sev: sortHead("severity", "Sev"),
              cabang: sortHead("cabang", "Cabang"),
              periode: sortHead("periode", "Periode"),
              sla: sortHead("sla", "SLA"),
              durasi: sortHead("durasi", "Durasi"),
              problem: sortHead("problem", "Problem"),
              cause: sortHead("cause", "Penyebab"),
            }}
            dtSearch={dtSearch}
            onDtSearch={setDtSearch}
            dtSeverity={dtSeverity}
            onDtSeverity={setDtSeverity}
            dtCauseVal={dtCauses.length === 1 ? dtCauses[0] : ""}
            onDtCauseSel={(v) => setDtCauses(v ? [v] : [])}
            causeOptions={d.dtCauseOptions}
            onProblemClick={setDetailRow}
          />
        </SectionCard>
      </div>

      <SectionCard>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "6px",
          }}
        >
          <CardTitle
            title="Incident Locations"
            subtitle={"Hanya cabang dengan catatan downtime · " + tahun}
          />
          {dtCauses.length > 0 && (
            <button
              onClick={() => setDtCauses([])}
              style={{
                border: "1px solid var(--border-default)",
                background: "var(--bg-card)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--accent)",
                borderRadius: "999px",
                padding: "5px 12px",
                whiteSpace: "nowrap",
              }}
            >
              Reset ·{" "}
              {dtCauses.length === 1
                ? dtCauses[0]
                : `${dtCauses.length} penyebab`}
            </button>
          )}
        </div>
        <IndonesiaMap
          points={points}
          minHeight={380}
          sig={sig}
          onPointClick={handleMapPointClick}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "16px 0 10px",
          }}
        >
          <div
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-placeholder)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              fontWeight: 700,
            }}
          >
            Penyebab downtime
          </div>
          {dtCauses.length > 0 ? (
            <button
              type="button"
              onClick={() => setDtCauses([])}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Reset filter
            </button>
          ) : (
            <div style={{ fontSize: "11px", color: "var(--text-placeholder)" }}>
              Klik untuk memfilter tabel & peta
            </div>
          )}
        </div>
        <CauseBreakdownGrid
          rows={d.causeBreakdown}
          total={d.dtBase.length}
          onToggle={toggleCause}
        />
      </SectionCard>

      {branchModal && (
        <BranchIncidentsModal
          branchName={branchModal.branchName}
          rows={branchModal.rows}
          onSelect={(row) => {
            setBranchModal(null);
            setDetailRow(row);
          }}
          onClose={() => setBranchModal(null)}
        />
      )}

      {detailRow && (
        <IncidentDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  );
}
