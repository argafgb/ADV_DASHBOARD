"use client";

import { useState } from "react";

import { Card } from "../shared/card";
import {
  Eyebrow,
  IdCell,
  NameCell,
  NumCell,
  SoftCell,
} from "../shared/cells";
import { Chip, Count, Pill } from "../shared/chips";
import {
  DataTable,
  type TableColumn,
} from "../shared/data-table";
import { SearchInput } from "../shared/search-input";
import { Tabs } from "../shared/tabs";
import { dash, fmt } from "../../utils/format";
import type {
  AttentionData,
  AttentionTab,
} from "../../types/kaldev.types";

const DUE_COLS: TableColumn[] = [
  { key: "id", label: "ID", width: "86px" },
  { key: "name", label: "Nama proyek", width: "minmax(240px,2fr)" },
  { key: "programmer", label: "Programmer", width: "minmax(165px,1.1fr)" },
  { key: "target", label: "Target", width: "158px" },
  { key: "status", label: "Status target", width: "158px" },
];
const NODEV_COLS: TableColumn[] = [
  { key: "id", label: "ID", width: "86px" },
  { key: "name", label: "Nama proyek", width: "minmax(240px,2fr)" },
  { key: "programmer", label: "PIC Intake", width: "minmax(160px,1.1fr)" },
  { key: "basis", label: "Basis proyek", width: "100px" },
  { key: "kategori", label: "Kategori", width: "110px" },
  { key: "createdBy", label: "Created by", width: "minmax(160px,1.1fr)" },
  { key: "dibuat", label: "Created on", width: "135px" },
  { key: "wait", label: "Menunggu", width: "105px" },
];
const IDLE_COLS: TableColumn[] = [
  { key: "id", label: "ID", width: "86px" },
  { key: "name", label: "Nama proyek", width: "minmax(240px,2fr)" },
  { key: "implementer", label: "Implementor", width: "minmax(165px,1.1fr)" },
  { key: "dev", label: "Programmer", width: "minmax(165px,1.1fr)" },
  { key: "last", label: "Progres terakhir", width: "168px" },
  { key: "idle", label: "Diam", width: "120px" },
];

function hit(q: string, ...fields: (string | null | undefined)[]): boolean {
  if (!q) return true;
  return fields.filter(Boolean).join(" ").toLowerCase().includes(q);
}

/**
 * Isi halaman Action required: empat tab (URL `tab`), pencarian lokal, tabel
 * per tab, dan kartu proyek ditahan.
 */
