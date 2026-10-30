"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "../shared/icons";

import {
  Eyebrow,
  IdCell,
  NameCell,
  NumCell,
  SoftCell,
} from "../shared/cells";
import { Chip, Pill } from "../shared/chips";
import {
  DataTable,
  RowChevron,
  type TableColumn,
} from "../shared/data-table";
import { Dropdown } from "../shared/dropdown";
import { IconTeam } from "../shared/icons";
import { SearchInput } from "../shared/search-input";
import { Tabs } from "../shared/tabs";
import { fmt } from "../../utils/format";
import {
  PROJECT_STATUSES,
  STATUS_EN,
  statusTone,
  type KanbanLane,
  type KanbanCard,
  type Project,
  type RegisterData,
  type RegisterQuery,
} from "../../types/kaldev.types";

const TABLE_COLS: TableColumn[] = [
  { key: "id", label: "ID", width: "84px" },
  { key: "name", label: "Nama proyek", width: "minmax(260px,2.2fr)" },
  { key: "programmer", label: "Programmer", width: "minmax(165px,1.1fr)" },
  { key: "basis", label: "Basis", width: "104px" },
  { key: "kategori", label: "Kategori", width: "116px" },
  { key: "status", label: "Status", width: "124px" },
  { key: "progress", label: "Progres", width: "96px", align: "center" },
  { key: "dibuat", label: "Dibuat", width: "152px" },
  { key: "mulai", label: "Mulai", width: "152px" },
  { key: "target", label: "Target", width: "152px" },
  { key: "selesai", label: "Selesai", width: "152px" },
  { key: "late", label: "Keterlambatan", width: "150px" },
  { key: "$chevron", label: "", width: "48px" },
];

function useUrlUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === "Semua") params.delete(k);
      else params.set(k, v);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };
}

function ProjectCell({ row, col }: { row: Project; col: TableColumn }) {
  switch (col.key) {
    case "id":
      return <IdCell>{row.id}</IdCell>;
    case "name":
      return <NameCell title={row.name}>{row.name}</NameCell>;
    case "programmer":
      return row.programmer ? (
        <NumCell>{row.programmer}</NumCell>
      ) : (
        <SoftCell>—</SoftCell>
      );
    case "basis":
      return <Chip tone="entity">{row.basis}</Chip>;
    case "kategori":
      return <NumCell>{row.kategori}</NumCell>;
    case "status":
      return <Pill tone={statusTone(row.status)}>{row.status}</Pill>;
    case "progress":
      return row.progress == null ? (
        <SoftCell align="center">—</SoftCell>
      ) : (
        <NumCell align="center">{row.progress}%</NumCell>
      );
    case "dibuat":
      return <NumCell>{row.dibuat}</NumCell>;
    case "mulai":
      return row.mulai ? (
        <NumCell>{row.mulai}</NumCell>
      ) : (
        <SoftCell>—</SoftCell>
      );
    case "target":
      return row.target ? (
        <NumCell>{row.target}</NumCell>
      ) : (
        <SoftCell>—</SoftCell>
      );
    case "selesai":
      return row.selesai ? (
        <NumCell>{row.selesai}</NumCell>
      ) : (
        <SoftCell>—</SoftCell>
      );
    case "late":
      if (row.late == null) return <SoftCell>—</SoftCell>;
      if (row.status === "Selesai" && row.late === 0)
        return <Chip tone="green">Tepat waktu</Chip>;
      if (row.late === 0) return <Chip tone="amber">Hari ini</Chip>;
      if (row.late < 0)
        return <Chip tone="amber">Sisa {Math.abs(row.late)} hari</Chip>;
      return <Chip tone="red">Terlambat {row.late} hari</Chip>;
    default:
      return <RowChevron />;
  }
}

