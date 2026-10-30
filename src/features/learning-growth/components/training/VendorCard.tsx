"use client";

import { Building2 } from "lucide-react";
import { AnimatedBar, AnimatedValue } from "../ui/animated-value";
import { Card } from "../Card";
import type { TrainingModel } from "../../utils/build-training";
import { useTooltip } from "../../context/tooltip-provider";
import { EmptyState } from "@/components/shared/EmptyState";

/** "Vendor External" - horizontal split of external sessions per provider. */
export function VendorCard({ rows }: { rows: TrainingModel["vendor"]["rows"] }) {
  const { bind } = useTooltip();
  return (
    <Card title="Vendor External" subtitle="Sesi external per penyedia">
      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tidak Ada Data Vendor"
          description="Belum ada sesi pelatihan external dari vendor pada periode ini."
          height={180}
        />
      ) : (
        <div className="flex flex-col gap-[14px] pt-1">
          {rows.map((vendor) => (
            <div key={vendor.name} className="flex items-center gap-[10px]">
              <span className="w-[96px] flex-shrink-0 text-[12px] font-semibold break-words text-zinc-700 dark:text-zinc-300">
                {vendor.name}
              </span>
              <div
                className="h-[9px] flex-1 overflow-hidden rounded-full bg-[#EEF1F6] dark:bg-zinc-800"
                {...bind(
                  `${vendor.name} · ${vendor.count} sesi`,
                  vendor.sessions.length ? vendor.sessions : ["Belum ada sesi"],
                )}
              >
                <AnimatedBar value={vendor.count} width={vendor.width} color={vendor.color} />
              </div>
              <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-50">
                <AnimatedValue value={vendor.count} />
              </span>
              <span className="w-8 text-right text-[11px] text-zinc-400 dark:text-zinc-500">
                <AnimatedValue value={vendor.percent} suffix="%" />
              </span>
            </div>
          ))}
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Hanya menghitung sesi external · arahkan kursor pada bar untuk daftar sesi
          </div>
        </div>
      )}
    </Card>
  );
}
