"use client";

import React, { useMemo, useState } from "react";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";
import { useNetworkData } from "@/features/network-performance/context/NetworkDataContext";
import { getHybridFinancials } from "../utils/costCalculations";
import { buildBranchModalData, ISLAND_AREA } from "../data/ispCostDataset";
import { rupiah } from "../utils/formatters";
import SubscriptionCostCard from "./SubscriptionCostCard";
import MonthlyCostBranchTable from "./MonthlyCostBranchTable";
import MonthlyCostProviderTable from "./MonthlyCostProviderTable";
import IspBranchDetailModal from "./modals/IspBranchDetailModal";
import IspRegionDetailModal from "./modals/IspRegionDetailModal";
import type { IspRegionModalData } from "../types/isp-cost.types";

export default function CostBudgetTab() {
  const { tahun, bulan, bulanMonths } = useFilters();
  const { internetCosts } = useNetworkData();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const financials = useMemo(() => {
    return getHybridFinancials(internetCosts || [], tahun, bulan, bulanMonths);
  }, [internetCosts, tahun, bulan, bulanMonths]);

  const branchModalData = useMemo(() => {
    if (!selectedBranch) return null;
    return buildBranchModalData(financials.branchRows, selectedBranch, tahun);
  }, [financials.branchRows, selectedBranch, tahun]);

  const regionModalData = useMemo<IspRegionModalData | null>(() => {
    if (!selectedRegion) return null;
    const names =
      financials.regionRows.find((row) => row.region === selectedRegion)
        ?.names ?? [];
    const rows = names
      .map((n) => {
        const links = financials.branchRows.find((r) => r.branch === n);
        const cost = links?.cost || 0;
        const linkCount = links?.linkN || 0;
        return {
          branch: n,
          links: linkCount + " link",
          cost: rupiah(cost),
          rawCost: cost,
        };
      })
      .sort((a, b) => b.rawCost - a.rawCost);

    const total = rows.reduce((a, r) => a + r.rawCost, 0);
    const mx = rows[0]?.rawCost || 1;

    return {
      region: selectedRegion,
      area: ISLAND_AREA[selectedRegion] || "",
      total: rupiah(total),
      subtitle: `${rows.length} cabang · ${names.reduce((a, n) => a + (financials.branchRows.find((r) => r.branch === n)?.linkN || 0), 0)} link`,
      rows: rows.map((r, i) => ({
        branch: r.branch,
        links: r.links,
        cost: r.cost,
        width: ((r.rawCost / mx) * 100).toFixed(1) + "%",
        color: i === 0 ? "var(--accent)" : "#93BBF7",
      })),
    };
  }, [financials.branchRows, financials.regionRows, selectedRegion]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--gap-section)",
      }}
    >
      {/* 1. Subscription Cost Summary Card */}
      <SubscriptionCostCard
        year={tahun}
        kpis={financials.kpis}
        vendors={financials.costVendors}
        topBranches={financials.costTopBranches}
      />

      {/* 2. Monthly Cost Per Branch Table & Region Summary */}
      <MonthlyCostBranchTable
        year={tahun}
        regionRows={financials.regionRows}
        branchRows={financials.branchRows}
        onSelectBranch={(branch) => setSelectedBranch(branch)}
        onSelectRegion={(region) => setSelectedRegion(region)}
      />

      {/* 3. Monthly Cost By Provider Table */}
      <MonthlyCostProviderTable
        year={tahun}
        providerRows={financials.providerRows}
        cellMax={financials.providerCellMax}
      />

      {/* Detail Modals */}
      <IspBranchDetailModal
        data={branchModalData}
        onClose={() => setSelectedBranch(null)}
      />
      <IspRegionDetailModal
        data={regionModalData}
        onClose={() => setSelectedRegion(null)}
      />
    </div>
  );
}
