"use client";

import React from "react";
import { useHoverTip } from "../context/TooltipLayer";
import type { TipData } from "../context/TooltipLayer";
import { TR_MONTHS } from "../data/constants";
import { fmtNum, progTone } from "../services/format";
import type { TrafficTableRow } from "../services/trafficService";

export interface TrSort {
  key: string;
  dir: "asc" | "desc";
}

const NUM = "var(--font-display)";
// Geometri frozen column — persis trafficTableEl() sumber.
const MW = 52;
const LW = [34, 118, 96];
const RW = [58, 58, 124];
const L = [0, LW[0], LW[0] + LW[1]];
const R = [RW[2] + RW[1], RW[2], 0];
const FB = "#F3F6FB";

type Side = "l" | "r";

function frz(
  side: Side,
  off: number,
  bg: string,
  z: number,
): React.CSSProperties {
  return {
    position: "sticky",
    left: side === "l" ? off + "px" : undefined,
    right: side === "r" ? off + "px" : undefined,
    background: bg,
    zIndex: z,
    // Sel sticky dipromosikan ke compositing layer sendiri; tanpa ini
    // Chromium meninggalkan artefak piksel basi saat scroll horizontal.
    willChange: "transform",
    boxShadow:
      side === "l" && off === L[2]
        ? "1px 0 0 var(--border-default)"
        : side === "r" && off === R[0]
          ? "-1px 0 0 var(--border-default)"
          : undefined,
  };
}

const toneChip = (k: string): { bg: string; fg: string } =>
  (
    ({
      amber: { bg: "#FEF3C7", fg: "#B45309" },
      blue: { bg: "#DBEAFE", fg: "#1D4ED8" },
      red: { bg: "#FEE2E2", fg: "#B91C1C" },
      gray: { bg: "#F1F3F7", fg: "#6B7280" },
    }) as Record<string, { bg: string; fg: string }>
  )[k];