function ExpandedRow({ row }: { row: Project }) {
  return (
    <div
      style={{
        position: "sticky",
        left: 0,
        width: "min(100%,900px)",
        display: "grid",
        gap: 14,
        paddingTop: 14,
      }}
    >
      <div style={{ display: "grid", gap: 7 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Eyebrow>Progres</Eyebrow>
          <span
            style={{
              font: "600 12.5px/1 var(--dd-font-sans)",
              fontVariantNumeric: "tabular-nums",
              color: "var(--text-primary)",
            }}
          >
            {row.progress == null ? "—" : `${row.progress}%`}
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "var(--chart-gray-track)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${row.progress ?? 0}%`,
              minWidth: 4,
              borderRadius: 999,
              background: "var(--chart-blue-primary)",
            }}
          />
        </div>
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 11,
          padding: "12px 15px",
        }}
      >
        <Eyebrow>Catatan terakhir</Eyebrow>
        {row.note ? (
          <p
            style={{
              margin: "7px 0 0",
              font: "400 12.5px/1.65 var(--dd-font-sans)",
              color: "var(--text-secondary)",
              textWrap: "pretty",
            }}
          >
            {row.note}
          </p>
        ) : (
          <p
            style={{
              margin: "7px 0 0",
              font: "400 12px/1.5 var(--dd-font-sans)",
              color: "var(--text-placeholder)",
              fontStyle: "italic",
            }}
          >
            Belum ada catatan aktivitas tambahan untuk proyek ini.
          </p>
        )}
      </div>
    </div>
  );
}

function Lane({
  lane,
  onMore,
  onCardClick,
}: {
  lane: KanbanLane;
  onMore: (lane: KanbanLane) => void;
  onCardClick?: (card: KanbanCard) => void;
}) {
  return (
    <div
      style={{
        flex: "0 0 276px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 0,
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "2px 2px 0",
        }}
      >
        <Pill tone={lane.tone}>{lane.label}</Pill>
        <span
          style={{
            font: "600 12.5px/1 var(--dd-font-sans)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-primary)",
          }}
        >
          {fmt(lane.count)}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "1px 2px 4px",
        }}
      >
        {lane.cards.map((c) => (
          <div
            key={c.id}
            className="kd-kanban__card"
            onClick={() => onCardClick?.(c)}
            style={{
              flex: "0 0 auto",
              display: "grid",
              gap: 8,
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: 10,
              padding: "11px 12px",
              cursor: "pointer",
            }}
          >
            <div
              title={c.name}
              style={{
                font: "700 12.5px/1.45 var(--dd-font-sans)",
                color: "var(--text-primary)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textWrap: "pretty",
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  width: 14,
                  height: 14,
                  flex: "0 0 auto",
                  color: "var(--text-lightest)",
                }}
              >
                <IconTeam />
              </span>
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  font: "600 11.5px/1.3 var(--dd-font-sans)",
                  color: c.programmer
                    ? "var(--text-secondary)"
                    : "var(--text-placeholder)",
                }}
              >
                {c.programmer ?? "Belum ditugaskan"}
              </span>
            </div>
            <div
              style={{
                font: "500 11.5px/1.3 var(--dd-font-sans)",
                color: "var(--text-muted)",
              }}
            >
              {c.dateText}
            </div>
            {c.showProgress && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 5,
                    borderRadius: 999,
                    background: "var(--chart-gray-track)",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: `${c.progress ?? 0}%`,
                      minWidth: 4,
                      borderRadius: 999,
                      background: "var(--chart-blue-primary)",
                    }}
                  />
                </span>
                <span
                  style={{
                    font: "600 11.5px/1 var(--dd-font-sans)",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--text-secondary)",
                  }}
                >
                  {c.progress ?? 0}%
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <Chip tone="gray">{c.kategori}</Chip>
              <Chip tone="entity">{c.basis}</Chip>
              {c.flag && <Chip tone={c.flag.tone}>{c.flag.text}</Chip>}
            </div>
            <div
              style={{
                font: "600 11px/1 var(--dd-font-sans)",
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-lightest)",
              }}
            >
              #{c.id}
            </div>
          </div>
        ))}
        {lane.hasMore && (
          <button
            type="button"
            className="dd-btn dd-btn--secondary dd-btn--sm"
            style={{
              flex: "0 0 auto",
              width: "100%",
              justifyContent: "center",
            }}
            onClick={() => onMore(lane)}
          >
            {lane.moreText}
          </button>
        )}
      </div>
    </div>
  );
}

