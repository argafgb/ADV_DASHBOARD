"use client";

import { CalendarCheck2, ShieldCheck } from "lucide-react";
import { Card } from "../Card";
import { CERT_RENEWAL_WINDOW_MONTHS } from "../../utils/dashboard-config";
import type { TrainingModel } from "../../utils/build-training";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * "Certification Renewal" - sertifikat berstatus Segera Berakhir
 * atau sudah kedaluwarsa, supaya training atau ujian ulangnya sempat dijadwalkan.
 */
export function RenewalCard({ renewal }: { renewal: TrainingModel["renewal"] }) {
  const nextLine = renewal.next
    ? `Berikutnya segera berakhir: ${renewal.next.name} · ${renewal.next.holder} · mulai ${renewal.next.startText}`
    : null;

  return (
    <Card
      title="Certification Renewal"
      subtitle={`Sisa masa berlaku < ${CERT_RENEWAL_WINDOW_MONTHS} bulan · per ${renewal.asOf}`}
    >
      {renewal.items.length > 0 ? (
        <div className="flex flex-col gap-3 pt-1">
          {renewal.items.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold leading-snug break-words text-zinc-900 dark:text-zinc-50">
                  {item.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.holder}</div>
                <div className="mt-0.5 text-[10.5px] text-zinc-400 dark:text-zinc-500">{item.detail}</div>
              </div>
              <span
                className="flex-none rounded-full px-2 py-[2px] text-[10px] font-bold"
                style={{ color: item.statusFg, background: item.statusBg }}
              >
                {item.statusLabel}
              </span>
            </div>
          ))}
          {nextLine && (
            <div className="mt-0.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
              {nextLine}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={CalendarCheck2}
          title="Tidak Ada Perpanjangan Mendatang"
          description={`Seluruh sertifikat aktif masih memiliki sisa masa berlaku lebih dari ${CERT_RENEWAL_WINDOW_MONTHS} bulan.`}
          height={180}
        />
      )}
    </Card>
  );
}
