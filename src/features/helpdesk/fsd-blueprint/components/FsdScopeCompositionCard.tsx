"use client";

import {
  FsdScopeComposition,
  FsdScopeCompositionItem,
} from "../types/fsdBlueprint";
import { EmptyState } from "@/components/shared/EmptyState";
import { Layers } from "lucide-react";

interface FsdScopeCompositionCardProps {
  composition: FsdScopeComposition;
}

export function FsdScopeCompositionCard({
  composition,
}: FsdScopeCompositionCardProps) {
  const { docTypes, impacts } = composition;
  const hasData = docTypes.length > 0 || impacts.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-full min-h-75 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Scope Composition
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Tipe dokumen & dampak perubahan
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Tidak Ada Data Scope"
            description="Tidak ada data komposisi scope pada filter ini."
            icon={Layers}
          />
        </div>
      </div>
    );
  }

  const renderSection = (title: string, items: FsdScopeCompositionItem[]) => {
    const total =
      items.reduce(
        (acc: number, curr: FsdScopeCompositionItem) => acc + curr.count,
        0,
      ) || 1;
    return (
      <div className="flex flex-col gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </span>

        {/* Stacked bar */}
        <div className="flex h-3 w-full rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
          {items.map((item: FsdScopeCompositionItem) => (
            <div
              key={item.label}
              title={`${item.label}: ${item.count} (${item.percentage}%)`}
              className="h-full min-w-0.75 transition-all hover:brightness-110"
              style={{
                width: `${(item.count / total) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          ))}
        </div>

        {/* Legend items */}
        <div className="flex flex-col gap-1.5 mt-0.5">
          {items.map((item: FsdScopeCompositionItem) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 rounded-xs shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                {item.label}
              </span>
              <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">
                {item.count}
              </span>
              <span className="w-8 text-right text-[11px] text-zinc-400 dark:text-zinc-500">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70 gap-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Scope Composition
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Tipe dokumen & dampak perubahan
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1 justify-start">
        {docTypes.length > 0 && renderSection("Tipe Dokumen", docTypes)}
        {impacts.length > 0 && renderSection("Dampak Perubahan", impacts)}
      </div>
    </div>
  );
}
