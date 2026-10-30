"use client";

import { useMemo } from "react";
import { Card } from "../Card";
import { buildCertifications } from "../../utils/build-certifications";
import { CertExpiryChart } from "../certifications/CertExpiryChart";
import { CertStatCard } from "../certifications/CertStatCard";
import { useLearningGrowth } from "../../context/LearningGrowthFilterContext";

/** Sertifikasi: three mini stats and a Gantt-style validity chart. */
export function CertificationsView() {
  const { data } = useLearningGrowth();
  const model = useMemo(() => buildCertifications(data), [data]);

  return (
    <div className="flex flex-col gap-[15px]">
      <div className="dh-fade-up-fast grid min-w-0 grid-cols-1 gap-[13px] min-[420px]:grid-cols-2 lg:grid-cols-3">
        <CertStatCard
          label="Total Sertifikasi"
          value={model.stats.total.value}
          note={model.stats.total.note}
        />
        <CertStatCard
          label="Aktif"
          value={model.stats.active.value}
          valueColor="#059669"
          note={model.stats.active.note}
        />
        <CertStatCard
          label="Expiry Terdekat"
          valueText={model.stats.nearest.text}
          sub={model.stats.nearest.sub}
          note={model.stats.nearest.note}
        />
      </div>
      <div className="dh-fade-up dh-delay-10">
        <Card title="Certificate Validity" subtitle="Masa berlaku dan status sertifikasi">
          <CertExpiryChart certs={model.cards} />
        </Card>
      </div>
    </div>
  );
}

export default CertificationsView;
