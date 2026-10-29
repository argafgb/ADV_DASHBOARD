"use client";

import React, { useMemo, useState } from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import { tipTone, useHoverTip } from "../../context/TooltipLayer";
import SectionCard, { CardTitle } from "../SectionCard";
import IspDonutChart from "../IspDonutChart";
import TrafficTable, { type TrSort } from "../TrafficTable";
import { useNetworkData } from "../../context/NetworkDataContext";
import { MONTHS } from "../../data/constants";
import { fmtId, fmtNum } from "../../services/format";
import { windowLabel } from "../../services/labels";

export default function IspView() {
  const { tahun, bulan, bulanRange, bulanMonths } = useFilters();
  const { tipEnter, tipMove, tipLeave } = useHoverTip();
  const { isp, trafficService, periods } = useNetworkData();

  const [trQuery, setTrQuery] = useState("");
  const [trFilter, setTrFilter] = useState("all");
  const [trSort, setTrSort] = useState<TrSort>({ key: "dl", dir: "desc" });

  // ---- ISP & Bandwidth (read from source directory, no synthesis) ----
  const dir = isp.directory;
  const rb = isp.redundancyBuckets;
  const missingIsp = dir.activeCount - dir.opCount;

  const trafficMonths = periods.trafficMonthsByYear[tahun] ?? [];
  const trafficRange = windowLabel(
    bulanRange ?? bulan,
    trafficMonths,
    bulanMonths,
  );

  const ispLegend = dir.donutData.map((d) => ({
    name: d.name,
    count: d.count,
    color: d.color,
    pct: Math.round((d.count / dir.ispTotalLinks) * 100) + "%",
    meta: d.vendors
      ? "Vendor: " + d.vendors.join(", ")
      : "Cabang: " +
        d.branches.slice(0, 6).join(", ") +
        (d.branches.length > 6 ? " +" + (d.branches.length - 6) : ""),
  }));

  const redundancyBuckets = [1, 2, 3, 4, 5].map((k) => ({
    n: k,
    count: rb[k].length,
    width: Math.round((rb[k].length / dir.opCount) * 100) + "%",
    color:
      k >= 3
        ? "var(--status-green-fg)"
        : k === 2
          ? "var(--accent)"
          : "var(--status-amber-fg)",
    meta: rb[k].length ? "Cabang: " + rb[k].join(", ") : "Tidak ada",
    tone: k === 1 ? "amber" : k >= 3 ? "green" : "blue",
  }));

  // Utilisasi bandwidth — ambang dan warna persis mockup yang disetujui.
  //
  // Catatan teknis: sumber angkanya adalah speed test (ST_Trx), bukan
  // pengukuran konsumsi jalur. Pemilik dashboard memutuskan tetap memakai
  // istilah dan ambang mockup. Latar belakangnya ada di MEMORY.md §2.3.
  const bwRows = useMemo(() => {
    return trafficService
      .tableRows(tahun, bulanRange ?? bulan)
      .filter((r) => r.measured && r.contract > 0 && r.dl > 0)
      .map((r) => {
        const ratio = r.dl / r.contract;
        const tName = ratio < 0.5 ? "red" : ratio >= 0.8 ? "green" : "blue";
        const tColor =
          ratio < 0.5
            ? "var(--status-red-fg)"
            : ratio >= 0.8
              ? "var(--status-green-fg)"
              : "var(--accent)";
        return {
          branch: r.branch,
          contract: r.contract,
          dl: r.dl,
          label: fmtId(r.dl, 0) + " / " + r.contract,
          actualPct: Math.min(100, ratio * 100) + "%",
          color: tColor,
          util: Math.round(ratio * 100) + "%",
          tone: tName,
        };
      })
      .sort((a, b) => parseFloat(b.util) - parseFloat(a.util));
  }, [trafficService, tahun, bulan, bulanRange]);

  const noDataRows = useMemo(
    () =>
      trafficService
        .tableRows(tahun, bulanRange ?? bulan)
        .filter((r) => !r.measured)
        .map((r) => ({
          branch: r.branch,
          contract: r.contract > 0 ? r.contract + " Mbps" : "—",
        }))
        .sort((a, b) => a.branch.localeCompare(b.branch)),
    [trafficService, tahun, bulan, bulanRange],
  );

  // Trafik aktual — seluruh cabang aktif dengan search, filter, sort
  const tr = useMemo(() => {
    const allTr = trafficService.tableRows(tahun, bulanRange ?? bulan);
    const measuredTr = allTr.filter((r) => r.measured);
    const warnA = allTr.filter((r) => r.warnA);
    const warnB = allTr.filter((r) => r.warnB);
    const noDataTr = allTr.filter((r) => !r.measured);
    const med = (arr: number[]) => {
      const x = arr.slice().sort((p, q) => p - q);
      return x[Math.floor(x.length / 2)];
    };
    const uls = measuredTr.map((r) => r.ul);
    const dls = measuredTr.map((r) => r.dl);
    const anyData = measuredTr.length > 0;
    const meanUL = anyData ? uls.reduce((p, c) => p + c, 0) / uls.length : 0;
    const meanDL = anyData ? dls.reduce((p, c) => p + c, 0) / dls.length : 0;
    const medUL = anyData ? med(uls) : 0;
    const medDL = anyData ? med(dls) : 0;
    const tq = trQuery.trim().toLowerCase();
    let shown = allTr.filter(
      (r) =>
        trFilter === "all" ||
        (trFilter === "measured" && r.measured) ||
        (trFilter === "incomplete" && r.warnA) ||
        (trFilter === "nodata" && !r.measured),
    );
    if (tq)
      shown = shown.filter((r) => r.branch.toLowerCase().indexOf(tq) >= 0);
    const sval = (r: (typeof allTr)[number]) =>
      (
        ({
          no: r.no,
          branch: r.branch,
          prog: r.avgProg,
          ul: r.ul,
          dl: r.dl,
        }) as Record<string, number | string | null>
      )[trSort.key];
    shown = shown.slice().sort((p, q) => {
      const x = sval(p);
      const y = sval(q);
      const c =
        typeof x === "string"
          ? x.localeCompare(y as string)
          : (x as number) - (y as number);
      return trSort.dir === "desc" ? -c : c;
    });
    return {
      allTr,
      measuredTr,
      warnA,
      warnB,
      noDataTr,
      anyData,
      meanUL,
      meanDL,
      medUL,
      medDL,
      shown,
    };
  }, [trafficService, tahun, bulan, bulanRange, trQuery, trFilter, trSort]);

  // "Cabang Bulan" untuk tiap entri yang dikecualikan — menggantikan catatan
  // Manado yang dulu ditulis tangan.
  const anomalyLabels = tr.allTr.flatMap((r) =>
    Object.keys(r.anomalies).map((mi) => r.branch + " " + MONTHS[Number(mi)]),
  );

  const trChips = [
    { k: "all", label: "Semua cabang", n: tr.allTr.length },
    { k: "measured", label: "Terukur", n: tr.measuredTr.length },
    { k: "incomplete", label: "Data tidak lengkap", n: tr.warnA.length },
    { k: "nodata", label: "Tanpa data", n: tr.noDataTr.length },
  ];

  const trRecap = [
    {
      label: "Cabang terukur",
      value: tr.measuredTr.length + " / " + tr.allTr.length,
      tone: "blue",
      tip: {
        title: "Cabang terukur",
        primary: tr.measuredTr.length + " cabang",
        secondary: "(dari " + tr.allTr.length + " cabang pada sumber data)",
        meta: tr.noDataTr.length
          ? "Tanpa pengukuran: " + tr.noDataTr.map((r) => r.branch).join(", ")
          : "Semua cabang terukur",
        tone: "blue",
      },
    },
    {
      label: "Rata-rata UL / DL",
      value: tr.anyData
        ? fmtNum(tr.meanUL, 1) + " / " + fmtNum(tr.meanDL, 1)
        : "—",
      tone: "blue",
      tip: {
        title: "Rata-rata UL / DL",
        primary: fmtNum(tr.meanUL, 1) + " / " + fmtNum(tr.meanDL, 1) + " Mbps",
        secondary:
          "(median " +
          fmtNum(tr.medUL, 1) +
          " / " +
          fmtNum(tr.medDL, 1) +
          " Mbps)",
        meta: tr.anyData
          ? "Rata-rata " +
            tr.measuredTr.length +
            " cabang terukur" +
            (anomalyLabels.length
              ? "; entri anomali tidak dihitung (" +
                anomalyLabels.join(" · ") +
                ")"
              : "") +
            "."
          : "Belum ada pengukuran pada tahun ini.",
        tone: "blue",
      },
    },
    {
      label: "Data tidak lengkap",
      value: String(tr.warnA.length),
      tone: "amber",
      tip: {
        title: "Data tidak lengkap",
        primary: tr.warnA.length + " cabang",
        secondary: "(AVG Progress di bawah 20%)",
        meta: tr.warnA
          .map((r) => r.branch + " " + fmtNum(r.avgProg as number) + "%")
          .join(" · "),
        tone: "amber",
      },
    },
    {
      label: "Utilisasi rendah",
      value: String(tr.warnB.length),
      tone: "blue",
      tip: {
        title: "Utilisasi rendah",
        primary: tr.warnB.length + " cabang",
        secondary: "(AVG DL < 20% dari bandwidth kontrak)",
        meta: tr.warnB.length
          ? tr.warnB
              .map(
                (r) =>
                  r.branch +
                  " " +
                  Math.round(r.utilPct as number) +
                  "% dari " +
                  r.contract +
                  " Mbps",
              )
              .join(" · ")
          : "Tidak ada cabang di bawah ambang 20%.",
        tone: "blue",
      },
    },
  ];

  const trPeriod = trafficMonths.length
    ? trafficRange + " " + tahun + " terukur"
    : "Belum ada periode pengukuran " + tahun;

  const legendSquare = (color: string, label: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "2px",
          background: color,
        }}
      />
      {label}
    </span>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--gap-section)",
      }}
    >
      <div
        className="network-two-column-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--gap-grid)",
          alignItems: "stretch",
        }}
      >
        <SectionCard>
          <CardTitle
            title="Links by ISP Vendor"
            subtitle={
              dir.ispTotalLinks +
              " link di " +
              dir.opCount +
              " cabang" +
              (missingIsp > 0
                ? " · " + missingIsp + " cabang belum ada datanya"
                : "")
            }
            subtitleMarginBottom="16px"
          />
          <div
            className="network-donut-layout"
            style={{ display: "flex", alignItems: "center", gap: "26px" }}
          >
            <IspDonutChart data={dir.donutData} total={dir.ispTotalLinks} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--fs-2xl)",
                    fontWeight:
                      "var(--fw-black)" as React.CSSProperties["fontWeight"],
                    color: "var(--text-primary)",
                  }}
                >
                  {dir.avgLinks}
                </span>
                <span
                  style={{
                    fontSize: "var(--fs-sm-plus)",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  rata-rata link per cabang
                </span>
              </div>
              <div
                className="network-isp-legend-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "9px 22px",
                }}
              >
                {ispLegend.map((v) => (
                  <div
                    key={v.name}
                    onMouseEnter={(e) =>
                      tipEnter(
                        e,
                        {
                          title: v.name,
                          primary: v.count + " link",
                          secondary:
                            "(" +
                            v.count +
                            " dari " +
                            dir.ispTotalLinks +
                            " link)",
                          meta: v.meta,
                          tone: "blue",
                        },
                        "none",
                      )
                    }
                    onMouseMove={(e) => tipMove(e)}
                    onMouseLeave={() => tipLeave()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      cursor: "default",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "3px",
                        background: v.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: "var(--fs-md-minus)",
                        fontWeight:
                          "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {v.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "var(--fs-md-minus)",
                        fontWeight:
                          "var(--fw-black)" as React.CSSProperties["fontWeight"],
                        color: "var(--text-primary)",
                      }}
                    >
                      {v.count}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-placeholder)",
                        width: "38px",
                        textAlign: "right",
                      }}
                    >
                      {v.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard style={{ display: "flex", flexDirection: "column" }}>
          <CardTitle
            title="Link Redundancy Distribution"
            subtitle="Jumlah cabang menurut banyaknya link"
            subtitleMarginBottom="18px"
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "13px",
            }}
          >
            {redundancyBuckets.map((r) => (
              <div
                key={r.n}
                onMouseEnter={(e) =>
                  tipEnter(
                    e,
                    {
                      title: r.n + " link per cabang",
                      primary: r.count + " cabang",
                      secondary:
                        "(" + r.count + " dari " + dir.opCount + " cabang)",
                      meta: r.meta,
                      tone: r.tone,
                    },
                    "none",
                  )
                }
                onMouseMove={(e) => tipMove(e)}
                onMouseLeave={() => tipLeave()}
                style={{ cursor: "default" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-md-minus)",
                      fontWeight:
                        "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
                      color: "var(--text-secondary)",
                    }}
                  >
                    {r.n} link
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-md-minus)",
                      fontWeight:
                        "var(--fw-black)" as React.CSSProperties["fontWeight"],
                      color: "var(--text-primary)",
                    }}
                  >
                    {r.count} cabang
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "var(--chart-gray-track)",
                    borderRadius: "999px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "999px",
                      background: r.color,
                      width: r.width,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div
          className="network-card-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <CardTitle
            title="Actual vs contracted bandwidth"
            subtitle={
              "AVG DL " +
              trafficRange +
              " " +
              tahun +
              " dibandingkan dengan total kontrak (Mbps) · diurutkan dari utilisasi tertinggi"
            }
          />
          <div style={{ display: "flex", gap: "16px" }}>
            {legendSquare("var(--status-red-fg)", "Under-utilized (<50%)")}
            {legendSquare("var(--accent)", "Normal (50%–80%)")}
            {legendSquare("var(--status-green-fg)", "Fully utilized (80%+)")}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {bwRows.map((x) => (
            <div
              key={x.branch}
              onMouseEnter={(e) =>
                tipEnter(
                  e,
                  {
                    title: x.branch,
                    primary: x.util + " terpakai",
                    secondary:
                      "(AVG DL " +
                      fmtId(x.dl, 1) +
                      " Mbps / kontrak " +
                      x.contract +
                      " Mbps)",
                    meta:
                      isp.vendorsOf(x.branch) +
                      " · " +
                      isp.contractSplit(x.branch),
                    tone: x.tone,
                  },
                  "none",
                )
              }
              onMouseMove={(e) => tipMove(e)}
              onMouseLeave={() => tipLeave()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                cursor: "default",
              }}
            >
              <div
                style={{
                  width: "120px",
                  flexShrink: 0,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {x.branch}
              </div>
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  height: "16px",
                  background: "var(--chart-gray-track)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: x.actualPct,
                    background: x.color,
                    borderRadius: "999px",
                    transition: "width .5s ease",
                  }}
                />
              </div>
              <div
                style={{
                  width: "52px",
                  flexShrink: 0,
                  textAlign: "right",
                  fontFamily: "var(--font-display)",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: x.color,
                }}
              >
                {x.util}
              </div>
              <div
                style={{
                  width: "96px",
                  flexShrink: 0,
                  textAlign: "right",
                  fontFamily: "var(--font-display)",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {x.label}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-placeholder)",
            marginTop: "16px",
            lineHeight: 1.4,
          }}
        >
          {tr.noDataTr.length > 0
            ? tr.noDataTr.length +
              " dari " +
              tr.allTr.length +
              " cabang belum terukur — angka utilisasi di atas mewakili " +
              bwRows.length +
              " cabang."
            : "Seluruh " + bwRows.length + " cabang terukur pada periode ini."}
        </div>
      </SectionCard>

      <SectionCard>
        <CardTitle
          title="Branches Without Measurement Data"
          subtitle={
            "Cabang tanpa hasil uji sepanjang " +
            (trafficMonths.length ? trafficRange + " " : "") +
            tahun +
            " — belum terukur, bukan berarti tidak aktif"
          }
          subtitleMarginBottom="14px"
        />
        <div
          className="network-recap-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "10px",
          }}
        >
          {noDataRows.map((n) => (
            <div
              key={n.branch}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "11px 13px",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-base)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                  }}
                >
                  {n.branch}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-placeholder)",
                    marginTop: "2px",
                  }}
                >
                  Kontrak: {n.contract}
                </div>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: "999px",
                  background: "var(--status-gray-bg)",
                  color: "var(--status-gray-fg)",
                  whiteSpace: "nowrap",
                }}
              >
                Belum terukur
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "14px",
          }}
        >
          <CardTitle
            title="Actual Traffic by Branch"
            subtitle={
              "Progres pengukuran dan trafik UL/DL per bulan · " +
              trPeriod +
              " · " +
              tr.shown.length +
              " dari " +
              tr.allTr.length +
              " cabang ditampilkan"
            }
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <input
              value={trQuery}
              onChange={(e) => setTrQuery(e.target.value)}
              placeholder="Cari cabang"
              style={{
                width: "190px",
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

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            margin: "0 0 16px",
            padding: "12px 0",
            borderTop: "1px solid var(--border-subtle)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {trRecap.map((f, i) => (
            <div
              key={f.label}
              onMouseEnter={(e) => tipEnter(e, f.tip, "none")}
              onMouseMove={(e) => tipMove(e)}
              onMouseLeave={() => tipLeave()}
              style={{
                flex: 1,
                padding: "0 18px",
                borderLeft: i === 0 ? "none" : "1px solid var(--border-subtle)",
                cursor: "default",
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
                {f.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  marginTop: "4px",
                  color: tipTone(f.tone),
                }}
              >
                {f.value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          {trChips.map((c) => {
            const active = trFilter === c.k;
            return (
              <button
                key={c.k}
                onClick={() => setTrFilter(c.k)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "30px",
                  padding: "0 13px",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "999px",
                  background: active ? "var(--accent)" : "#fff",
                  color: active ? "#fff" : "var(--text-secondary)",
                  border:
                    "1px solid " +
                    (active ? "var(--accent)" : "var(--border-default)"),
                }}
              >
                {c.label}{" "}
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    opacity: 0.75,
                  }}
                >
                  {c.n}
                </span>
              </button>
            );
          })}
        </div>
        {!tr.anyData && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "11px 14px",
              marginBottom: "12px",
              border: "1px solid var(--border-default)",
              borderLeft: "3px solid var(--status-amber-fg)",
              borderRadius: "var(--radius-base)",
              background: "var(--status-amber-bg)",
            }}
          >
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "var(--status-amber-fg)",
              }}
            >
              Belum ada data pengukuran {String(tahun)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {periods.years.length > 1
                ? "Pilih tahun " +
                  periods.years.filter((y) => y !== tahun).join(" atau ") +
                  " untuk melihat hasil pengukuran — kolom bulan ditampilkan kosong."
                : "Sumber pengukuran belum memuat tahun ini — kolom bulan ditampilkan kosong."}
            </span>
          </div>
        )}
        <TrafficTable rows={tr.shown} trSort={trSort} onSort={setTrSort} />
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-placeholder)",
            marginTop: "12px",
            lineHeight: 1.45,
          }}
        >
          Kolom No, Cabang, Progress, AVG UL/DL, dan Status dibekukan; kolom
          bulan digeser ke samping. Baris total menjumlahkan seluruh cabang yang
          sedang tampil.
          {anomalyLabels.length > 0 && (
            <>
              {" "}
              {anomalyLabels.length === 1
                ? "Entri"
                : anomalyLabels.length + " entri"}{" "}
              ditandai anomali dan tidak ikut dijumlahkan (
              {anomalyLabels.join(" · ")}).
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
