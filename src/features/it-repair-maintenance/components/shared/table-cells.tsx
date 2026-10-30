import type { CSSProperties, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/** Sel dua baris: nama 12.5/700 di atas keterangan 11.5 muted (TableCellStack). */
export function CellStack({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <>
      <div className="dd-table__primary" title={typeof primary === "string" ? primary : undefined}>
        {primary}
      </div>
      {secondary && (
        <div className="dd-table__secondary" title={typeof secondary === "string" ? secondary : undefined}>
          {secondary}
        </div>
      )}
    </>
  );
}

/** Sel "mulai → selesai" (TableTimeline). */
export function Timeline({ start, end }: { start: ReactNode; end: ReactNode }) {
  return (
    <div className="dd-table__timeline">
      <span className="dd-table__date">{start}</span>
      <ArrowRight className="dd-table__arrow" aria-hidden="true" size={12} />
      <span className="dd-table__date dd-table__date--end">{end}</span>
    </div>
  );
}

/** Grid metadata di baris expand: label mikro kapital di atas nilai 12/600 (TableMeta). */
export function TableMeta({ items, columns = 5 }: { items: { label: string; value: ReactNode }[]; columns?: number }) {
  return (
    <div className="dd-table__meta" style={{ "--meta-cols": columns } as CSSProperties}>
      {items.map((it, i) => (
        <div key={i}>
          <div className="dd-table__metalabel">{it.label}</div>
          <div className="dd-table__metaval">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

/** Panel putih di baris expand untuk teks panjang (TableLongPanel). */
export function TableLongPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="dd-table__longpanel">
      <div className="dd-table__metalabel">{label}</div>
      <div className="dd-table__longbody">{children}</div>
    </div>
  );
}

/** Tanggal dengan angka tabular (DateText). */
export function DateNum({ children }: { children: ReactNode }) {
  return <span className="dd-num">{children}</span>;
}
