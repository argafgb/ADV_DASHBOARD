"use client";

import { PieChart } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { Donut, type DonutSlice } from "../ds/donut";
import type { CompositionData } from "../../types/overview.types";

const COLOR_MAP: Record<"brand" | "purple", string> = {
  brand: "var(--chart-blue-primary)",
  purple: "var(--chart-blue-light)",
};

export function CompositionDonut({ data }: { data: CompositionData }) {
  const slices: DonutSlice[] = data.items.map((item) => ({
    label: item.name,
    value: parseFloat(item.percentage.replace("%", "").replace(",", ".")) || 0,
    color: COLOR_MAP[item.color] ?? "var(--chart-blue-primary)",
    valueLabel: item.percentage,
  }));

  const mainSlice = slices[0];
  const centerValue = mainSlice ? `${mainSlice.value}%` : "–";
  const centerCaption = mainSlice ? mainSlice.label : "Lembur";

  return (
    <Card
      title="Komposisi lembur"
      subtitle="Berdasarkan jenis hari lembur (SPL vs IPL) · approved"
    >
      {data.items.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Belum Ada Data Komposisi"
          description="Data akan muncul setelah sinkronisasi dari HRIS selesai."
          height={260}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: 18,
            alignItems: "center",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Donut
              data={slices}
              centerValue={centerValue}
              centerCaption={centerCaption}
              size={156}
              stroke={24}
              total={100}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 8,
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: 12,
            }}
          >
            {data.items.map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span
                    className="dd-chart__dot dd-chart__dot--round"
                    style={{ background: COLOR_MAP[item.color] }}
                  />
                  <span
                    style={{
                      font: "var(--fw-semibold) 12px/1.3 var(--dd-font-sans)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
                <div
                  className="dd-num"
                  style={{
                    font: "var(--fw-regular) 11px/1 var(--dd-font-sans)",
                    color: "var(--text-muted)",
                    textAlign: "right",
                  }}
                >
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
