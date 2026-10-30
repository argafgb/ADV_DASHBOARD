"use client";

import { PieChart } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { Donut } from "../ds/donut";
import { DeltaChip } from "../ds/delta-chip";
import type { ComparisonCardData } from "../../types/organization.types";

const DONUT_SIZE = 152;
const DONUT_STROKE = 30;

function StatPanel({
  eyebrow,
  badge,
  title,
  subtitle,
  value,
  detail,
}: {
  eyebrow: string;
  badge?: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      className="dd-panel"
      style={{ display: "grid", gap: 10, alignContent: "start" }}
    >
      {badge ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span className="dd-eyebrow" style={{ whiteSpace: "nowrap" }}>
            {eyebrow}
          </span>
          {badge}
        </div>
      ) : (
        <div className="dd-eyebrow">{eyebrow}</div>
      )}

      <div>
        <div
          style={{
            font: "var(--fw-semibold) 17px/1.25 var(--dd-font-sans)",
            letterSpacing: "var(--ls-tight)",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 3,
            font: "var(--fw-regular) 11.5px/1.4 var(--dd-font-sans)",
            color: "var(--text-placeholder)",
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
          paddingTop: 10,
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="dd-num"
          style={{
            font: "var(--fw-num) 20px/1 var(--dd-font-sans)",
            letterSpacing: "var(--ls-display)",
            color: "var(--text-primary)",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          {value}
        </span>
        <span
          style={{
            font: "var(--fw-regular) 11.5px/1 var(--dd-font-sans)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}

export function HoVsOps({ data }: { data: ComparisonCardData }) {
  return (
    <Card
      className="dd-orgcard"
      title="Lembur per unit organisasi"
      subtitle="Komposisi HO vs OPS beserta kontributor dan kenaikan tertinggi pada periode aktif"
    >
      {data.segments.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Tidak Ada Data Pada Periode Ini"
          description="Komposisi HO vs OPS akan muncul setelah ada lembur approved. Coba ubah filter tahun, bulan, atau area."
          height={240}
        />
      ) : (
        <div className="dd-org-top">
          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            <div className="dd-donut-split">
              <Donut
                data={data.segments.map((seg) => ({
                  label: seg.label,
                  value: seg.hours,
                  color: seg.color,
                  valueLabel: seg.hoursLabel,
                }))}
                size={DONUT_SIZE}
                stroke={DONUT_STROKE}
                centerValue={data.totalLabel}
                centerCaption="jam approved"
                legend={false}
                total={data.totalHours}
              />

              <div style={{ display: "grid", gap: 10, alignContent: "center" }}>
                {data.segments.map((seg) => (
                  <div key={seg.label} style={{ display: "grid", gap: 3 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                      }}
                    >
                      <i
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flex: "none",
                          background: seg.color,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          font: "var(--fw-semibold) 12.5px/1.3 var(--dd-font-sans)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {seg.label}
                      </span>
                      <span
                        className="dd-num"
                        style={{
                          font: "var(--fw-num) 13px/1 var(--dd-font-sans)",
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          flex: "none",
                        }}
                      >
                        {seg.percentage}%
                      </span>
                    </div>

                    <div
                      className="dd-num"
                      style={{
                        paddingLeft: 17,
                        font: "var(--fw-regular) 11.5px/1.3 var(--dd-font-sans)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {seg.hoursLabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <StatPanel
            eyebrow="Kontributor tertinggi"
            title={data.topContributor.label}
            subtitle={data.topContributor.subtitle}
            value={data.topContributor.hoursLabel}
            detail={data.topContributor.detail}
          />

          <StatPanel
            eyebrow="Kenaikan tertinggi"
            badge={
              data.topIncrease.delta ? (
                <DeltaChip direction="up" tone="down">
                  {data.topIncrease.delta}
                </DeltaChip>
              ) : undefined
            }
            title={data.topIncrease.label}
            subtitle={data.topIncrease.subtitle}
            value={data.topIncrease.hoursLabel}
            detail={data.topIncrease.detail}
          />
        </div>
      )}
    </Card>
  );
}
