"use client";

import React, { useMemo, useState } from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import { monthInRange } from "@/lib/network/month-range";
import KpiCard from "../KpiCard";
import SectionCard, { CardTitle } from "../SectionCard";
import SlaTrendChart from "../SlaTrendChart";
import TopCausesCard from "../TopCausesCard";
import RedundancyExposureCard from "../RedundancyExposureCard";
import BranchStatusMapCard from "../BranchStatusMapCard";
import BelowSlaModal from "../modals/BelowSlaModal";
import CoverageModal from "../modals/CoverageModal";
import EmptyYearNotice from "../EmptyYearNotice";
import { CAUSE_COLORS } from "../../data/colors";
import { useNetworkData } from "../../context/NetworkDataContext";
import { periodLabel } from "../../services/labels";
import { fmtDur } from "../../services/format";

export default function OverviewView() {
  const { tahun, bulan, bulanRange, bulanMonths, scope } = useFilters();
  const { sla, incidents, ispLinks, periods, trafficService } =
    useNetworkData();
  const [showBelowModal, setShowBelowModal] = useState(false);
  const [showCoverageModal, setShowCoverageModal] = useState(false);

  // Nearest earlier year that has data. With a single year loaded there is
  // nothing to compare against, and the UI says so rather than inventing a
  // delta against a year that does not exist.
  const compareYear = useMemo(
    () => periods.slaYears.filter((y) => y < tahun).pop() ?? null,
    [periods.slaYears, tahun],
  );

  // Traffic reaches further back than SLA, so its comparison year is its own.
  const trafficCompareYear = useMemo(
    () =>
      Object.keys(periods.trafficMonthsByYear)
        .map(Number)
        .filter((y) => y < tahun)
        .sort((a, b) => a - b)
        .pop() ?? null,
    [periods.trafficMonthsByYear, tahun],
  );

  // Monitoring coverage — the prototype's own rule, not a new invention: a
  // branch counts as measured once any speed test ran (progress_pct > 0), and
  // below 20% the readings are too thin to trust. Its hardcoded "32 of 40"
  // matches what the real data gives at that threshold.
  const cov = useMemo(() => {
    const rows = trafficService.tableRows(tahun, bulanRange ?? bulan);
    const prev =
      trafficCompareYear != null
        ? trafficService.tableRows(trafficCompareYear).filter((r) => r.measured)
            .length
        : null;
    const measured = rows.filter((r) => r.measured).length;
    const total = rows.length;
    const regionOf = new Map(sla.branches.map((b) => [b.name, b.region]));
    return {
      measured,
      total,
      pct: total > 0 ? Math.round((measured / total) * 100) : null,
      incomplete: rows.filter((r) => r.warnA).length,
      diffPt:
        prev != null && total > 0
          ? Math.round(((measured - prev) / total) * 100)
          : null,
      unmeasured: rows
        .filter((r) => !r.measured)
        .map((r) => ({
          name: r.branch,
          region: regionOf.get(r.branch) ?? "—",
        })),
    };
  }, [trafficService, sla, tahun, bulan, bulanRange, trafficCompareYear]);

  const d = useMemo(() => {
    const win = sla.activeMonths(tahun, bulanRange ?? bulan, bulanMonths);
    const scoped = sla.scopeBranches(scope);

    const avgCur = sla.avgSLA(tahun, win, scoped);
    const avgPrev =
      compareYear != null
        ? sla.avgSLA(
            compareYear,
            sla.activeMonths(compareYear, bulanRange ?? bulan, bulanMonths),
            scoped,
          )
        : null;
    const avgUp = (avgCur ?? -1) >= (avgPrev ?? -1);
    const avgDelta =
      avgCur != null && avgPrev != null ? Math.abs(avgCur - avgPrev) : null;

    const winCompare =
      compareYear != null
        ? sla.activeMonths(compareYear, bulanRange ?? bulan, bulanMonths)
        : [];
    const belowCur = sla.belowUniqueBranches(tahun, win, scoped).length;
    const belowPrev =
      compareYear != null
        ? sla.belowUniqueBranches(compareYear, winCompare, scoped).length
        : null;
    const belowBetter = belowPrev == null ? true : belowCur <= belowPrev;
    const belowDiff = belowPrev == null ? null : Math.abs(belowCur - belowPrev);

    const scopeSet = new Set(scoped.map((b) => b.name));
    // Period-scoped, like every other figure on this page: "Top causes" and the
    // reason shown against a below-target branch must describe the window the
    // user selected, not the whole dataset.
    const incidentsF = incidents.filter(
      (dt) =>
        scopeSet.has(dt.site) &&
        dt.year === tahun &&
        (bulanMonths != null
          ? dt.month != null && bulanMonths.includes(dt.month)
          : monthInRange(dt.month, bulan)),
    );

    const topCauses = (() => {
      const m: Record<string, { label: string; count: number; code: string }> =
        {};
      incidentsF.forEach((dt) => {
        const e = (m[dt.cause] = m[dt.cause] || {
          label: dt.cause,
          count: 0,
          code: dt.causeCode,
        });
        e.count++;
      });
      const arr = Object.values(m)
        .map((x) => ({
          label: x.label,
          count: x.count,
          color: CAUSE_COLORS[x.code] || "#6B7280",
        }))
        .sort((a, b) => b.count - a.count);
      const mx = Math.max(1, ...arr.map((a) => a.count));
      return arr.map((a) => ({
        ...a,
        width: Math.round((a.count / mx) * 100) + "%",
      }));
    })();

    const belowMonths = sla.belowMonthsGrouped(tahun, win, scoped);
    const belowGroups = belowMonths.map((bm) => {
      const rows = bm.branches.map((x) => {
        const branchIncidents = incidents.filter(
          (dt) =>
            dt.site === x.b.name &&
            dt.year === tahun &&
            dt.month === bm.month,
        );
        const totalMinutes = branchIncidents.reduce(
          (sum, inc) => sum + inc.durationMinutes,
          0,
        );
        return {
          name: x.b.name,
          sla: x.v.toFixed(2) + "%",
          region: x.b.region,
          reason: branchIncidents[0]?.problem ?? "—",
          totalDurationMinutes: totalMinutes,
          totalDurasi: fmtDur(totalMinutes),
          incidents: branchIncidents.map((i) => ({
            id: i.id,
            problem: i.problem,
            downtimeStart: i.downtimeStart,
            uptimeEnd: i.uptimeEnd,
            durationMinutes: i.durationMinutes,
            durasi: i.durasi,
          })),
        };
      });
      return {
        monthIndex: bm.month,
        monthName: bm.monthName,
        rows,
      };
    });
    const belowBranches = belowGroups.flatMap((g) => g.rows);

    // Redundancy & ISP exposure — from the full link directory.
    const linkCounts = Object.keys(ispLinks).map((k) => ({
      name: k,
      n: ispLinks[k].length,
      vendor: ispLinks[k][0]?.v ?? "—",
    }));
    const dualCount = linkCounts.filter((x) => x.n >= 2).length;
    const singleCount = linkCounts.filter((x) => x.n < 2).length;
    const totalLinks = linkCounts.reduce((a, x) => a + x.n, 0);
    const branchesWithIspData = linkCounts.length;

    // Structural exposure and realised failure are different facts. The card
    // used to require both, which is the smallest possible set — and with real
    // data it is empty, because neither single-link branch has ever failed.
    //
    // "nodata" is a coverage gap, not a confirmed risk: those branches may
    // well have links that simply are not recorded yet.
    //
    // Deliberately NOT period-filtered, unlike incidentsF above. This card
    // describes structural risk — how many links a branch has, and whether it
    // has ever failed on one. A branch is not less exposed in a month it
    // happened not to break, so scoping it to the filter would make the tier
    // flicker as the user changes month.
    const incidentsPerBranch = new Map<string, number>();
    incidents.forEach((i) =>
      incidentsPerBranch.set(i.site, (incidentsPerBranch.get(i.site) ?? 0) + 1),
    );
    const tierRank = { critical: 0, warning: 1, nodata: 2 } as const;
    const exposureRows = sla.branches
      .map((b) => {
        const links = ispLinks[b.name]?.length ?? 0;
        if (links > 1) return null;
        const n = incidentsPerBranch.get(b.name) ?? 0;
        const tier =
          links === 0 ? "nodata" : n > 0 ? "critical" : ("warning" as const);
        return {
          name: b.name,
          vendor: links ? ispLinks[b.name][0].v : "—",
          links,
          incidents: n,
          tier: tier as "critical" | "warning" | "nodata",
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .sort(
        (a, b) =>
          tierRank[a.tier] - tierRank[b.tier] ||
          b.incidents - a.incidents ||
          a.name.localeCompare(b.name),
      );

    return {
      avgCur,
      avgUp,
      avgDelta,
      belowCur,
      belowBetter,
      belowDiff,
      topCauses,
      belowBranches,
      belowGroups,
      totalBranches: sla.branches.length,
      branchesWithIspData,
      dualCount,
      singleCount,
      totalLinks,
      exposureRows,
    };
  }, [
    sla,
    incidents,
    ispLinks,
    tahun,
    bulan,
    bulanRange,
    bulanMonths,
    scope,
    compareYear,
  ]);

  const monthsInYear = periods.monthsByYear[tahun] ?? [];
  const pl = periodLabel(tahun, bulan, scope, monthsInYear, bulanMonths);

  // Traffic runs on its own window — use periodLabel with traffic months so the
  // coverage modal accurately displays the active month filter.
  const covMonths = periods.trafficMonthsByYear[tahun] ?? [];
  const covPeriodLabel = periodLabel(
    tahun,
    bulanRange ?? bulan,
    "Semua cabang",
    covMonths,
    bulanMonths,
  );
  const TARGET = sla.TARGET;

  /**
   * Delta chip.
   *
   * With a comparison year it reads "↑ 0.12 pt vs 2025". Without one it names
   * the year being shown instead of an em dash, so the chip still says
   * something true — SLA has no 2025, and a bare "—" left the card looking
   * broken rather than uncompared.
   */
  const deltaChip = (
    value: string | null,
    better: boolean,
    compareTo: number | null,
    opts: { onDark?: boolean; downIsBetter?: boolean } = {},
  ) => {
    const { onDark = false, downIsBetter = false } = opts;
    if (value == null || compareTo == null) {
      return {
        arrow: "",
        text: String(tahun),
        bg: onDark ? "rgba(255,255,255,.18)" : "var(--status-gray-bg)",
        fg: onDark ? "#fff" : "var(--status-gray-fg)",
      };
    }
    // The arrow tracks the direction the number moved, the colour tracks
    // whether that is good news. On "branches below target" they disagree:
    // fewer is better, so a drop is green.
    const rose = downIsBetter ? !better : better;
    return {
      arrow: rose ? "↑" : "↓",
      text: value + " vs " + compareTo,
      bg: onDark
        ? "rgba(255,255,255,.18)"
        : better
          ? "var(--chart-green-chip)"
          : "var(--chart-red-chip)",
      fg: onDark
        ? "#fff"
        : better
          ? "var(--status-green-fg)"
          : "var(--status-red-fg)",
    };
  };
  const chevron = (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
  const linkFooter = (text: string) => (
    <div
      style={{
        marginTop: "8px",
        fontSize: "var(--fs-sm-plus)",
        color: "var(--accent)",
        fontWeight: "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {text}
      {chevron}
    </div>
  );

  // Every tile here reads SLA. Rendering them for a year with no reports would
  // show six blanks with nothing to explain them.
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
        className="network-kpi-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "var(--gap-kpi)",
        }}
      >
        {(() => {
          const isAvgAbove = d.avgCur != null && d.avgCur >= TARGET;
          const isAvgBelow = d.avgCur != null && d.avgCur < TARGET;
          const avgStatusText = isAvgAbove
            ? "Achieved"
            : isAvgBelow
              ? "Not Achieved"
              : null;
          const badgeBg = isAvgAbove
            ? "var(--status-green-bg)"
            : isAvgBelow
              ? "var(--status-red-bg)"
              : "var(--status-gray-bg)";
          const badgeFg = isAvgAbove
            ? "var(--status-green-fg)"
            : isAvgBelow
              ? "var(--status-red-fg)"
              : "var(--status-gray-fg)";
          const valueColor = isAvgAbove
            ? "var(--status-green-fg)"
            : isAvgBelow
              ? "var(--status-red-fg)"
              : "var(--text-primary)";

          return (
            <KpiCard
              icon={
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
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
              }
              iconBg="color-mix(in srgb, var(--accent) 12%, white)"
              iconFg="var(--accent)"
              delta={deltaChip(
                d.avgDelta == null ? null : d.avgDelta.toFixed(2) + " pt",
                d.avgUp,
                compareYear,
              )}
              label={
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>Average Network SLA</span>
                  <span>·</span>
                  {avgStatusText && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-pill)",
                        fontSize: "var(--fs-xs)",
                        fontWeight:
                          "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
                        backgroundColor: badgeBg,
                        color: badgeFg,
                        lineHeight: 1.2,
                      }}
                    >
                      {avgStatusText}
                    </span>
                  )}
                </div>
              }
              value={
                d.avgCur != null ? (
                  <span style={{ color: valueColor }}>
                    {d.avgCur.toFixed(2)}%
                  </span>
                ) : (
                  "—"
                )
              }
              footer={
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "var(--fs-sm-plus)",
                    color: "var(--text-muted)",
                  }}
                >
                  Target {TARGET.toFixed(1)}% · {pl}
                </div>
              }
            />
          );
        })()}

        <KpiCard
          icon={
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
              <path d="M12 2 1 21h22L12 2Z" />
              <path d="M12 9v5M12 17h.01" />
            </svg>
          }
          iconBg="color-mix(in srgb, var(--status-amber-fg) 9%, white)"
          iconFg="var(--status-amber-fg)"
          delta={deltaChip(
            d.belowDiff == null ? null : String(d.belowDiff),
            d.belowBetter,
            compareYear,
            { downIsBetter: true },
          )}
          label="Branches Below SLA Target"
          value={d.avgCur != null ? d.belowCur : "-"}
          footer={linkFooter("Lihat daftar cabang")}
          onClick={() => setShowBelowModal(true)}
        />

        <KpiCard
          icon={
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
          iconBg="var(--accent-tint)"
          iconFg="var(--accent)"
          delta={deltaChip(
            cov.diffPt == null ? null : Math.abs(cov.diffPt) + " pt",
            (cov.diffPt ?? 0) >= 0,
            trafficCompareYear,
          )}
          label="Monitoring Coverage"
          value={cov.pct != null ? cov.pct + "%" : "—"}
          footer={linkFooter(
            cov.measured + " / " + cov.total + " cabang terukur",
          )}
          onClick={() => setShowCoverageModal(true)}
        />
      </div>

      <SectionCard accent>
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
            title="SLA Performance"
            subtitle={
              "Rata-rata SLA jaringan bulanan · " +
              (compareYear != null
                ? compareYear + " vs " + tahun
                : String(tahun))
            }
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              paddingTop: "4px",
            }}
          >
            {compareYear != null && (
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
                    width: "20px",
                    height: 0,
                    borderTop: "2px dashed #F59E0B",
                    display: "inline-block",
                  }}
                />
                {String(compareYear)}
              </span>
            )}
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
                  width: "20px",
                  height: "3px",
                  background: "var(--accent)",
                  display: "inline-block",
                  borderRadius: "2px",
                }}
              />
              {String(tahun)}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-muted)",
              }}
            >
              <span
                style={{
                  width: "20px",
                  height: 0,
                  borderTop: "2px dashed #DC2626",
                  display: "inline-block",
                }}
              />
              Target {TARGET.toFixed(1)}%
            </span>
          </div>
        </div>
        <SlaTrendChart tahun={tahun} compareYear={compareYear} />
      </SectionCard>

      <div
        className="network-two-column-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--gap-grid)",
          alignItems: "stretch",
        }}
      >
        <TopCausesCard tahunLabel={String(tahun)} rows={d.topCauses} />
        <RedundancyExposureCard
          totalLinks={d.totalLinks}
          covTotal={d.totalBranches}
          withIspData={d.branchesWithIspData}
          dualCount={d.dualCount}
          singleCount={d.singleCount}
          exposureRows={d.exposureRows}
        />
      </div>

      <BranchStatusMapCard title="Branch Status Distribution" view="overview" />

      {showBelowModal && (
        <BelowSlaModal
          groups={d.belowGroups}
          uniqueBranchCount={d.belowCur}
          rows={d.belowBranches}
          periodLabel={pl}
          onClose={() => setShowBelowModal(false)}
        />
      )}
      {showCoverageModal && (
        <CoverageModal
          rows={cov.unmeasured}
          periodLabel={covPeriodLabel}
          onClose={() => setShowCoverageModal(false)}
        />
      )}
    </div>
  );
}
