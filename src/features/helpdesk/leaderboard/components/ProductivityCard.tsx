import EmptyState from "@/components/shared/EmptyState";
import { Info, TrendingUp } from "lucide-react";

interface ProductivityItem {
  name: string;
  departmentName: string;
  score: number;
}

export default function ProductivityCard({
  productivity,
}: {
  productivity: ProductivityItem[];
}) {
  const itItems = productivity.filter((p) => p.departmentName === "IT Support");
  const dctItems = productivity.filter(
    (p) => p.departmentName === "DCT Support",
  );
  const isSplit = itItems.length > 0 && dctItems.length > 0;

  const renderList = (items: ProductivityItem[]) => {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={TrendingUp}
          title="Data Produktivitas Tidak Tersedia"
          description="Tidak ada data produktivitas untuk kriteria terpilih"
        />
      );
    }
    return (
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-180 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="grid grid-cols-[32px_1fr_90px] items-center py-3 text-xs"
          >
            <div className="font-bold text-zinc-400">{index + 1}</div>
            <div
              className="font-semibold text-zinc-700 dark:text-zinc-300 truncate pr-2"
              title={item.name}
            >
              {item.name}
            </div>
            <div
              className={[
                "text-right font-black",
                item.score >= 90
                  ? "text-emerald-600 dark:text-emerald-450"
                  : "text-red-500",
              ].join(" ")}
            >
              = {item.score.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-zinc-50 font-display">
        <TrendingUp aria-hidden="true" size={15} className="text-blue-600" />
        Ranking Productivity (%)
      </h3>

      {isSplit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:divide-x md:divide-zinc-150 md:dark:divide-zinc-800">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              IT Support
            </div>
            {renderList(itItems)}
          </div>
          <div className="md:pl-8">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              DCT Support
            </div>
            {renderList(dctItems)}
          </div>
        </div>
      ) : (
        renderList(productivity)
      )}

      <div className="mt-4 flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-zinc-500">Dibawah SLA</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-500">Sesuai SLA</span>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-955/20 px-3 py-2 text-[10px] text-blue-600 dark:text-blue-400">
        <Info size={12} className="mr-1 inline" />
        Tiket yang muncul hanya yang memiliki min. 15 tiket
      </div>
    </section>
  );
}
