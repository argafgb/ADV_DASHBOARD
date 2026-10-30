import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "../shared/card";
import {
  IconAlert,
  IconClock,
  IconHold,
  IconQueue,
  IconTeam,
  IconUserX,
} from "../shared/icons";
import type { AttentionItem, AttentionKind } from "../../types/kaldev.types";

const ICON: Record<AttentionKind, ReactNode> = {
  late: <IconAlert />,
  near: <IconClock />,
  nodev: <IconUserX />,
  idle: <IconQueue />,
  hold: <IconHold />,
  team: <IconTeam />,
};

/** "Perlu perhatian" — daftar prioritas tindak lanjut, maksimal lima baris. */
export function AttentionCard({ items }: { items: AttentionItem[] }) {
  return (
    <Card
      title="Perlu perhatian"
      subtitle="Urutan prioritas tindak lanjut hari ini"
      bodyStyle={{ display: "grid", gap: 0, alignContent: "start", gridTemplateColumns: "minmax(0,1fr)" }}
    >
      {items.length === 0 ? (
        <div className="dd-empty">
          <div className="dd-empty__title">Tidak ada yang perlu ditindaklanjuti</div>
          <div className="dd-empty__msg">Semua proyek sesuai jalur.</div>
        </div>
      ) : (
        items.map((a) => (
          <div
            key={a.kind}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              padding: "11px 2px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 8,
                flex: "0 0 auto",
                background: `var(--status-${a.tone}-bg)`,
                color: `var(--status-${a.tone}-fg)`,
              }}
            >
              <span style={{ display: "inline-flex", width: 15, height: 15 }}>{ICON[a.kind]}</span>
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                font: "600 12.5px/1.45 var(--dd-font-sans)",
                color: "var(--text-primary)",
                textWrap: "pretty",
              }}
            >
              {a.text}
            </span>
            <Link
              href={a.href}
              scroll={false}
              style={{
                flex: "0 0 auto",
                padding: "5px 0 0",
                font: "600 11.5px/1 var(--dd-font-sans)",
                color: "var(--dd-accent)",
              }}
            >
              Lihat
            </Link>
          </div>
        ))
      )}
    </Card>
  );
}
