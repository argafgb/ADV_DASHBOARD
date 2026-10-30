"use client";

import {
  Clock3,
  Gauge,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { idNum } from "../ds/chart-utils";
import { RepeatEmployees } from "./repeat-employees";
import type { RepeatEmployee, RiskBox } from "../../types/employee.types";

const ICONS: Record<NonNullable<RiskBox["icon"]>, LucideIcon> = {
  users: Users,
  clock: Clock3,
  gauge: Gauge,
};

const TILE: Record<NonNullable<RiskBox["tone"]>, React.CSSProperties> = {
  red: {
    background: "var(--status-red-bg)",
    color: "var(--status-red-fg)",
  },
  amber: {
    background: "var(--status-amber-bg)",
    color: "var(--status-amber-fg)",
  },
};

const DEFAULTS = [
  { tone: "red", icon: "users" },
  { tone: "amber", icon: "clock" },
  { tone: "amber", icon: "gauge" },
] as const satisfies readonly {
  tone: NonNullable<RiskBox["tone"]>;
  icon: NonNullable<RiskBox["icon"]>;
}[];

export function ComplianceRiskAndRepeat({
  boxes,
  total,
  repeating,
  onSelect,
}: {
  boxes: RiskBox[];
  total: number;
  repeating: RepeatEmployee[];
  onSelect: (employeeId: string) => void;
}) {
  return (
    <Card
      title="Pola berulang & risiko kepatuhan"
      subtitle="Karyawan dengan lembur berulang beserta indikasi transaksi yang melewati threshold kebijakan"
      actions={
        <span className="dd-pill dd-pill--red">
          <span className="dd-pill__dot" />
          {idNum(total)} minggu terindikasi
        </span>
      }
    >
      <div style={{ display: "grid", gap: 18 }}>
        {boxes.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Belum Ada Indikasi Risiko"
            description="Data akan muncul setelah sinkronisasi dari HRIS selesai."
            height={160}
          />
        ) : (
          <div className="dd-risk-kpis">
            <div
              className="dd-kpi-grid"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 208px), 1fr))",
              }}
            >
              {boxes.map((box, i) => {
                const fallback = DEFAULTS[i] ?? DEFAULTS[DEFAULTS.length - 1];
                const tone = box.tone ?? fallback.tone;
                const Icon = ICONS[box.icon ?? fallback.icon];

                return (
                  <article key={box.title} className="dd-kpi">
                    <div className="dd-kpi__top">
                      <span className="dd-kpi__tile" style={TILE[tone]}>
                        <Icon />
                      </span>
                      <span className="dd-kpi__label">{box.title}</span>
                    </div>
                    <div className="dd-kpi__row">
                      <span className="dd-kpi__value">
                        {box.countLabel ?? idNum(box.count)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            font: "var(--fw-regular) 11.5px/1.5 var(--dd-font-sans)",
            color: "var(--text-placeholder)",
            textWrap: "pretty",
          }}
        >
          Ambang batas yang dipakai di sini masih perlu dikunci mengikuti
          kebijakan perusahaan serta ketentuan yang berlaku.
        </div>

        <RepeatEmployees repeating={repeating} onSelect={onSelect} />
      </div>
    </Card>
  );
}
