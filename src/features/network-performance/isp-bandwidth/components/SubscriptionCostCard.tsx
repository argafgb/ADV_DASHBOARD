"use client";

import React from "react";
import SectionCard, {
  CardTitle,
} from "@/features/network-performance/components/SectionCard";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import CostByVendorList from "./CostByVendorList";
import TopCostBranchesList from "./TopCostBranchesList";
import type {
  IspCostKpi,
  IspCostVendorRow,
  IspCostBranchTopRow,
} from "../types/isp-cost.types";

export default function SubscriptionCostCard({
  year,
  kpis,
  vendors,
  topBranches,
}: {
  year: number;
  kpis: IspCostKpi[];
  vendors: IspCostVendorRow[];
  topBranches: IspCostBranchTopRow[];
}) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  return (
    <SectionCard>
      {/* Title */}
      <CardTitle
        title="Subscription cost summary"
        subtitle={`Ke mana biaya langganan internet mengalir, dirinci per vendor dan per cabang · kontrak berjalan ${year}`}
        subtitleMarginBottom="16px"
      />

      {/* 4 KPIs Row */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          marginBottom: "20px",
          paddingBottom: "18px",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        {kpis.map((k, idx) => (
          <div
            key={k.label}
            onMouseEnter={(e) => tipEnter(e, k.tip, "none")}
            onMouseMove={(e) => tipMove(e)}
            onMouseLeave={() => tipLeave()}
            style={{
              flex: 1,
              padding: "0 20px",
              borderLeft:
                idx === 0 ? "none" : "1px solid var(--border-subtle)",
              cursor: "default",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: ".05em",
                fontWeight: 700,
                color: "var(--text-placeholder)",
              }}
            >
              {k.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "23px",
                fontWeight: 800,
                lineHeight: 1.15,
                marginTop: "5px",
                color: "var(--accent)",
                whiteSpace: "nowrap",
              }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Progress Lists */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
        }}
      >
        <CostByVendorList rows={vendors} />
        <TopCostBranchesList rows={topBranches} />
      </div>
    </SectionCard>
  );
}
