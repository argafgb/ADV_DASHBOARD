"use client";

import type { RootCauseItem } from "../types/rootCause.types";
import TopRootCauseCard from "./TopRootCauseCard";
import EmptyState from "@/components/shared/EmptyState";
import { AlertCircle } from "lucide-react";

interface TopRootCauseSectionProps {
  data: RootCauseItem[];
  onSelect: (item: RootCauseItem) => void;
}

export default function TopRootCauseSection({
  data,
  onSelect,
}: TopRootCauseSectionProps) {
  const top3Data = data.slice(0, 3);
  const title = top3Data.length > 0 ? "Top 3 Root Causes" : "Top Root Causes";

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>

      {top3Data.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="Data Root Cause Belum Tersedia"
          description="Data root cause belum tersedia untuk filter terpilih"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {top3Data.map((item) => (
            <TopRootCauseCard
              key={item.name}
              item={item}
              onClick={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
