import type { ReactNode } from "react";

/**
 * Baris judul halaman dari desain: judul + subjudul di kiri, kontrol (filter
 * "Project dari", toggle Kanban/Table) rata kanan pada baris yang sama.
 */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "14px 32px", flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <h1 className="dd-page__title">{title}</h1>
        <p className="dd-page__subtitle">{subtitle}</p>
      </div>
      {right && (
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {right}
        </div>
      )}
    </div>
  );
}
