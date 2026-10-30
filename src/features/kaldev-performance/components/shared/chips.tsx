import type { ReactNode } from "react";

import type { StatusTone } from "../../types/kaldev.types";

export type ChipTone = StatusTone | "entity";

/** `.dd-chip` — label kecil bersudut (kategori, basis, status target). */
export function Chip({ tone, children, title }: { tone: ChipTone; children: ReactNode; title?: string }) {
  return (
    <span className={`dd-chip dd-chip--${tone}`} title={title}>
      {children}
    </span>
  );
}

/** `.dd-pill` — status berbentuk pil dengan titik warna. */
export function Pill({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span className={`dd-pill dd-pill--${tone}`}>
      <span className="dd-pill__dot" />
      {children}
    </span>
  );
}

/** `.dd-count` — jumlah di samping judul tabel ("12 proyek"). */
export function Count({ children }: { children: ReactNode }) {
  return <span className="dd-count">{children}</span>;
}
