"use client";

import { BarChart3 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import type { ParetoItem } from "../../types/overview.types";

export function ParetoChart({ data }: { data: ParetoItem[] }) {
  const maxHours = Math.max(...data.map((d) => d.hoursPct), 1);
  const maxCost = Math.max(...data.map((d) => d.costPct), 1);

  return (
    <Card
      title="Top penyebab lembur"
      subtitle="6 kategori teratas · porsi terhadap total approved periode"
    >
      {data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Belum Ada Data Penyebab Lembur"
          description="Data akan muncul setelah sinkronisasi dari HRIS selesai."
          height={260}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: 14,
            height: "100%",
            alignContent: "space-between",
          }}
        >
          {data.map((item) => (
            <div
              key={item.name}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,132px) minmax(0,1fr) 70px",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div className="dd-chart__cat">{item.name}</div>

              <div style={{ display: "grid", gap: 5 }}>
                <Track
                  width={(item.hoursPct / maxHours) * 100}
                  color="var(--chart-blue-primary)"
                />
                <Track
                  width={(item.costPct / maxCost) * 100}
                  color="var(--chart-blue-light)"
                />
              </div>

              <div
                className="dd-num"
                style={{
                  textAlign: "right",
                  font: "var(--fw-num) 11.5px/1 var(--dd-font-sans)",
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 8,
              borderTop: "1px solid var(--border-subtle)",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <LegendItem color="var(--chart-blue-primary)">% Jam</LegendItem>
              <LegendItem color="var(--chart-blue-light)">% Biaya</LegendItem>
            </div>
            <span
              style={{
                font: "var(--fw-regular) 11px/1 var(--dd-font-sans)",
                color: "var(--text-placeholder)",
              }}
            >
              Kolom kanan: jam% · biaya%
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

function Track({ width, color }: { width: number; color: string }) {
  return (
    <div
      style={{
        height: 6,
        background: "var(--chart-gray-track)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, width))}%`,
          minWidth: 4,
          height: "100%",
          borderRadius: 999,
          background: color,
        }}
      />
    </div>
  );
}

function LegendItem({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        font: "var(--fw-regular) 11px/1 var(--dd-font-sans)",
        color: "var(--text-muted)",
      }}
    >
      <i
        style={{
          width: 16,
          height: 4,
          borderRadius: 999,
          background: color,
          flex: "none",
        }}
      />
      {children}
    </span>
  );
}
