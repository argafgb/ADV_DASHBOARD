"use client";

import React, { useMemo, useState } from "react";
import SectionCard, {
  CardTitle,
} from "@/features/network-performance/components/SectionCard";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import { fmtNum } from "../utils/formatters";
import { TR_MONTHS } from "../data/ispCostDataset";
import type { IspProviderMonthlyRow } from "../types/isp-cost.types";

export type ProviderSortKey = "vendor" | "avg";

export default function MonthlyCostProviderTable({
  year,
  providerRows,
}: {
  year: number;
  providerRows: IspProviderMonthlyRow[];
  cellMax?: number;
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{
    key: ProviderSortKey;
    dir: "asc" | "desc";
  }>({
    key: "avg",
    dir: "desc",
  });

  const filteredAndSortedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = providerRows;
    if (q) {
      rows = rows.filter((r) => r.vendor.toLowerCase().includes(q));
    }

    return [...rows].sort((a, b) => {
      let valA: string | number = a.avg;
      let valB: string | number = b.avg;

      if (sort.key === "vendor") {
        valA = a.vendor;
        valB = b.vendor;
      } else if (sort.key === "avg") {
        valA = a.avg;
        valB = b.avg;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        const c = valA.localeCompare(valB);
        return sort.dir === "desc" ? -c : c;
      }
      return sort.dir === "desc"
        ? (valB as number) - (valA as number)
        : (valA as number) - (valB as number);
    });
  }, [providerRows, query, sort]);

  const monthTotals = useMemo(() => {
    return TR_MONTHS.map((_, mi) =>
      filteredAndSortedRows.reduce((acc, r) => acc + (r.months[mi] || 0), 0),
    );
  }, [filteredAndSortedRows]);

  const grandAvg = useMemo(() => {
    return filteredAndSortedRows.reduce((acc, r) => acc + r.avg, 0);
  }, [filteredAndSortedRows]);

  const handleSort = (key: ProviderSortKey) => {
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
          title="Monthly cost by provider"
          subtitle={`Bandingkan biaya tiap provider dari bulan ke bulan, dalam Rp juta · Jan–Des ${year} · ${filteredAndSortedRows.length} dari ${providerRows.length} provider`}
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
            placeholder="Cari provider"
            style={{
              width: "170px",
              height: "34px",
              padding: "0 12px",
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
                onClick={() => handleSort("vendor")}
                style={{
                  position: "sticky",
                  top: 0,
                  left: 0,
                  background: "#fff",
                  padding: "10px 10px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color:
                    sort.key === "vendor"
                      ? "var(--accent)"
                      : "var(--text-placeholder)",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border-default)",
                  borderRight: "1px solid var(--border-default)",
                  zIndex: 6,
                  width: "135px",
                }}
              >
                Provider
                {sort.key === "vendor"
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
              return (
                <tr
                  key={r.vendor}
                  style={{ height: "34px" }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* Sticky Provider */}
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
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
                      onMouseEnter={(e) =>
                        tipEnter(
                          e,
                          {
                            title: r.vendor,
                            primary: `Rp ${fmtNum(Math.round(r.avg), 0)} rata-rata per bulan`,
                            secondary: `(${r.links} link di ${r.branches} cabang · ${fmtNum(r.mbps, 0)} Mbps)`,
                            meta: `Termahal Rp ${fmtNum(r.hi, 0)} · termurah Rp ${fmtNum(r.lo, 0)}`,
                            tone: "blue",
                          },
                          "none",
                        )
                      }
                      onMouseMove={(e) => tipMove(e)}
                      onMouseLeave={() => tipLeave()}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        cursor: "default",
                        outline: "none",
                      }}
                    >
                      {r.vendor}
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "9.5px",
                          fontWeight: 800,
                          color: "var(--text-placeholder)",
                          flexShrink: 0,
                        }}
                      >
                        {r.links}L
                      </span>
                    </span>
                  </td>

                  {/* 12 Months Cells */}
                  {r.months.map((c, mi) => {
                    const isHi = c === r.hi;

                    return (
                      <td
                        key={mi}
                        onMouseEnter={(e) =>
                          tipEnter(
                            e,
                            {
                              title: `${r.vendor} · ${TR_MONTHS[mi]}`,
                              primary: `Rp ${fmtNum(Math.round(c), 0)}`,
                              secondary: `(rata-rata provider ini Rp ${fmtNum(Math.round(r.avg), 0)} per bulan)`,
                              meta: isHi ? "Bulan termahal provider ini." : "",
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
                          cursor: "default",
                          outline: "none",
                          background: isHi ? "#FFFBEB" : "transparent",
                          color: isHi ? "#B45309" : "var(--text-secondary)",
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
                    {jt(r.avg)}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Sticky Footer */}
          <tfoot>
            <tr style={{ height: "36px" }}>
              <td
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
                TOTAL ({filteredAndSortedRows.length} provider)
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
        Biaya tiap link dialokasikan ke providernya, jadi total kolom bulan di
        sini sama dengan total pada tabel per cabang.
      </div>
    </SectionCard>
  );
}