export function ActionRequiredClient({
  data,
  tab,
  tabHrefs,
}: {
  data: AttentionData;
  tab: AttentionTab;
  tabHrefs: Record<AttentionTab, string>;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const found = (n: number) =>
    q ? `${fmt(n)} dari pencarian` : `${fmt(n)} proyek`;
  const search = (
    <SearchInput
      placeholder="Cari ID, nama proyek, atau orang"
      value={query}
      onChange={setQuery}
    />
  );

  const tabs = (
    <Tabs
      value={tab}
      items={[
        {
          value: "sla",
          label: `Overdue & due soon (${data.counts.sla})`,
          href: tabHrefs.sla,
        },
        {
          value: "noprog",
          label: `No developer (${data.counts.noprog})`,
          href: tabHrefs.noprog,
        },
        {
          value: "idle",
          label: `No progress (${data.counts.idle})`,
          href: tabHrefs.idle,
        },
        {
          value: "hold",
          label: `On hold (${data.counts.hold})`,
          href: tabHrefs.hold,
        },
      ]}
    />
  );

  if (tab === "hold") {
    const holds = data.holds.filter((h) =>
      hit(q, h.id, h.name, h.programmer, h.reason),
    );
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
          <section className="dd-card dd-card--sm">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="dd-card__title" style={{ fontWeight: 600 }}>
                    Proyek ditahan
                  </span>
                  <Count>{found(holds.length)}</Count>
                </div>
                <div className="dd-card__subtitle">
                  Tinjau alasan penahanan sebelum melanjutkan
                </div>
              </div>
              <div className="dd-table__search" style={{ flex: "1 1 220px" }}>
                {search}
              </div>
            </div>
          </section>

          {holds.length === 0 ? (
            <section className="dd-card">
              <div className="dd-empty">
                <div className="dd-empty__title">
                  {q ? "Tidak ada hasil pencarian" : "Tidak ada proyek ditahan"}
                </div>
                <div className="dd-empty__msg">
                  {q
                    ? "Ubah kata kunci untuk melihat proyek ditahan lainnya."
                    : "Semua proyek berjalan atau sudah selesai."}
                </div>
              </div>
            </section>
          ) : (
            holds.map((h) => (
              <Card
                key={h.id}
                title={
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        font: "700 12px/1.4 var(--dd-font-sans)",
                        fontVariantNumeric: "tabular-nums",
                        color: "var(--text-placeholder)",
                      }}
                    >
                      {h.id}
                    </span>
                    <span style={{ minWidth: 0 }}>{h.name}</span>
                    <Pill tone="amber">Ditahan</Pill>
                  </span>
                }
                bodyStyle={{
                  display: "grid",
                  gap: "var(--grid-gap)",
                  gridTemplateColumns: "minmax(0,.62fr) minmax(0,1fr)",
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  }}
                >
                  {[
                    ["Programmer", dash(h.programmer)],
                    ["Basis proyek", h.basis],
                    ["Ditahan sejak", dash(h.since)],
                    ["Disetujui oleh", dash(h.approver)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <Eyebrow>{label}</Eyebrow>
                      <div
                        style={{
                          font: "600 12.5px/1.4 var(--dd-font-sans)",
                          color: "var(--text-secondary)",
                          marginTop: 5,
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    minWidth: 0,
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 11,
                    padding: "13px 15px",
                  }}
                >
                  <Eyebrow>Alasan ditahan</Eyebrow>
                  <p
                    style={{
                      margin: "7px 0 0",
                      font: "400 12.5px/1.65 var(--dd-font-sans)",
                      color: "var(--text-secondary)",
                      textWrap: "pretty",
                    }}
                  >
                    {dash(h.reason)}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </>
    );
  }

  if (tab === "noprog") {
    const rows = data.noDev.filter((r) =>
      hit(q, r.id, r.name, r.programmer, r.createdBy),
    );
    return (
      <>
        {tabs}
        <DataTable
          title="Proyek tanpa programmer"
          count={found(rows.length)}
          hint="Tiket intake pada Mas Jeremy Vincent / belum ditugaskan ke programmer eksekutor"
          search={search}
          columns={NODEV_COLS}
          rows={rows}
          rowKey={(r) => r.id}
          minWidth={1180}
          emptyMessage="Semua proyek sudah memiliki programmer eksekutor."
          renderCell={(r, col) => {
            switch (col.key) {
              case "id":
                return <IdCell>{r.id}</IdCell>;
              case "name":
                return <NameCell title={r.name}>{r.name}</NameCell>;
              case "programmer":
                return (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        font: "600 12.5px/1.4 var(--dd-font-sans)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {r.programmer || "Belum ditugaskan"}
                    </span>
                    {r.programmer?.toLowerCase().includes("jeremy") && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: "var(--accent-tint)",
                          color: "var(--dd-accent)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Lead Intake
                      </span>
                    )}
                  </div>
                );
              case "basis":
                return <Chip tone="entity">{r.basis}</Chip>;
              case "kategori":
                return <NumCell>{r.kategori}</NumCell>;
              case "createdBy":
                return r.createdBy ? (
                  <NumCell>{r.createdBy}</NumCell>
                ) : (
                  <SoftCell>—</SoftCell>
                );
              case "dibuat":
                return <NumCell>{r.dibuat}</NumCell>;
              default:
                return (
                  <Chip tone="amber">
                    {r.wait === 0 ? "Hari ini" : `${r.wait} hari`}
                  </Chip>
                );
            }
          }}
        />
      </>
    );
  }

  if (tab === "idle") {
    const rows = data.idle.filter((r) =>
      hit(q, r.id, r.name, r.implementer, r.dev),
    );
    return (
      <>
        {tabs}
        <DataTable
          title="Proyek tanpa progres"
          count={found(rows.length)}
          hint="Belum ada pembaruan progres lebih dari 7 hari"
          search={search}
          columns={IDLE_COLS}
          rows={rows}
          rowKey={(r) => r.id}
          minWidth={1320}
          emptyMessage="Semua proyek aktif punya pembaruan progres terbaru."
          renderCell={(r, col) => {
            switch (col.key) {
              case "id":
                return <IdCell>{r.id}</IdCell>;
              case "name":
                return <NameCell title={r.name}>{r.name}</NameCell>;
              case "implementer":
                return r.implementer ? (
                  <NumCell>{r.implementer}</NumCell>
                ) : (
                  <SoftCell>—</SoftCell>
                );
              case "dev":
                return r.dev ? (
                  <NumCell>{r.dev}</NumCell>
                ) : (
                  <SoftCell>—</SoftCell>
                );
              case "last":
                return <NumCell>{dash(r.last)}</NumCell>;
              default:
                return (
                  <Chip tone={r.idle >= 14 ? "red" : "amber"}>
                    {r.idle === 0 ? "Hari ini" : `${r.idle} hari`}
                  </Chip>
                );
            }
          }}
        />
      </>
    );
  }

  const rows = data.due.filter((r) => hit(q, r.id, r.name, r.programmer));
  return (
    <>
      {tabs}
      <DataTable
        title="Proyek mendekati dan melewati target"
        count={found(rows.length)}
        hint="Diurutkan dari keterlambatan terlama ke target terdekat"
        search={search}
        columns={DUE_COLS}
        rows={rows}
        rowKey={(r) => r.id}
        minWidth={1220}
        emptyMessage="Tidak ada proyek yang mendekati atau melewati target."
        renderCell={(r, col) => {
          switch (col.key) {
            case "id":
              return <IdCell>{r.id}</IdCell>;
            case "name":
              return <NameCell title={r.name}>{r.name}</NameCell>;
            case "programmer":
              return r.programmer ? (
                <NumCell>{r.programmer}</NumCell>
              ) : (
                <SoftCell>—</SoftCell>
              );
            case "target":
              return <NumCell>{dash(r.target)}</NumCell>;
            default:
              if (r.days > 0) {
                return <Chip tone="red">Terlambat {r.days} hari</Chip>;
              }
              if (r.days === 0) {
                return <Chip tone="amber">Hari ini</Chip>;
              }
              return <Chip tone="amber">Sisa {Math.abs(r.days)} hari</Chip>;
          }
        }}
      />
    </>
  );
}
