"use client";

import { useState } from "react";

import { Card } from "../shared/card";
import {
  BarCell,
  NameCell,
  NumCell,
  SoftCell,
} from "../shared/cells";
import { Chip } from "../shared/chips";
import {
  DataTable,
  type TableColumn,
} from "../shared/data-table";
import { Donut } from "../shared/donut";
import { Dropdown } from "../shared/dropdown";
import { SearchInput } from "../shared/search-input";
import { Tabs } from "../shared/tabs";
import { fmt, p1, pct1 } from "../../utils/format";
import type {
  MonthRow,
  SlaRow,
  TeamPerformanceData,
  TeamRow,
  TeamTab,
} from "../../types/kaldev.types";

import { CompositionChart } from "./composition-chart";

const PAGE_SIZE = 12;
const CAT_PALETTE = [
  "var(--chart-blue-primary)",
  "var(--chart-blue-light)",
  "var(--chart-green)",
  "var(--chart-amber)",
  "var(--chart-red)",
  "var(--chart-neutral)",
];

const SLA_COLS: TableColumn[] = [
  { key: "idx", label: "No", width: "52px" },
  { key: "name", label: "Programmer", width: "minmax(205px,1.6fr)" },
  { key: "total", label: "Proyek selesai", width: "132px", align: "right" },
  { key: "ok", label: "Tercapai", width: "112px", align: "right" },
  { key: "gagal", label: "Tidak tercapai", width: "140px", align: "right" },
  { key: "pct", label: "Pencapaian", width: "minmax(210px,1fr)" },
];
const TEAM_COLS: TableColumn[] = [
  { key: "no", label: "No", width: "52px" },
  { key: "name", label: "Programmer", width: "minmax(205px,1.6fr)" },
  { key: "q", label: "Antrean", width: "96px", align: "right" },
  { key: "p", label: "Dikerjakan", width: "116px", align: "right" },
  { key: "today", label: "Selesai hari ini", width: "142px", align: "right" },
  { key: "total", label: "Total aktif", width: "minmax(150px,1fr)" },
];
const MONTH_COLS: TableColumn[] = [
  { key: "name", label: "Bulan", width: "minmax(96px,1.1fr)" },
  { key: "total", label: "Selesai", width: "82px", align: "right" },
  { key: "ok", label: "Tercapai", width: "90px", align: "right" },
  { key: "no", label: "Tidak tercapai", width: "112px", align: "right" },
  { key: "pct", label: "Pencapaian", width: "minmax(150px,1fr)" },
];

function RightNum({
  value,
  strong = false,
}: {
  value: number;
  strong?: boolean;
}) {
  return (
    <NumCell
      align="right"
      tone={value === 0 ? "placeholder" : strong ? "primary" : "secondary"}
    >
      {fmt(value)}
    </NumCell>
  );
}

function PctCell({
  pct,
  target,
  mode,
}: {
  pct: number;
  target: number;
  mode: "programmer" | "month";
}) {
  const gap = target - pct;
  const tone = gap <= 0 ? "green" : pct >= 90 ? "amber" : "red";
  const label =
    gap <= 0
      ? "Tercapai"
      : mode === "programmer"
        ? `Kurang ${p1(gap)} poin`
        : "Di bawah target";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span
        style={{
          font: "600 12.5px/1 var(--dd-font-sans)",
          fontVariantNumeric: "tabular-nums",
          color: "var(--text-primary)",
          minWidth: 48,
        }}
      >
        {pct1(pct)}
      </span>
      <Chip tone={tone}>{label}</Chip>
    </div>
  );
}

function paginate<T>(
  rows: T[],
  page: number,
): { slice: T[]; page: number; totalPages: number; start: number } {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const p = Math.min(Math.max(1, page), totalPages);
  const start = (p - 1) * PAGE_SIZE;
  return {
    slice: rows.slice(start, start + PAGE_SIZE),
    page: p,
    totalPages,
    start,
  };
}

