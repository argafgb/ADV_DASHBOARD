import type { ReactNode } from "react";

import { Chip, StatusPill } from "./chips";
import type { TableColumn } from "./data-table";
import { CellStack, DateNum, TableLongPanel, TableMeta, Timeline } from "./table-cells";
import { fmt } from "@/features/it-repair-maintenance/utils/format";
import { RESULT_TONE, STATUS_TONE, type TableRow } from "@/features/it-repair-maintenance/types/it-repair.types";

/** Teks pengganti nilai kosong, persis seperti desain. */
export const NR = "Tidak tercatat";

/** Kolom tabel Repair tickets (lebar dari desain, minWidth 1080). */
export const REPAIR_COLS: TableColumn[] = [
  { key: "$index", label: "No", width: "48px" },
  { key: "ticket", label: "Ticket", width: "minmax(0,2fr)" },
  { key: "item", label: "Item", width: "minmax(0,1.1fr)" },
  { key: "branch", label: "Branch", width: "minmax(0,0.9fr)" },
  { key: "pic", label: "Repair PIC", width: "minmax(0,0.8fr)" },
  { key: "timeline", label: "Timeline", width: "minmax(0,1.7fr)" },
  { key: "result", label: "Result", width: "110px" },
  { key: "status", label: "Status", width: "124px" },
  { key: "updated", label: "Last update", width: "172px" },
];

/** Kolom tabel Golden Unit: Ticket → Unit (barcode), Branch → Location. */
export const GOLDEN_COLS: TableColumn[] = REPAIR_COLS.map((c) =>
  c.key === "ticket"
    ? { key: "unit", label: "Unit", width: "minmax(0,2fr)" }
    : c.key === "branch"
      ? { key: "location", label: "Location", width: "minmax(0,0.9fr)" }
      : c,
);

/** Kolom modal "Records" (drill-down dari chart Overview, minWidth 880). */
export const MODAL_COLS: TableColumn[] = [
  { key: "$index", label: "No", width: "48px" },
  { key: "ticket", label: "Record", width: "minmax(0,2fr)" },
  { key: "item", label: "Item", width: "minmax(0,1.1fr)" },
  { key: "workType", label: "Work type", width: "minmax(0,0.9fr)" },
  { key: "pic", label: "Repair PIC", width: "minmax(0,0.8fr)" },
  { key: "timeline", label: "Timeline", width: "minmax(0,1.6fr)" },
  { key: "result", label: "Result", width: "110px" },
  { key: "status", label: "Status", width: "124px" },
  { key: "updated", label: "Last update", width: "172px" },
];

/** Kolom modal "User repairs · umur sejak input". */
export const AGE_COLS: TableColumn[] = [
  { key: "$index", label: "No", width: "48px" },
  { key: "ticket", label: "Ticket", width: "minmax(0,1.8fr)" },
  { key: "owner", label: "Asset owner", width: "minmax(0,1.1fr)" },
  { key: "item", label: "Item", width: "minmax(0,1fr)" },
  { key: "input", label: "Input", width: "minmax(0,1.1fr)" },
  { key: "age", label: "Age", width: "110px" },
  { key: "pic", label: "Repair PIC", width: "minmax(0,0.8fr)" },
  { key: "status", label: "Status", width: "124px" },
  { key: "updated", label: "Last update", width: "172px" },
];

const or = (v: string | null | undefined) => v ?? NR;

/** Sel per kolom, port dari `renderCell` di skrip desain. */
export function renderRecordCell(row: TableRow, col: TableColumn): ReactNode {
  switch (col.key) {
    case "ticket":
      return <CellStack primary={row.ticket ?? "Tanpa nomor tiket"} secondary={or(row.problem)} />;
    case "unit":
      return <CellStack primary={or(row.barcode)} secondary={or(row.problem)} />;
    case "item":
      return <CellStack primary={or(row.item)} secondary={or(row.model)} />;
    case "branch":
      return (
        <Chip variant="entity" title={or(row.branch)}>
          {or(row.branch)}
        </Chip>
      );
    case "location":
      return (
        <Chip variant="entity" title={or(row.location)}>
          {or(row.location)}
        </Chip>
      );
    case "workType":
      return <Chip variant="entity">{row.workType}</Chip>;
    case "pic":
      return (
        <div className="dd-table__person" title={row.pic ?? undefined}>
          {or(row.pic)}
        </div>
      );
    case "timeline":
      return (
        <Timeline
          start={row.startText ? <DateNum>{row.startText}</DateNum> : NR}
          end={row.doneText ? <DateNum>{row.doneText}</DateNum> : "Belum selesai"}
        />
      );
    case "result":
      return row.result === "In process" ? (
        <span style={{ color: "var(--text-lightest)" }}>—</span>
      ) : (
        <Chip tone={RESULT_TONE[row.result]}>{row.result}</Chip>
      );
    case "status":
      return <StatusPill tone={STATUS_TONE[row.status]}>{row.status}</StatusPill>;
    case "input":
      return (
        <CellStack
          primary={<DateNum>{row.dateText}</DateNum>}
          secondary={row.adminPic ? `Admin: ${row.adminPic}` : `Admin ${NR.toLowerCase()}`}
        />
      );
    case "age": {
      const color = row.open && row.ageDays > 14 ? "var(--status-red-fg)" : row.open ? "var(--status-amber-fg)" : "var(--text-primary)";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ font: "600 13px/1.2 var(--dd-font-sans)", fontVariantNumeric: "tabular-nums", color }}>
            {fmt(row.ageDays)} hari
          </span>
          <span style={{ font: "400 11.5px/1.2 var(--dd-font-sans)", color: "var(--text-placeholder)" }}>
            {row.open ? "masih terbuka" : "sampai selesai"}
          </span>
        </div>
      );
    }
    case "owner":
      return <CellStack primary={or(row.owner)} secondary={or(row.branch)} />;
    case "updated":
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingRight: 6 }}>
          <span
            style={{
              font: "400 12.5px/1.2 var(--dd-font-sans)",
              color: "var(--text-placeholder)",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {row.lastUpdateText ? <DateNum>{row.lastUpdateText}</DateNum> : NR}
          </span>
          <svg
            className="ir-chev"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: "none" }}
            aria-hidden
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </div>
      );
    default:
      return null;
  }
}

function handlingText(row: TableRow): string {
  const base = row.handling ?? `Penanganan ${NR.toLowerCase()}`;
  const parts = `\n\nParts used: ${row.parts ?? NR.toLowerCase()}`;
  const note = row.workType === "Golden Unit" && row.resultNote ? `\n\nResult note: ${row.resultNote}` : "";
  return base + parts + note;
}

/** Baris expand: metadata (7 item) + panel Handling, sama untuk tabel dan modal. */
export function RecordExpanded({ row }: { row: TableRow }) {
  return (
    <>
      <TableMeta
        items={[
          { label: "Asset owner", value: or(row.owner) },
          { label: "Barcode", value: or(row.barcode) },
          { label: "Location", value: or(row.location) },
          { label: "Ownership", value: or(row.ownership) },
          { label: "Admin PIC", value: or(row.adminPic) },
          { label: "Turnaround", value: row.turnaround != null ? `${fmt(row.turnaround)} hari` : NR },
          { label: "Returned to admin", value: row.returnedText ? <DateNum>{row.returnedText}</DateNum> : NR },
        ]}
      />
      <TableLongPanel label="Handling">{handlingText(row)}</TableLongPanel>
    </>
  );
}
