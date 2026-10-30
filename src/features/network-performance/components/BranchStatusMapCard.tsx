"use client";

import React, { useMemo, useState } from "react";
import SectionCard, { CardTitle } from "./SectionCard";
import IndonesiaMap from "./IndonesiaMap";
import RegionSummaryPanel from "./RegionSummaryPanel";
import RegionModal from "./modals/RegionModal";
import { periodLabel } from "../services/labels";
import { useNetworkData } from "../context/NetworkDataContext";
import { useFilters } from "@/features/network-performance/context/NetworkFilterContext";

/** Legend titik peta status SLA — persis markup sumber. */
export function MapLegend() {
  const item = (color: string, label: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: color,
        }}
      />
      {label}
    </span>
  );
  return (
    <div style={{ display: "flex", gap: "16px" }}>
      {item("#059669", "Capai target")}
      {item("#D97706", "Mendekati")}
      {item("#DC2626", "Dibawah SLA")}
    </div>
  );
}

/**
 * Card peta status cabang + panel region — dipakai Overview ("Sebaran status
 * cabang") dan SLA by site ("Peta sebaran cabang"). Klik region membuka
 * modal detail; filter peta via tombol di modal; "Reset filter" menghapus.
 */
export default function BranchStatusMapCard({
  title,
  subtitleSuffix,
  view,
}: {
  title: string;
  subtitleSuffix?: string;
  view: string;
}) {
  const { tahun, bulan, bulanMonths, scope } = useFilters();
  const { map, region, periods } = useNetworkData();
  const [mapRegion, setMapRegion] = useState<string | null>(null);
  const [regionModal, setRegionModal] = useState<string | null>(null);

  const points = useMemo(
    () => map.mapPointsAll(tahun, bulan, scope, mapRegion, bulanMonths),
    [map, tahun, bulan, scope, mapRegion, bulanMonths],
  );
  const regions = useMemo(
    () => region.regionBreakdown(tahun, bulan, bulanMonths),
    [region, tahun, bulan, bulanMonths],
  );
  const pl = periodLabel(tahun, bulan, scope, periods.monthsByYear[tahun] ?? [], bulanMonths);
  // Signature persis sumber: view|tahun|bulan|scope|mapRegion|dtCause|len
  const sig =
    view +
    "|" +
    tahun +
    "|" +
    bulan +
    "|" +
    scope +
    "|" +
    mapRegion +
    "|" +
    null +
    "|" +
    points.length;

  const rmRow = regions.find((r) => r.name === regionModal);

  return (
    <SectionCard>
      <div
        className="network-card-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <CardTitle
          title={title}
          subtitle={"Status SLA per cabang · " + pl + (subtitleSuffix ?? "")}
        />
        <MapLegend />
      </div>
      <div className="network-map-wrap">
        <IndonesiaMap points={points} minHeight={380} sig={sig} />
      </div>
      <RegionSummaryPanel
        rows={regions}
        mapRegion={mapRegion}
        onClearMapRegion={() => setMapRegion(null)}
        onRegionClick={(name) => setRegionModal(name)}
      />
      {regionModal && (
        <RegionModal
          rmName={regionModal}
          row={rmRow}
          tahun={tahun}
          bulan={bulan}
          periodLabel={pl}
          mapRegion={mapRegion}
          onToggleFilter={() => {
            setMapRegion(mapRegion === regionModal ? null : regionModal);
            setRegionModal(null);
          }}
          onClose={() => setRegionModal(null)}
        />
      )}
    </SectionCard>
  );
}