/** Isi halaman Team performance di bawah kartu kuartal: tab (URL) + tabel/chart. */
export function TeamPerformanceClient({
  data,
  tab,
  tabHrefs,
  yearLabel,
}: {
  data: TeamPerformanceData;
  tab: TeamTab;
  tabHrefs: Record<TeamTab, string>;
  yearLabel: string;
}) {
  const [slaQ, setSlaQ] = useState("");
  const [slaF, setSlaF] = useState("Semua");
  const [slaPage, setSlaPage] = useState(1);
  const [teamQ, setTeamQ] = useState("");
  const [teamF, setTeamF] = useState("Semua");
  const [teamPage, setTeamPage] = useState(1);
  const T = data.target;

  const tabs = (
    <Tabs
      value={tab}
      items={[
        { value: "sla", label: "Performa SLA", href: tabHrefs.sla },
        { value: "beban", label: "Beban kerja tim", href: tabHrefs.beban },
        { value: "tren", label: "Tren & kategori", href: tabHrefs.tren },
      ]}
    />
  );

  if (tab === "beban") {
    const q = teamQ.trim().toLowerCase();
    const found = data.team.rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (teamF === "Tanpa beban") return r.total === 0;
      if (teamF === "Hanya antrean") return r.q > 0 && r.p === 0;
      if (teamF === "Sedang dikerjakan") return r.p > 0;
      return true;
    });
    const pg = paginate(found, teamPage);
    const rows: TeamRow[] = [
      ...pg.slice,
      data.team.unassignedRow,
      data.team.totalRow,
    ];
    return (
      <>
        {tabs}
        <DataTable
          title="Beban kerja tim"
          count={`${fmt(found.length)} ${q || teamF !== "Semua" ? "dari filter" : "programmer"}`}
          hint="Diurutkan dari total aktif terbanyak"
          search={
            <SearchInput
              placeholder="Cari nama programmer"
              value={teamQ}
              onChange={(v) => {
                setTeamQ(v);
                setTeamPage(1);
              }}
            />
          }
          filters={
            <Dropdown
              label="Beban"
              value={teamF}
              options={[
                "Semua",
                "Tanpa beban",
                "Hanya antrean",
                "Sedang dikerjakan",
              ]}
              onChange={(v) => {
                setTeamF(v);
                setTeamPage(1);
              }}
            />
          }
          columns={TEAM_COLS}
          rows={rows}
          rowKey={(r) => r.name}
          minWidth={1010}
          rangeText={
            found.length
              ? `Menampilkan ${pg.start + 1}–${Math.min(pg.start + PAGE_SIZE, found.length)} dari ${found.length} programmer · baris total mencakup seluruh divisi`
              : "Tidak ada beban kerja aktif"
          }
          page={pg.page}
          totalPages={pg.totalPages}
          onPageChange={setTeamPage}
          emptyMessage="Belum ada proyek aktif pada periode ini."
          renderCell={(r, col, i) => {
            const special = Boolean(r.kind);
            const strong = r.kind === "total";
            switch (col.key) {
              case "no":
                return special ? null : <SoftCell>{pg.start + i + 1}</SoftCell>;
              case "name":
                return (
                  <div
                    title={r.name}
                    style={{
                      font: "700 12.5px/1.45 var(--dd-font-sans)",
                      color:
                        r.kind === "un"
                          ? "var(--text-muted)"
                          : "var(--text-primary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.name}
                  </div>
                );
              case "q":
                return <RightNum value={r.q} />;
              case "p":
                return <RightNum value={r.p} />;
              case "today":
                return <RightNum value={r.today} />;
              default:
                return special ? (
                  <span
                    style={{
                      font: "600 12.5px/1.4 var(--dd-font-sans)",
                      fontVariantNumeric: "tabular-nums",
                      color: strong
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    }}
                  >
                    {fmt(r.total)}
                  </span>
                ) : (
                  <BarCell value={r.total} max={data.team.max} />
                );
            }
          }}
        />
      </>
    );
  }

  if (tab === "tren") {
    const monthRows: MonthRow[] = data.month.totalRow
      ? [...data.month.rows, data.month.totalRow]
      : data.month.rows;
    const cat = data.categories;
    return (
      <>
        {tabs}
        <div
          style={{
            display: "grid",
            gap: "var(--grid-gap)",
            alignContent: "start",
          }}
        >
          <CompositionChart
            trend={data.trend}
            target={T}
            yearLabel={yearLabel}
            note={data.trendNote}
          />
          <div className="kd-grid-split-perf">
            <DataTable
              title="Rincian bulanan"
              count={`${data.month.rows.length} bulan`}
              hint="Pencapaian dihitung dari proyek selesai pada bulan tersebut"
              columns={MONTH_COLS}
              rows={monthRows}
              rowKey={(r) => r.name}
              minWidth={530}
              style={{
                maxHeight: 486,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
              rangeText={data.month.rangeText}
              page={1}
              totalPages={1}
              onPageChange={() => undefined}
              emptyMessage="Belum ada proyek selesai pada periode ini."
              renderCell={(r, col) => {
                switch (col.key) {
                  case "name":
                    return (
                      <NameCell nowrap>
                        {r.partial ? `${r.name} *` : r.name}
                      </NameCell>
                    );
                  case "total":
                    return <NumCell align="right">{fmt(r.total)}</NumCell>;
                  case "ok":
                    return <NumCell align="right">{fmt(r.ok)}</NumCell>;
                  case "no":
                    return <NumCell align="right">{fmt(r.no)}</NumCell>;
                  default:
                    return <PctCell pct={r.pct} target={T} mode="month" />;
                }
              }}
            />
            <Card
              title="Proyek aktif per kategori"
              subtitle="Antrean dan dikerjakan, lima kategori teratas"
              style={{ minWidth: 0, maxHeight: 486 }}
              bodyStyle={{
                display: "grid",
                gap: 14,
                justifyItems: "center",
                gridTemplateColumns: "minmax(0,1fr)",
              }}
            >
              <Donut
                data={cat.slices.map((s, i) => ({
                  label: s.label,
                  value: s.value,
                  color: CAT_PALETTE[i] ?? CAT_PALETTE[5],
                }))}
                size={164}
                stroke={24}
                centerValue={fmt(cat.total)}
                centerCaption="proyek aktif"
              />
              <div style={{ width: "100%", display: "grid", gap: 0 }}>
                {cat.slices.map((s, i) => (
                  <span
                    key={`${s.label}-${i}`}
                    className="dd-tooltip-wrap"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "8px 0",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        flex: "0 0 auto",
                        background: CAT_PALETTE[i] ?? CAT_PALETTE[5],
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        font: "600 12px/1.3 var(--dd-font-sans)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {s.label}
                    </span>
                    <span
                      style={{
                        flex: "0 0 auto",
                        font: "600 12.5px/1 var(--dd-font-sans)",
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--text-primary)",
                      }}
                    >
                      {fmt(s.value)}
                    </span>
                    <span
                      style={{
                        flex: "0 0 auto",
                        width: 32,
                        textAlign: "right",
                        font: "400 11.5px/1 var(--dd-font-sans)",
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--text-placeholder)",
                      }}
                    >
                      {s.pct}%
                    </span>
                    <span className="dd-tooltip" role="tooltip">
                      <span
                        className="dd-tip-title"
                        style={{ display: "block" }}
                      >
                        {s.label}
                      </span>
                      <span className="dd-tip-row">
                        <span
                          className="dd-tip-dot"
                          style={{
                            background: CAT_PALETTE[i] ?? CAT_PALETTE[5],
                          }}
                        />
                        <span className="dd-tip-lab">Proyek aktif</span>
                        <span className="dd-tip-val">{fmt(s.value)}</span>
                      </span>
                      <span className="dd-tip-foot">
                        <span
                          className="dd-tip-lab"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Porsi dari total
                        </span>
                        <span className="dd-tip-val">{s.pct}%</span>
                      </span>
                      {s.detail && (
                        <span
                          style={{
                            display: "block",
                            marginTop: 4,
                            color: "var(--text-muted)",
                            whiteSpace: "normal",
                          }}
                        >
                          {s.detail}
                        </span>
                      )}
                    </span>
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  /* Performa SLA per programmer */
  const q = slaQ.trim().toLowerCase();
  const found = data.sla.rows.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false;
    if (slaF === "Tercapai") return r.pct >= T;
    if (slaF === "Di bawah target") return r.pct < T;
    return true;
  });
  const pg = paginate(found, slaPage);
  const rows: SlaRow[] =
    found.length && data.sla.totalRow
      ? [...pg.slice, data.sla.totalRow]
      : pg.slice;
  return (
    <>
      {tabs}
      <div
        style={{
          display: "grid",
          gap: "var(--grid-gap)",
          alignContent: "start",
        }}
      >
        <DataTable
          title="Performa SLA per programmer"
          count={`${fmt(found.length)} ${q || slaF !== "Semua" ? "dari filter" : "programmer"}`}
          hint="Diurutkan dari pencapaian terendah; total memakai persen berbobot"
          search={
            <SearchInput
              placeholder="Cari nama programmer"
              value={slaQ}
              onChange={(v) => {
                setSlaQ(v);
                setSlaPage(1);
              }}
            />
          }
          filters={
            <Dropdown
              label="Pencapaian"
              value={slaF}
              options={["Semua", "Tercapai", "Di bawah target"]}
              onChange={(v) => {
                setSlaF(v);
                setSlaPage(1);
              }}
            />
          }
          columns={SLA_COLS}
          rows={rows}
          rowKey={(r) => r.name}
          minWidth={1050}
          rangeText={data.sla.rangeText}
          page={pg.page}
          totalPages={pg.totalPages}
          onPageChange={setSlaPage}
          emptyMessage={
            q
              ? "Tidak ada programmer yang cocok dengan pencarian."
              : "Belum ada proyek selesai pada periode ini."
          }
          renderCell={(r, col, i) => {
            const strong = r.kind === "total";
            switch (col.key) {
              case "idx":
                return strong ? null : <SoftCell>{pg.start + i + 1}</SoftCell>;
              case "name":
                return (
                  <div
                    title={r.name}
                    style={{
                      font: "700 12.5px/1.45 var(--dd-font-sans)",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.name}
                  </div>
                );
              case "total":
                return <RightNum value={r.total} />;
              case "ok":
                return <RightNum value={r.ok} />;
              case "gagal":
                return <RightNum value={r.no} />;
              default:
                return <PctCell pct={r.pct} target={T} mode="programmer" />;
            }
          }}
        />
        <section className="dd-card dd-card--sm">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Chip tone="gray">Belum ditugaskan</Chip>
            <span
              style={{
                font: "500 12px/1.4 var(--dd-font-sans)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-muted)",
              }}
            >
              {data.sla.unassignedText}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
