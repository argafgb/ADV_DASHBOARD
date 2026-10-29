"use client";

import { useState, useMemo } from "react";
import { BlueprintStatus, FsdBlueprintItem } from "../types/fsdBlueprint.types";
import {
  calculateKpis,
  calculateOwnerBreakdown,
  calculatePicWorkloads,
  calculateQuarterBreakdown,
  calculateScopeComposition,
  calculateStatusCounts,
} from "../utils/fsdCalculations";
import { FsdKpiGrid } from "./FsdKpiGrid";
import { FsdStatusDonutCard } from "./FsdStatusDonutCard";
import { FsdQuarterDistributionCard } from "./FsdQuarterDistributionCard";
import { FsdTopContributorsCard } from "./FsdTopContributorsCard";
import { FsdOwnerDistributionCard } from "./FsdOwnerDistributionCard";
import { FsdWorkloadCard } from "./FsdWorkloadCard";
import { FsdScopeCompositionCard } from "./FsdScopeCompositionCard";
import { FsdDataTable } from "./FsdDataTable";
import { FsdProjectListModal } from "./FsdProjectListModal";

interface FsdBlueprintClientProps {
  items: FsdBlueprintItem[];
}

export function FsdBlueprintClient({ items }: FsdBlueprintClientProps) {
  const [modalStatus, setModalStatus] = useState<
    BlueprintStatus | "all" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cross-component table filter synchronization
  const [tableStatusFilter, setTableStatusFilter] = useState<string>("all");
  const [tablePicFilter, setTablePicFilter] = useState<string>("all");

  const kpis = useMemo(() => calculateKpis(items), [items]);
  const statusCounts = useMemo(() => calculateStatusCounts(items), [items]);
  const quarterBreakdown = useMemo(
    () => calculateQuarterBreakdown(items),
    [items],
  );
  const ownerBreakdown = useMemo(() => calculateOwnerBreakdown(items), [items]);
  const picWorkloads = useMemo(() => calculatePicWorkloads(items), [items]);
  const scopeComposition = useMemo(
    () => calculateScopeComposition(items),
    [items],
  );

  const handleOpenModal = (status: BlueprintStatus | "all") => {
    setModalStatus(status);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectPicFromContributor = (picName: string) => {
    setTablePicFilter(picName);
    // Smooth scroll down to table
    const tableEl = document.getElementById("fsd-data-table");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col gap-4 select-none font-sans">
      {/* KPI GRID */}
      <section>
        <FsdKpiGrid kpis={kpis} onSelectStatus={handleOpenModal} />
      </section>

      {/* ROW 2: STATUS DONUT + QUARTER DISTRIBUTION + TOP CONTRIBUTORS */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FsdStatusDonutCard
            statusCounts={statusCounts}
            onSelectStatus={handleOpenModal}
          />
        </div>
        <div className="lg:col-span-5">
          <FsdQuarterDistributionCard quarterData={quarterBreakdown} />
        </div>
        <div className="lg:col-span-3">
          <FsdTopContributorsCard
            workloads={picWorkloads}
            onSelectPic={handleSelectPicFromContributor}
          />
        </div>
      </section>

      {/* ROW 3: OWNER BREAKDOWN + WORKLOAD + SCOPE COMPOSITION */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <FsdOwnerDistributionCard ownerData={ownerBreakdown} />
        </div>
        <div className="lg:col-span-4">
          <FsdWorkloadCard
            workloads={picWorkloads}
            onSelectPic={handleSelectPicFromContributor}
          />
        </div>
        <div className="lg:col-span-3">
          <FsdScopeCompositionCard composition={scopeComposition} />
        </div>
      </section>

      {/* ROW 4: DATA TABLE */}
      <section id="fsd-data-table" className="scroll-mt-18">
        <FsdDataTable
          items={items}
          filterStatus={tableStatusFilter}
          onFilterStatusChange={setTableStatusFilter}
          filterPic={tablePicFilter}
          onFilterPicChange={setTablePicFilter}
        />
      </section>

      {/* DETAIL MODAL */}
      <FsdProjectListModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        status={modalStatus}
        items={items}
        onApplyFilterToTable={(st) => {
          setTableStatusFilter(st);
          const tableEl = document.getElementById("fsd-data-table");
          if (tableEl) {
            tableEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      />
    </div>
  );
}