/** Tabel "Trafik aktual per cabang" — frozen kolom kiri/kanan + total sticky. */
export default function TrafficTable({
  rows,
  trSort,
  onSort,
}: {
  rows: TrafficTableRow[];
  trSort: TrSort;
  onSort: (s: TrSort) => void;
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  const tip = (o: TipData) => ({
    onMouseEnter: (e: React.MouseEvent) => tipEnter(e, o, "rect"),
    onMouseMove: (e: React.MouseEvent) => tipMove(e),
    onMouseLeave: () => tipLeave(),
  });

  interface ThOpts {
    k?: string;
    sortKey?: string;
    align?: "left" | "right" | "center";
    row2?: boolean;
    sep?: boolean;
    frz?: Side;
    off?: number;
    colSpan?: number;
    rowSpan?: number;
  }
  const th = (label: string, o: ThOpts) => {
    const active = trSort.key === o.sortKey;
    const st: React.CSSProperties = {
      top: o.row2 ? "26px" : "0",
      background: "#fff",
      padding: "0 5px 7px",
      textAlign: o.align || "left",
      fontSize: "9.5px",
      fontWeight: 700,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: active ? "var(--accent)" : "var(--text-placeholder)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      cursor: o.sortKey ? "pointer" : "default",
      borderBottom: "1px solid var(--border-default)",
      borderLeft: o.sep ? "1px solid var(--border-subtle)" : "none",
      ...(o.frz != null
        ? frz(o.frz, o.off as number, "#fff", 6)
        : {
            position: "sticky" as const,
            zIndex: 5,
            willChange: "transform" as const,
          }),
    };
    return (
      <th
        key={o.k || label}
        colSpan={o.colSpan || 1}
        rowSpan={o.rowSpan || 1}
        onClick={
          o.sortKey
            ? () =>
                onSort({
                  key: o.sortKey as string,
                  dir: active && trSort.dir === "desc" ? "asc" : "desc",
                })
            : undefined
        }
        style={st}
      >
        {label + (active ? (trSort.dir === "desc" ? " ↓" : " ↑") : "")}
      </th>
    );
  };

  const head = (
    <thead>
      {/* Tinggi baris 1 dikunci 26px agar cocok dengan offset sticky
          top:26px baris 2 — tanpa ini ada celah tembus pandang. */}
      <tr style={{ height: "26px" }}>
        {th("No", {
          rowSpan: 2,
          sortKey: "no",
          align: "right",
          frz: "l",
          off: L[0],
        })}
        {th("Cabang", { rowSpan: 2, sortKey: "branch", frz: "l", off: L[1] })}
        {th("Progress", {
          rowSpan: 2,
          sortKey: "prog",
          align: "right",
          frz: "l",
          off: L[2],
        })}
        {TR_MONTHS.map((m, i) =>
          th(m, { k: "m" + i, colSpan: 2, align: "center", sep: true }),
        )}
        {th("AVG UL", {
          rowSpan: 2,
          align: "right",
          sortKey: "ul",
          frz: "r",
          off: R[0],
        })}
        {th("AVG DL", {
          rowSpan: 2,
          align: "right",
          sortKey: "dl",
          frz: "r",
          off: R[1],
        })}
        {th("Status", { rowSpan: 2, frz: "r", off: R[2] })}
      </tr>
      <tr>
        {TR_MONTHS.map((m, i) => [
          th("UL", { k: "u" + i, row2: true, align: "right", sep: true }),
          th("DL", { k: "d" + i, row2: true, align: "right" }),
        ])}
      </tr>
    </thead>
  );

  const num = (
    v: number,
    extra?: React.CSSProperties,
  ): React.CSSProperties => ({
    fontFamily: NUM,
    fontSize: "10.5px",
    fontWeight: 700,
    textAlign: "right",
    color: v > 0 ? "var(--text-secondary)" : "var(--text-placeholder)",
    padding: "0 5px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    borderBottom: "1px solid var(--border-subtle)",
    ...(extra || {}),
  });

  const body = (
    <tbody>
      {rows.map((r) => {
        const pt = progTone(r.avgProg == null ? 0 : r.avgProg);
        const cells: React.ReactNode[] = [];
        r.cells.forEach((c, mi) => {
          const sep: React.CSSProperties = {
            borderLeft: "1px solid var(--border-subtle)",
          };
          if (c == null) {
            cells.push(
              <td key={"u" + mi} style={num(0, { ...sep, color: "#D7DCE5" })}>
                ·
              </td>,
            );
            cells.push(
              <td key={"d" + mi} style={num(0, { color: "#D7DCE5" })}>
                ·
              </td>,
            );
            return;
          }
          const bad = r.anomalies[mi] != null;
          const t = tip({
            title: r.branch + " · " + TR_MONTHS[mi],
            primary: "UL " + fmtNum(c[0]) + " / DL " + fmtNum(c[1]) + " Mbps",
            secondary: "(progress bulan ini " + (r.prog[mi] ?? 0) + "%)",
            meta: r.anomalies[mi] ?? null,
            tone: bad ? "red" : "blue",
          });
          const st: React.CSSProperties = {
            background: bad ? "#FEE2E2" : "transparent",
            color: bad ? "#B91C1C" : undefined,
            cursor: "default",
          };
          cells.push(
            <td key={"u" + mi} {...t} style={num(c[0], { ...sep, ...st })}>
              {c[0] > 0 ? fmtNum(c[0]) : "–"}
            </td>,
          );
          cells.push(
            <td key={"d" + mi} {...t} style={num(c[1], st)}>
              {c[1] > 0 ? fmtNum(c[1]) : "–"}
            </td>,
          );
        });

        const chips: [string, string, string, string][] = [];
        if (r.avgProg == null)
          chips.push([
            "Belum ada periode",
            "gray",
            "Cabang ini tidak muncul sama sekali pada sumber pengukuran tahun ini.",
            "Pastikan cabang ini terdaftar sebagai lokasi uji, lalu pilih tahun lain untuk melihat riwayatnya.",
          ]);
        else if (!r.measured)
          chips.push([
            "Tanpa data",
            "gray",
            "Belum ada pengukuran sama sekali sepanjang periode — bukan berarti trafik nol.",
            "Pastikan uji kecepatan cabang ini dijalankan dan tercatat tiap periode.",
          ]);
        if (r.warnA)
          chips.push([
            "Data tidak lengkap",
            "amber",
            "Hanya " +
              fmtNum(r.avgProg as number) +
              "% ruangan yang terukur sepanjang periode. Rata-rata UL/DL kemungkinan tidak mewakili kondisi sebenarnya.",
            "Pastikan uji kecepatan dijalankan di seluruh ruangan cabang ini tiap periode pengukuran.",
          ]);
        // Istilah dan tindakan mengikuti mockup yang disetujui. Catatan
        // teknis: sumbernya speed test, bukan pengukuran konsumsi jalur —
        // lihat MEMORY.md §2.3.
        if (r.warnB)
          chips.push([
            "Utilisasi rendah",
            "blue",
            "Pemakaian download hanya " +
              Math.round(r.utilPct as number) +
              "% dari kapasitas kontrak (" +
              r.contract +
              " Mbps). Kapasitas besar terbayar tapi tidak terpakai.",
            "Tinjau paket kontrak " +
              r.branch +
              " — pertimbangkan penurunan bandwidth, atau verifikasi apakah trafik memang serendah ini.",
          ]);
        // A branch can have more than one impossible month — Tasikmalaya has
        // two — so the chip names every one of them instead of a fixed month.
        const anomalyMonths = Object.keys(r.anomalies)
          .map(Number)
          .sort((a, b) => a - b);
        if (anomalyMonths.length)
          chips.push([
            "Anomali data",
            "red",
            [...new Set(anomalyMonths.map((mi) => r.anomalies[mi]))].join(" "),
            "Verifikasi angka " +
              anomalyMonths.map((mi) => TR_MONTHS[mi]).join(", ") +
              " ke tim network sebelum dipakai untuk pelaporan.",
          ]);

        const bd: React.CSSProperties = {
          borderBottom: "1px solid var(--border-subtle)",
        };
        const progTip =
          r.avgProg != null
            ? tip({
                title: r.branch,
                primary: "AVG Progress " + fmtNum(r.avgProg) + "%",
                secondary:
                  "(" +
                  r.prog
                    .filter((p) => p != null)
                    .map((p, i) => TR_MONTHS[i].slice(0, 3) + " " + p + "%")
                    .join(" · ") +
                  ")",
                meta:
                  r.avgProg < 20
                    ? "Di bawah ambang keandalan 20% — rata-rata UL/DL belum bisa dipercaya."
                    : null,
                tone: r.avgProg < 20 ? "amber" : "green",
              })
            : {};

        return (
          <tr key={r.branch} style={{ height: "32px" }}>
            <td
              style={{
                fontFamily: NUM,
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-placeholder)",
                textAlign: "right",
                padding: "0 5px",
                ...bd,
                ...frz("l", L[0], "#fff", 2),
              }}
            >
              {r.no}
            </td>
            <td
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
                padding: "0 5px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                ...bd,
                ...frz("l", L[1], "#fff", 2),
              }}
            >
              {r.branch}
            </td>
            <td
              {...progTip}
              style={{
                padding: "0 5px",
                cursor: "default",
                ...bd,
                ...frz("l", L[2], "#fff", 2),
              }}
            >
              {r.avgProg == null ? (
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "11px",
                    color: "var(--text-placeholder)",
                  }}
                >
                  —
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "5px",
                      borderRadius: "999px",
                      background: "#EEF1F5",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: r.avgProg + "%",
                        height: "100%",
                        borderRadius: "999px",
                        background: pt.bar,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: NUM,
                      fontSize: "11px",
                      fontWeight: 800,
                      color: pt.fg,
                      width: "44px",
                      textAlign: "right",
                    }}
                  >
                    {fmtNum(r.avgProg) + "%"}
                  </span>
                </div>
              )}
            </td>
            {cells}
            <td
              style={num(r.ul, {
                color: r.ul > 0 ? "#1D4ED8" : "var(--text-placeholder)",
                fontWeight: 800,
                ...frz("r", R[0], "#fff", 2),
              })}
            >
              {r.ul > 0 ? fmtNum(r.ul) : "–"}
            </td>
            <td
              style={num(r.dl, {
                color: r.dl > 0 ? "#1D4ED8" : "var(--text-placeholder)",
                fontWeight: 800,
                ...frz("r", R[1], "#fff", 2),
              })}
            >
              {r.dl > 0 ? fmtNum(r.dl) : "–"}
            </td>
            <td
              style={{ padding: "0 5px", ...bd, ...frz("r", R[2], "#fff", 2) }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                {chips.length ? (
                  chips.map((c) => {
                    const tc = toneChip(c[1]);
                    return (
                      <span
                        key={c[0]}
                        {...tip({
                          title: r.branch,
                          primary: c[0],
                          secondary: c[2],
                          meta: "Tindakan IT Support: " + c[3],
                          tone: c[1] === "gray" ? "blue" : c[1],
                        })}
                        style={{
                          fontSize: "9.5px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "999px",
                          background: tc.bg,
                          color: tc.fg,
                          whiteSpace: "nowrap",
                          cursor: "default",
                        }}
                      >
                        {c[0]}
                      </span>
                    );
                  })
                ) : (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-placeholder)",
                    }}
                  >
                    —
                  </span>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );

  const sum = (f: (r: TrafficTableRow) => number) =>
    rows.reduce((p, r) => p + f(r), 0);
  const anomalyInMonth = TR_MONTHS.map((m, mi) =>
    rows.some((r) => r.anomalies[mi] != null),
  );
  const totals = TR_MONTHS.map((m, mi) => {
    const live = rows.some((r) => r.cells[mi] != null);
    const at = (r: TrafficTableRow, i: 0 | 1) =>
      r.cells[mi] && r.anomalies[mi] == null
        ? (r.cells[mi] as [number, number])[i]
        : 0;
    return live ? [sum((r) => at(r, 0)), sum((r) => at(r, 1))] : null;
  });

  const ft = (extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: NUM,
    fontSize: "10.5px",
    fontWeight: 800,
    textAlign: "right",
    color: "var(--text-primary)",
    padding: "9px 5px",
    position: "sticky",
    bottom: 0,
    background: FB,
    borderTop: "1px solid var(--border-default)",
    whiteSpace: "nowrap",
    zIndex: 3,
    willChange: "transform",
    ...(extra || {}),
  });

  const foot = (
    <tfoot>
      <tr>
        <td
          colSpan={3}
          style={ft({
            textAlign: "left",
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: ".04em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            ...frz("l", L[0], FB, 7),
          })}
        >
          {"Total " + rows.length + " cabang"}
        </td>
        {totals.map((t, mi) =>
          t == null
            ? [
                <td
                  key={"tu" + mi}
                  style={ft({
                    borderLeft: "1px solid var(--border-subtle)",
                    color: "#D7DCE5",
                  })}
                >
                  ·
                </td>,
                <td key={"td" + mi} style={ft({ color: "#D7DCE5" })}>
                  ·
                </td>,
              ]
            : [
                <td
                  key={"tu" + mi}
                  {...tip({
                    title: "Total " + TR_MONTHS[mi],
                    primary: "UL " + fmtNum(t[0]) + " Mbps",
                    secondary:
                      "(gabungan " + rows.length + " cabang yang tampil)",
                    meta: anomalyInMonth[mi]
                      ? "Entri anomali tidak dihitung."
                      : null,
                    tone: "blue",
                  })}
                  style={ft({
                    borderLeft: "1px solid var(--border-subtle)",
                    cursor: "default",
                  })}
                >
                  {fmtNum(t[0], 0)}
                </td>,
                <td
                  key={"td" + mi}
                  {...tip({
                    title: "Total " + TR_MONTHS[mi],
                    primary: "DL " + fmtNum(t[1]) + " Mbps",
                    secondary:
                      "(gabungan " + rows.length + " cabang yang tampil)",
                    meta: anomalyInMonth[mi]
                      ? "Entri anomali tidak dihitung."
                      : null,
                    tone: "blue",
                  })}
                  style={ft({ cursor: "default" })}
                >
                  {fmtNum(t[1], 0)}
                </td>,
              ],
        )}
        <td style={ft({ color: "#1D4ED8", ...frz("r", R[0], FB, 7) })}>
          {fmtNum(
            sum((r) => r.ul),
            0,
          )}
        </td>
        <td style={ft({ color: "#1D4ED8", ...frz("r", R[1], FB, 7) })}>
          {fmtNum(
            sum((r) => r.dl),
            0,
          )}
        </td>
        <td
          style={ft({
            textAlign: "left",
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-placeholder)",
            ...frz("r", R[2], FB, 7),
          })}
        >
          Total Mbps
        </td>
      </tr>
    </tfoot>
  );

  const cols = ([] as number[]).concat(LW, new Array(24).fill(MW), RW);
  return (
    <div
      className="nl-scroll"
      style={{
        maxHeight: "440px",
        overflow: "auto",
        // Container menyusut pas ke lebar tabel di layar lebar sehingga
        // kolom beku kanan menempel tanpa gap; maxWidth menjaga scroll
        // horizontal di layar sempit.
        width: "fit-content",
        maxWidth: "100%",
        // Paksa compositing layer sendiri agar Chromium tidak menyisakan
        // cat lama (angka dobel) di sel kolom beku saat scroll horizontal.
        transform: "translateZ(0)",
        isolation: "isolate",
      }}
    >
      <table
        style={{
          // Lebar px fix agar offset sticky (dihitung dari konstanta px)
          // selalu presisi — kolom TIDAK boleh di-stretch browser.
          width: LW[0] + LW[1] + LW[2] + 24 * MW + RW[0] + RW[1] + RW[2] + "px",
          tableLayout: "fixed",
          borderCollapse: "separate",
          borderSpacing: 0,
        }}
      >
        <colgroup>
          {cols.map((w, i) => (
            <col key={i} style={{ width: w + "px" }} />
          ))}
        </colgroup>
        {head}
        {body}
        {foot}
      </table>
    </div>
  );
}
