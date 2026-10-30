"use client";

import { useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import type { OrgUnit } from "../../types/organization.types";

interface UnitRankingProps {
  opsUnits: OrgUnit[];
  hoUnits: OrgUnit[];
}

type Tab = "ops" | "ho";

const TABS: { value: Tab; label: string }[] = [
  { value: "ops", label: "OPS" },
  { value: "ho", label: "HO" },
];

export function UnitRanking({ opsUnits, hoUnits }: UnitRankingProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ops");
  const [drillName, setDrillName] = useState<string | null>(null);

  const units = activeTab === "ops" ? opsUnits : hoUnits;
  const drillUnit = units.find((u) => u.name === drillName) ?? null;

  const tabs = (
    <div className="dd-seg" role="tablist" aria-label="Area unit">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          className={`dd-seg__btn${activeTab === tab.value ? " dd-seg__btn--active" : ""}`}
          onClick={() => {
            setActiveTab(tab.value);
            setDrillName(null);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <Card
      title="Unit dengan lembur tertinggi"
      subtitle="Jam dan biaya approved pada periode aktif; kartu ini selalu memeringkat seluruh unit, di luar filter Area dan unit. Klik unit untuk membuka rinciannya."
      actions={tabs}
    >
      {units.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tidak Ada Data Pada Periode Ini"
          description={`Belum ada unit ${activeTab === "ops" ? "OPS" : "HO"} dengan lembur approved. Coba ubah filter tahun atau bulan.`}
          height={220}
        />
      ) : (
        <div style={{ display: "grid", gap: 11 }}>
          {units.map((unit) => (
            <button
              key={unit.name}
              type="button"
              onClick={() =>
                setDrillName(drillName === unit.name ? null : unit.name)
              }
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,148px) minmax(0,1fr) auto",
                gap: 12,
                alignItems: "center",
                width: "100%",
                padding: "6px 0",
                border: 0,
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <span
                style={{
                  font: "var(--fw-semibold) 12.5px/1.3 var(--dd-font-sans)",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {unit.name}
              </span>

              <span
                style={{
                  height: 18,
                  borderRadius: 999,
                  background: "var(--chart-gray-track)",
                  display: "block",
                }}
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${Math.min(100, Math.max(0, unit.rank))}%`,
                    minWidth: 4,
                    borderRadius: 999,
                    background: "var(--chart-blue-primary)",
                  }}
                />
              </span>

              <span
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "flex-end",
                  gap: 8,
                  minWidth: 142,
                }}
              >
                <span
                  className="dd-num"
                  style={{
                    font: "var(--fw-num) 12px/1 var(--dd-font-sans)",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {unit.cost}
                </span>
                <span
                  className="dd-num"
                  style={{
                    font: "var(--fw-regular) 11px/1 var(--dd-font-sans)",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {unit.hours}
                </span>
              </span>
            </button>
          ))}

          {drillUnit && (
            <div
              style={{
                marginTop: 4,
                paddingTop: 13,
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    font: "var(--fw-semibold) 12.5px/1.3 var(--dd-font-sans)",
                    color: "var(--text-primary)",
                  }}
                >
                  {drillUnit.name}{" "}
                  <ArrowRight
                    aria-hidden="true"
                    size={13}
                    style={{ display: "inline", verticalAlign: "-2px" }}
                  />{" "}
                  {activeTab === "ops" ? "cabang" : "department"}
                </div>
                <div
                  style={{
                    font: "var(--text-card-subtitle)",
                    color: "var(--text-placeholder)",
                  }}
                >
                  Jam &amp; biaya
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {drillUnit.children.map((child) => (
                  <span
                    key={child}
                    className="dd-num"
                    style={{
                      padding: "7px 9px",
                      borderRadius: 8,
                      background: "var(--accent-tint)",
                      color: "var(--accent-darker)",
                      font: "var(--fw-medium) 11.5px/1 var(--dd-font-sans)",
                    }}
                  >
                    {child}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
