"use client";

import React, { useMemo } from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import { useHoverTip } from "../../context/TooltipLayer";
import SectionCard, { CardTitle } from "../SectionCard";
import SlaComparisonBarChart from "../SlaComparisonBarChart";
import LatencyComparisonBarChart from "../LatencyComparisonBarChart";
import SlaWeeklyHeatmap from "../SlaWeeklyHeatmap";
import BranchStatusMapCard from "../BranchStatusMapCard";
import EmptyYearNotice from "../EmptyYearNotice";
import { useNetworkData } from "../../context/NetworkDataContext";
import { periodLabel, windowLabel } from "../../services/labels";

export default function SlaView() {
  const { tahun, bulan, bulanRange, bulanMonths, scope } = useFilters();
  const { sla, incidents, periods } = useNetworkData();
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  const compareYear = tahun - 1;

  const monthsInYear = useMemo(
    () => periods.monthsByYear[tahun] ?? [],
    [periods.monthsByYear, tahun],
  );

  const d = useMemo(() => {
    const win = sla.activeMonths(tahun, bulanRange ?? bulan, bulanMonths);
    const winLabel = windowLabel(bulan, monthsInYear, bulanMonths);
    const winCount = win.length;
    const scoped = sla.scopeBranches(scope);
    const scMapped = scoped.filter((b) => b.district);
    const winCompare = sla.activeMonths(
      compareYear,
      bulanRange ?? bulan,
      bulanMonths,
    );
    const sameYear = compareYear === tahun;

    const belowCur = sla.belowUniqueBranches(tahun, win, scoped).length;
    const belowPrev = sla.belowUniqueBranches(
      compareYear,
      winCompare,
      scoped,
    ).length;
    const belowBetter = belowCur <= belowPrev;

    const belowMappedCur = sla.belowUniqueBranches(tahun, win, scMapped).length;
    const belowMappedPrev = sla.belowUniqueBranches(
      compareYear,
      winCompare,
      scMapped,
    ).length;
    const geCur = scMapped.length - belowMappedCur;
    const gePrev = scMapped.length - belowMappedPrev;
    const geBetter = geCur >= gePrev;

    const belowMonths = sla.belowMonthsGrouped(tahun, win, scoped);
    const belowBranches = belowMonths.flatMap((bm) =>
      bm.branches.map((x) => {
        const dt = incidents.find(
          (i) =>
            i.site === x.b.name &&
            i.year === tahun &&
            i.month === bm.month,
        );
        return {
          monthIndex: bm.month,
          monthName: bm.monthName,
          name: x.b.name,
          sla: x.v.toFixed(2) + "%",
          region: x.b.region,
          reason: dt ? dt.problem : "—",
        };
      }),
    );

    return {
      winLabel,
      winCount,
      geCur,
      gePrev,
      geBetter,
      geDiff: Math.abs(geCur - gePrev),
      belowCur,
      belowPrev,
      belowBetter,
      belowBranches,
      totalMapped: scMapped.length,
      sameYear,
    };
  }, [
    sla,
    incidents,
    tahun,
    bulan,
    bulanRange,
    bulanMonths,
    scope,
    compareYear,
    monthsInYear,
  ]);

  const pl = periodLabel(tahun, bulan, scope, monthsInYear, bulanMonths);
  const TARGET = sla.TARGET;
  const hasCompareData = periods.slaYears.includes(compareYear) && !d.sameYear;
  const slaVsText = hasCompareData
    ? "vs " + d.winLabel + " " + compareYear
    : "";

  const deltaChip = (
    arrow: string,
    text: string,
    better: boolean,
    onEnter: (e: React.MouseEvent) => void,
  ) => {
    if (!hasCompareData) return null;
    return (
      <span
        onMouseEnter={onEnter}
        onMouseMove={(e) => tipMove(e)}
        onMouseLeave={() => tipLeave()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-sm-plus)",
          fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
          padding: "2px 8px",
          borderRadius: "var(--radius-pill)",
          background: better
            ? "var(--chart-green-chip)"
            : "var(--chart-red-chip)",
          color: better ? "var(--status-green-fg)" : "var(--status-red-fg)",
          cursor: "default",
          whiteSpace: "nowrap",
        }}
      >
        {arrow + " " + text}
      </span>
    );
  };

  const kpiIcon = (bgVar: string, path: React.ReactNode) => (
    <span
      style={{
        width: "38px",
        height: "38px",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-base)",
        background: "color-mix(in srgb, " + bgVar + " 9%, white)",
        color: bgVar,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {path}
      </svg>
    </span>
  );

  const heatLegendItem = (style: React.CSSProperties, label: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "11.5px",
        fontWeight: 600,
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{ width: "14px", height: "14px", borderRadius: "4px", ...style }}
      />
      {label}
    </span>
  );

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
      <div
        className="network-sla-summary"
        style={{
          display: "flex",
          gap: "var(--gap-kpi)",
          alignItems: "flex-start",
          minHeight: "158px",
        }}
      >
        <div
          className="network-sla-kpis"
          style={{
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: "276px",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-card)",
              padding: "17px 19px",
              boxShadow: "var(--shadow-card)",
              height: "194px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              {kpiIcon("var(--status-green-fg)", <path d="M20 6 9 17l-5-5" />)}
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-lg-minus)",
                  fontWeight:
                    "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
                  color: "var(--text-muted)",
                  lineHeight: 1.25,
                }}
              >
                Branches min. {TARGET.toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-4xl)",
                fontWeight:
                  "var(--fw-black)" as React.CSSProperties["fontWeight"],
                lineHeight: 1,
                color: "var(--text-primary)",
              }}
            >
              {d.geCur}
              <span
                style={{
                  fontSize: "var(--fs-xl)",
                  color: "var(--text-placeholder)",
                  fontWeight:
                    "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                }}
              >
                {" "}
                / {d.totalMapped}
              </span>
            </div>
            <div
              className="network-kpi-footer"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {deltaChip(
                d.geBetter ? "↑" : "↓",
                d.geDiff + " cabang",
                d.geBetter,
                (e) =>
                  tipEnter(
                    e,
                    {
                      title: "Cabang capai target",
                      primary: d.sameYear
                        ? "Tidak ada tahun pembanding"
                        : (d.geCur - d.gePrev >= 0 ? "+" : "") +
                          (d.geCur - d.gePrev) +
                          " cabang",
                      secondary: d.sameYear
                        ? "(" + d.winLabel + " " + tahun + ": " + d.geCur + ")"
                        : "(" +
                          d.winLabel +
                          " " +
                          tahun +
                          ": " +
                          d.geCur +
                          " vs " +
                          compareYear +
                          ": " +
                          d.gePrev +
                          ")",
                      meta: "Jendela dibandingkan: " + d.winCount + " bulan",
                      tone: d.sameYear ? "gray" : d.geBetter ? "green" : "red",
                    },
                    "rect",
                  ),
              )}
              <span
                style={{
                  fontSize: "var(--fs-sm-plus)",
                  color: "var(--text-placeholder)",
                  whiteSpace: "nowrap",
                }}
              >
                {slaVsText}
              </span>
            </div>
          </div>
          <div
            style={{
              flexShrink: 0,
              width: "279px",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-card)",
              padding: "17px 19px",
              boxShadow: "var(--shadow-card)",
              height: "187px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              {kpiIcon(
                "var(--status-red-fg)",
                <>
                  <path d="M12 2 1 21h22L12 2Z" />
                  <path d="M12 9v5M12 17h.01" />
                </>,
              )}
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-lg-minus)",
                  fontWeight:
                    "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
                  color: "var(--text-muted)",
                  lineHeight: 1.25,
                }}
              >
                Branches Below Target
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-4xl)",
                fontWeight:
                  "var(--fw-black)" as React.CSSProperties["fontWeight"],
                lineHeight: 1,
                color: "var(--status-red-fg)",
              }}
            >
              {d.belowCur}
              <span
                style={{
                  fontSize: "var(--fs-xl)",
                  color: "var(--text-placeholder)",
                  fontWeight:
                    "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                }}
              >
                {" "}
                / {d.totalMapped}
              </span>
            </div>
            <div
              className="network-kpi-footer"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {deltaChip(
                d.belowBetter ? "↓" : "↑",
                Math.abs(d.belowCur - d.belowPrev) + " cabang",
                d.belowBetter,
                (e) =>
                  tipEnter(
                    e,
                    {
                      title: "Cabang di bawah target",
                      primary: d.sameYear
                        ? "Tidak ada tahun pembanding"
                        : (d.belowCur - d.belowPrev >= 0 ? "+" : "") +
                          (d.belowCur - d.belowPrev) +
                          " cabang",
                      secondary: d.sameYear
                        ? "(" +
                          d.winLabel +
                          " " +
                          tahun +
                          ": " +
                          d.belowCur +
                          ")"
                        : "(" +
                          d.winLabel +
                          " " +
                          tahun +
                          ": " +
                          d.belowCur +
                          " vs " +
                          compareYear +
                          ": " +
                          d.belowPrev +
                          ")",
                      meta: "Jendela dibandingkan: " + d.winCount + " bulan",
                      tone: d.sameYear
                        ? "gray"
                        : d.belowBetter
                          ? "green"
                          : "red",
                    },
                    "rect",
                  ),
              )}
              <span
                style={{
                  fontSize: "var(--fs-sm-plus)",
                  color: "var(--text-placeholder)",
                  whiteSpace: "nowrap",
                }}
              >
                {slaVsText}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: "393px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-card)",
            padding: "14px 16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--text-placeholder)",
              textTransform: "uppercase",
              letterSpacing: ".05em",
              fontWeight: 700,
              marginBottom: "8px",
              flexShrink: 0,
            }}
          >
            Below Target · {pl}
          </div>
          <div
            className="nl-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {d.belowBranches.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "18px 4px",
                }}
              >
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "var(--status-green-fg)",
                  }}
                >
                  Semua cabang memenuhi target {TARGET.toFixed(1)}%
                </span>
                <span
                  style={{
                    fontSize: "11.5px",
                    lineHeight: 1.5,
                    color: "var(--text-placeholder)",
                  }}
                >
                  {"Tidak ada cabang di bawah target pada " +
                    d.winLabel +
                    " " +
                    tahun +
                    "."}
                </span>
              </div>
            )}
            {d.belowBranches.map((b) => (
              <div
                key={`${b.name}-${b.monthIndex}`}
                onMouseEnter={(e) =>
                  tipEnter(
                    e,
                    {
                      title: b.name,
                      primary:
                        "SLA " +
                        b.sla +
                        (d.winCount > 1 ? " (" + b.monthName + ")" : ""),
                      secondary:
                        "(" +
                        (d.winCount > 1 ? b.monthName : d.winLabel) +
                        " " +
                        tahun +
                        ")",
                      meta: b.reason,
                      tone: "red",
                    },
                    "none",
                  )
                }
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={() => tipLeave()}
                style={{
                  padding: "5px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight:
                          "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                        color: "var(--text-primary)",
                      }}
                    >
                      {b.name}
                    </span>
                    {d.winCount > 1 && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background:
                            "var(--bg-muted, rgba(148, 163, 184, 0.15))",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.monthName}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "12.5px",
                      fontWeight:
                        "var(--fw-black)" as React.CSSProperties["fontWeight"],
                      color: "var(--status-red-fg)",
                      flexShrink: 0,
                    }}
                  >
                    {b.sla}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-placeholder)",
                    marginTop: "1px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionCard>
        <div
          className="network-card-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <CardTitle
            title={"SLA " + compareYear + " vs " + tahun}
            subtitle={
              "Rata-rata SLA per cabang · " +
              d.winLabel +
              " (jendela dibandingkan) · " +
              sla.mapped().length +
              " cabang · geser untuk melihat semua"
            }
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              paddingTop: "4px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "16px",
                  height: "11px",
                  background: "#475569",
                  borderRadius: "3px",
                  display: "inline-block",
                }}
              />
              {compareYear}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "16px",
                  height: "11px",
                  background: "var(--accent)",
                  borderRadius: "3px",
                  display: "inline-block",
                }}
              />
              {String(tahun)} ({d.winLabel})
            </span>
          </div>
        </div>
        <SlaComparisonBarChart
          tahun={tahun}
          bulan={bulan}
          bulanMonths={bulanMonths}
          compareYear={compareYear}
        />
      </SectionCard>

      <LatencyComparisonBarChart
        tahun={tahun}
        bulan={bulan}
        bulanMonths={bulanMonths}
        compareYear={compareYear}
      />

      <SectionCard>
        <div
          className="network-card-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "14px",
          }}
        >
          <CardTitle
            title="Weekly SLA by Branch"
            subtitle={
              "Matriks " +
              tahun +
              " · terhadap target " +
              TARGET.toFixed(1) +
              "% · nilai mingguan dihitung dari insiden downtime riil"
            }
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexShrink: 0,
              paddingTop: "3px",
            }}
          >
            {heatLegendItem(
              { background: "#D1FAE5", border: "1px solid #065F46" },
              "Capai target",
            )}
            {heatLegendItem(
              { background: "#FEF3C7", border: "1px solid #B45309" },
              "Mendekati",
            )}
            {heatLegendItem(
              { background: "#FEE2E2", border: "1px solid #B91C1C" },
              "Di bawah SLA",
            )}
            {heatLegendItem(
              {
                background: "var(--bg-page)",
                border: "1px solid var(--border-default)",
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(17,24,39,.14) 0 3px, transparent 3px 6px)",
              },
              "Tanpa data",
            )}
          </div>
        </div>
        <SlaWeeklyHeatmap tahun={tahun} />
      </SectionCard>

      <BranchStatusMapCard
        title="Branch Distribution Map"
        subtitleSuffix=" · klik region untuk memfilter peta"
        view="sla"
      />
    </div>
  );
}
