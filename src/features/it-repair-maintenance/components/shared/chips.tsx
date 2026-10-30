import type { ReactNode } from "react";

import type { Tone } from "@/features/it-repair-maintenance/types/it-repair.types";

/**
 * `.dd-chip` — label kecil bersudut. `variant="entity"` untuk nama entitas
 * (cabang, lokasi, jenis pekerjaan); `tone` untuk hasil (Usable, Damaged, …).
 */
export function Chip({
  tone = "gray",
  variant = "tone",
  title,
  children,
}: {
  tone?: Tone;
  variant?: "tone" | "entity";
  title?: string;
  children: ReactNode;
}) {
  const cls = variant === "entity" ? "dd-chip dd-chip--entity" : `dd-chip dd-chip--${tone}`;
  return (
    <span className={cls} title={title}>
      {children}
    </span>
  );
}

/** `.dd-pill` — status berbentuk pil dengan titik warna. */
export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`dd-pill dd-pill--${tone}`}>
      <span className="dd-pill__dot" />
      {children}
    </span>
  );
}

/** `.dd-count` — jumlah di samping judul tabel/kartu ("154 repair"). */
export function CountPill({ children }: { children: ReactNode }) {
  return <span className="dd-count">{children}</span>;
}
