"use client";

/**
 * Penanda warna tahun di atas chart perbandingan.
 *
 * Label dan warnanya datang dari model, bukan konstanta, supaya legend ikut
 * berubah begitu filter tahun bergeser. Urutannya dibalik agar tahun terpilih
 * berada paling kanan, sejajar dengan garis terdepan di chart.
 */
export function YearLegend({ items }: { items: readonly { label: string; color: string }[] }) {
  return (
    <div className="mb-1 flex justify-end gap-[14px]">
      {[...items].reverse().map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-[6px] text-[11px] font-semibold text-zinc-500 dark:text-zinc-400"
        >
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
