"use client";

import BarCard from "@/components/shared/BarCard";
import type { BreakdownGroup } from "../services/distributionService";
import type { AssetFilterInput, BarDatum } from "@/types/asset-pm.types";

const META: Record<BreakdownGroup, { title: string; subtitle: string }> = {
  workstation: {
    title: "Workstation Breakdown",
    subtitle: "Rincian Notebook, Mini PC, dan PC",
  },
  infrastructure: {
    title: "Infrastructure Breakdown",
    subtitle: "Diurutkan terbanyak",
  },
  peripheral: {
    title: "Peripheral Breakdown",
    subtitle: "Diurutkan terbanyak",
  },
};

export default function BreakdownCard({
  group,
  initialItems,
  maxHeight = "max-h-[250px]",
}: {
  input: AssetFilterInput;
  group: BreakdownGroup;
  initialItems?: BarDatum[];
  maxHeight?: string;
}) {
  const meta = META[group];
  const items = initialItems || [];

  return (
    <BarCard
      title={meta.title}
      subtitle={meta.subtitle}
      items={items}
      className={`flex flex-col ${maxHeight}`}
      contentClassName="overflow-y-auto pr-1 flex-1"
    />
  );
}
