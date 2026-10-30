"use client";

import { Clock3, Users, Gauge, Banknote, type LucideIcon } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { DeltaChip } from "../ds/delta-chip";
import type { KpiCardData } from "../../types/overview.types";

const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock3,
  users: Users,
  gauge: Gauge,
  banknote: Banknote,
};

const TONE_TILE: Record<KpiCardData["tone"], React.CSSProperties | undefined> = {
  blue: undefined,
  green: {
    background: "var(--status-green-bg)",
    color: "var(--status-green-fg)",
  },
  amber: {
    background: "var(--status-amber-bg)",
    color: "var(--status-amber-fg)",
  },
};

export function KpiCards({ data }: { data: KpiCardData[] }) {
  if (data.length === 0) {
    return (
      <article className="dd-card">
        <EmptyState
          icon={Gauge}
          title="Belum Ada Data Lembur"
          description="Data akan muncul setelah sinkronisasi dari HRIS selesai."
          height={132}
        />
      </article>
    );
  }

  return (
    <div className="dd-kpi-grid dd-kpi-grid--4">
      {data.map((kpi, index) => {
        const Icon = ICON_MAP[kpi.icon] ?? Clock3;
        const isAccent = index === 0;

        return (
          <article
            key={kpi.label}
            className={isAccent ? "dd-kpi dd-kpi--accent" : "dd-kpi"}
          >
            {kpi.deltaAvailable && (
              <span className="dd-kpi__delta">
                <DeltaChip
                  direction={kpi.deltaDirection}
                  tone={kpi.deltaTone}
                  onAccent={isAccent}
                >
                  {kpi.deltaValue}
                </DeltaChip>
              </span>
            )}

            <div className="dd-kpi__top">
              <span className="dd-kpi__tile" style={TONE_TILE[kpi.tone]}>
                <Icon />
              </span>
              <span className="dd-kpi__label">{kpi.label}</span>
            </div>

            <div className="dd-kpi__row">
              <span className="dd-kpi__value">{kpi.value}</span>
              {kpi.deltaAvailable && kpi.deltaLabel && (
                <span className="dd-kpi__sub">{kpi.deltaLabel}</span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
