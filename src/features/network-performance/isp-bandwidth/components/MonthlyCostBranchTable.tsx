"use client";

import React, { useMemo, useState } from "react";
import SectionCard, {
  CardTitle,
} from "@/features/network-performance/components/SectionCard";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import { fmtNum, rupiah } from "../utils/formatters";
import { TR_MONTHS } from "../data/ispCostDataset";
import type {
  IspBranchMonthlyRow,
  IspRegionCostRow,
} from "../types/isp-cost.types";

export type BranchSortKey = "no" | "branch" | "avg";

export default function MonthlyCostBranchTable({
  year,
  regionRows,
  branchRows,
  onSelectBranch,
  onSelectRegion,
}: {
  year: number;
  regionRows: IspRegionCostRow[];
  branchRows: IspBranchMonthlyRow[];
  onSelectBranch: (branchName: string) => void;
  onSelectRegion: (regionKey: string) => void;
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: BranchSortKey; dir: "asc" | "desc" }>({
    key: "avg",
    dir: "desc",
  });

  const filteredAndSortedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = branchRows;
    if (q) {
      rows = rows.filter((r) => r.branch.toLowerCase().includes(q));
    }

    return [...rows].sort((a, b) => {
      let valA: string | number = a.no;
      let valB: string | number = b.no;

      if (sort.key === "branch") {
        valA = a.branch;
        valB = b.branch;
      } else if (sort.key === "avg") {
        valA = a.avgM;
        valB = b.avgM;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        const c = valA.localeCompare(valB);
        return sort.dir === "desc" ? -c : c;
      }
      return sort.dir === "desc"
        ? (valB as number) - (valA as number)
        : (valA as number) - (valB as number);
    });
  }, [branchRows, query, sort]);

  const monthTotals = useMemo(() => {
    return TR_MONTHS.map((_, mi) =>
      filteredAndSortedRows.reduce((acc, r) => acc + (r.months[mi] || 0), 0),
    );
  }, [filteredAndSortedRows]);

  const grandAvg = useMemo(() => {
    return filteredAndSortedRows.reduce((acc, r) => acc + r.avgM, 0);
  }, [filteredAndSortedRows]);

  const handleSort = (key: BranchSortKey) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc",
    }));
  };

  const jt = (n: number) => fmtNum(n / 1e6, 1);

  return (
    <SectionCard>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "16px",
        }}
      >
        <CardTitle
          title="Monthly cost per branch"
          subtitle={`Bandingkan biaya tiap cabang dari bulan ke bulan, dalam Rp juta · Jan–Des ${year} · ${filteredAndSortedRows.length} dari ${branchRows.length} cabang`}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          {/* Legend badge for orange cells */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: "#FFFBEB",
                border: "1px solid #F59E0B",
                display: "inline-block",
              }}
            />
            <span>Bulan termahal</span>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari cabang"
            style={{
              width: "190px",
              height: "34px",
              padding: "0 12px",
              flexShrink: 0,
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--text-primary)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-base)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Region Summary Cards */}
      <div style={{ marginBottom: "18px" }}>
        <div
          style={{
            fontSize: "var(--fs-sm)",
            color: "var(--text-placeholder)",
            textTransform: "uppercase",
            letterSpacing: ".05em",
            fontWeight: 700,
            marginBottom: "9px",
          }}
        >
          Total by region
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "10px",
          }}
        >
          {regionRows.map((r) => (
            <div
              key={r.region}
              onClick={() => {
                tipLeave();
                onSelectRegion(r.region);
              }}
              onMouseEnter={(e) =>
                tipEnter(
                  e,
                  {
                    title: r.region,
                    primary: rupiah(r.cost) + " / bulan",
                    secondary: `(${r.count} cabang · ${r.linksLabel})`,
                    meta: "Klik untuk rincian cabang",
                    tone: "blue",
                  },
                  "none",
                )
              }
              onMouseMove={(e) => tipMove(e)}
              onMouseLeave={() => tipLeave()}
              style={{
                background: "var(--bg-page)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-base)",
                padding: "11px 13px",
                cursor: "pointer",
                outline: "none",
                transition: "border-color .15s, box-shadow .15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    color: "var(--text-secondary)",
                    letterSpacing: ".02em",
                  }}
                >
                  {r.region}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "var(--text-placeholder)",
                  }}
                >
                  {r.count} site
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginTop: "6px",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                {r.costFull}
              </div>
              <div
                style={{
                  height: "7px",
                  borderRadius: "999px",
                  overflow: "hidden",
                  background: "var(--chart-gray-track)",
                  marginTop: "9px",
                }}
              >
                <div
                  style={{
                    width: r.barPct,
                    height: "100%",
                    borderRadius: "999px",
                    background: "var(--accent)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "6px",
                  marginTop: "7px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "var(--text-secondary)",
                  }}
                >
                  {r.mbpsLabel}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "var(--text-secondary)",
                  }}
                >
                  {r.linksLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div
        className="nl-scroll"
        style={{
          overflowX: "auto",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-base)",
          maxHeight: "440px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: "12px",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              <th
                onClick={() => handleSort("no")}
                style={{
                  position: "sticky",
                  top: 0,
                  left: 0,
                  background: "#fff",
                  padding: "10px 8px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color:
                    sort.key === "no"
                      ? "var(--accent)"
                      : "var(--text-placeholder)",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border-default)",
                  zIndex: 6,
                  textAlign: "right",
                  width: "38px",
                }}
              >
                No{sort.key === "no" ? (sort.dir === "desc" ? " ↓" : " ↑") : ""}
              </th>
              <th
                onClick={() => handleSort("branch")}
                style={{
                  position: "sticky",
                  top: 0,
                  left: "38px",
                  background: "#fff",
                  padding: "10px 10px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color:
                    sort.key === "branch"
                      ? "var(--accent)"
                      : "var(--text-placeholder)",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border-default)",
                  borderRight: "1px solid var(--border-default)",
                  zIndex: 6,
                  width: "145px",
                }}
              >
                Cabang
                {sort.key === "branch"
                  ? sort.dir === "desc"
                    ? " ↓"
                    : " ↑"
                  : ""}
              </th>
              {TR_MONTHS.map((m) => (
                <th
                  key={m}
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#fff",
                    padding: "10px 8px",
                    fontSize: "9.5px",
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    color: "var(--text-placeholder)",
                    borderBottom: "1px solid var(--border-default)",
                    borderLeft: "1px solid var(--border-subtle)",
                    textAlign: "right",
                    zIndex: 5,
                    minWidth: "62px",
                  }}
                >
                  {m}
                </th>
              ))}
              <th
                onClick={() => handleSort("avg")}
                style={{
                  position: "sticky",
                  top: 0,
                  right: 0,
                  background: "#fff",
                  padding: "10px 10px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color:
                    sort.key === "avg"
                      ? "var(--accent)"
                      : "var(--text-placeholder)",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border-default)",
                  borderLeft: "1px solid var(--border-default)",
                  textAlign: "right",
                  zIndex: 6,
                  minWidth: "86px",
                }}
              >
                AVG / bln
                {sort.key === "avg" ? (sort.dir === "desc" ? " ↓" : " ↑") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRows.map((r) => {
              const maxM = Math.max(...r.months);
              const minM = Math.min(...r.months);

              return (
                <tr
                  key={r.branch}
                  onClick={() => onSelectBranch(r.branch)}
                  style={{
                    height: "34px",
                    cursor: "pointer",
                  }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* Sticky No */}
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      background: "#fff",
                      padding: "0 8px",
                      borderBottom: "1px solid var(--border-subtle)",
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--text-placeholder)",
                      textAlign: "right",
                      zIndex: 2,
                    }}
                  >
                    {r.no}
                  </td>

                  {/* Sticky Branch */}
                  <td
                    style={{
                      position: "sticky",
                      left: "38px",
                      background: "#fff",
                      padding: "0 10px",
                      borderBottom: "1px solid var(--border-subtle)",
                      borderRight: "1px solid var(--border-default)",
                      fontFamily: "var(--font-body)",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      zIndex: 2,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        overflow: "hidden",
                      }}
                    >
                      {r.branch}
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "9.5px",
                          fontWeight: 800,
                          color: "var(--text-placeholder)",
                          flexShrink: 0,
                        }}
                      >
                        {r.region}
                      </span>
                    </span>
                  </td>

                  {/* 12 Months Cells */}
                  {r.months.map((c, mi) => {
                    const isHi = c === maxM;
                    const isLo = c === minM;

                    return (
                      <td
                        key={mi}
                        onMouseEnter={(e) =>
                          tipEnter(
                            e,
                            {
                              title: `${r.branch} · ${TR_MONTHS[mi]}`,
                              primary: `Rp ${fmtNum(c, 0)}`,
                              secondary: `(rata-rata cabang Rp ${fmtNum(Math.round(r.avgM), 0)} / bulan)`,
                              meta: isHi
                                ? "Bulan termahal cabang ini."
                                : isLo
                                  ? "Bulan termurah cabang ini."
                                  : "",
                              tone: isHi ? "amber" : "blue",
                            },
                            "none",
                          )
                        }
                        onMouseMove={(e) => tipMove(e)}
                        onMouseLeave={() => tipLeave()}
                        style={{
                          padding: "0 8px",
                          borderBottom: "1px solid var(--border-subtle)",
                          borderLeft: "1px solid var(--border-subtle)",
                          fontFamily: "var(--font-display)",
                          fontSize: "10.5px",
                          fontWeight: isHi ? 800 : 700,
                          textAlign: "right",
                          outline: "none",
                          color: isHi ? "#B45309" : "var(--text-secondary)",
                          background: isHi ? "#FFFBEB" : "transparent",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {jt(c)}
                      </td>
                    );
                  })}

                  {/* Sticky AVG */}
                  <td
                    style={{
                      position: "sticky",
                      right: 0,
                      background: "#fff",
                      padding: "0 10px",
                      borderBottom: "1px solid var(--border-subtle)",
                      borderLeft: "1px solid var(--border-default)",
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--accent)",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      zIndex: 2,
                    }}
                  >
                    {jt(r.avgM)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Sticky Footer */}
          <tfoot>
            <tr style={{ height: "36px" }}>
              <td
                colSpan={2}
                style={{
                  position: "sticky",
                  bottom: 0,
                  left: 0,
                  background: "#F3F6FB",
                  padding: "8px 10px",
                  borderTop: "1px solid var(--border-default)",
                  borderRight: "1px solid var(--border-default)",
                  fontFamily: "var(--font-display)",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  zIndex: 7,
                }}
              >
                TOTAL ({filteredAndSortedRows.length} cabang)
              </td>
              {monthTotals.map((tot, mi) => (
                <td
                  key={mi}
                  style={{
                    position: "sticky",
                    bottom: 0,
                    background: "#F3F6FB",
                    padding: "8px 8px",
                    borderTop: "1px solid var(--border-default)",
                    borderLeft: "1px solid var(--border-subtle)",
                    fontFamily: "var(--font-display)",
                    fontSize: "10.5px",
                    fontWeight: 800,
                    textAlign: "right",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    zIndex: 6,
                  }}
                >
                  {jt(tot)}
                </td>
              ))}
              <td
                style={{
                  position: "sticky",
                  bottom: 0,
                  right: 0,
                  background: "#F3F6FB",
                  padding: "8px 10px",
                  borderTop: "1px solid var(--border-default)",
                  borderLeft: "1px solid var(--border-default)",
                  fontFamily: "var(--font-display)",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "var(--accent)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  zIndex: 7,
                }}
              >
                {jt(grandAvg)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footnote */}
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-placeholder)",
          marginTop: "12px",
          lineHeight: 1.45,
        }}
      >
        Semua angka bulan dalam Rp juta. Bulan termahal tiap cabang diberi warna
        oranye. Klik satu baris untuk melihat biaya tiap bulan dan asal biayanya
        di cabang itu.
      </div>
    </SectionCard>
  );
}