/** Isi halaman Project register: toolbar, filter, kanban atau tabel. */
export function ProjectRegisterClient({
  data,
  query,
}: {
  data: RegisterData;
  query: RegisterQuery;
}) {
  const update = useUrlUpdater();
  // Nilai awal dari URL; setelah itu kotak cari menjadi sumber kebenaran
  // sampai pengguna berpindah halaman (URL diperbarui lewat debounce).
  const [q, setQ] = useState(query.q);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSearch = (value: string) => {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () => update({ q: value.trim(), page: null }),
      300,
    );
  };

  const filters = (
    <>
      <Dropdown
        label="Kategori"
        value={query.cat}
        options={["Semua", ...data.options.categories]}
        onChange={(v) => update({ cat: v, page: null })}
      />
      <Dropdown
        label="Basis"
        value={query.basis}
        options={["Semua", ...data.options.bases]}
        onChange={(v) => update({ basis: v, page: null })}
      />
      <Dropdown
        label="Programmer"
        value={query.prog}
        options={["Semua", ...data.options.programmers]}
        onChange={(v) => update({ prog: v, page: null })}
      />
    </>
  );

  if (query.view === "table") {
    const statusTabs = [
      { value: "Semua", label: `All (${fmt(data.statusCounts.Semua)})` },
      ...PROJECT_STATUSES.map((st) => ({
        value: st,
        label: `${STATUS_EN[st]} (${fmt(data.statusCounts[st])})`,
      })),
    ];
    return (
      <div
        style={{
          display: "grid",
          gap: "var(--grid-gap)",
          alignContent: "start",
        }}
      >
        <Tabs
          value={query.status}
          items={statusTabs}
          onChange={(v) => update({ status: v, page: null })}
        />
        <DataTable
          title="Daftar proyek"
          count={`${fmt(data.table.total)} proyek`}
          hint="Klik baris untuk membuka detail proyek"
          search={
            <SearchInput
              placeholder="Cari ID atau nama proyek"
              value={q}
              onChange={onSearch}
            />
          }
          filters={filters}
          columns={TABLE_COLS}
          rows={data.table.rows}
          rowKey={(r) => r.id}
          renderCell={(row, col) => <ProjectCell row={row} col={col} />}
          expand={(row) => <ExpandedRow row={row} />}
          minWidth={1840}
          rangeText={data.table.rangeText}
          page={data.table.page}
          totalPages={data.table.totalPages}
          onPageChange={(p) => update({ page: p === 1 ? null : String(p) })}
          emptyMessage="Ubah kata kunci, status, atau periode untuk melihat proyek lain."
        />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px 14px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            font: "600 13px/1 var(--dd-font-sans)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          {fmt(data.kanban.total)} proyek
        </span>
        <div className="dd-table__search">
          <SearchInput
            placeholder="Cari ID atau nama proyek"
            value={q}
            onChange={onSearch}
          />
        </div>
        <div className="dd-table__filters">{filters}</div>
      </div>

      {data.kanban.total === 0 ? (
        <section className="dd-card">
          <div className="dd-empty">
            <div className="dd-empty__title">
              Tidak ada proyek pada filter ini
            </div>
            <div className="dd-empty__msg">
              Ubah kata kunci atau periode untuk melihat proyek lain.
            </div>
          </div>
        </section>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "stretch",
            overflow: "auto hidden",
            height: "calc(100vh - 236px)",
            minHeight: 420,
            paddingBottom: 6,
          }}
        >
          {data.kanban.lanes.map((lane) => (
            <Lane
              key={lane.status}
              lane={lane}
              onMore={(l) =>
                update({ [`lim${l.status}`]: String(l.nextLimit) })
              }
              onCardClick={setSelectedCard}
            />
          ))}
        </div>
      )}

      {selectedCard && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detail Proyek: ${selectedCard.name}`}
          className="kaldev-scope fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="h-full w-[min(520px,100vw)] overflow-y-auto p-6 shadow-2xl transition-transform animate-in slide-in-from-right duration-200 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="min-w-0">
                <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{selectedCard.id}</span>
                <h3 className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50 break-words">{selectedCard.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <IconClose />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <Eyebrow>Programmer</Eyebrow>
                <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedCard.programmer ?? "Belum ditugaskan"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Eyebrow>Basis</Eyebrow>
                  <div className="mt-1"><Chip tone="entity">{selectedCard.basis}</Chip></div>
                </div>
                <div>
                  <Eyebrow>Kategori</Eyebrow>
                  <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{selectedCard.kategori}</p>
                </div>
              </div>

              <div>
                <Eyebrow>Periode / Tanggal</Eyebrow>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{selectedCard.dateText}</p>
              </div>

              {selectedCard.showProgress && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    <span>Progres</span>
                    <span>{selectedCard.progress ?? 0}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${selectedCard.progress ?? 0}%`, minWidth: 4 }}
                    />
                  </div>
                </div>
              )}

              {selectedCard.flag && (
                <div>
                  <Eyebrow>Status Flag</Eyebrow>
                  <div className="mt-1">
                    <Chip tone={selectedCard.flag.tone}>{selectedCard.flag.text}</Chip>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
