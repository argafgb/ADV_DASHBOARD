import EmptyState from "@/components/shared/EmptyState";
import { AlertTriangle, ShieldCheck, Star } from "lucide-react";

/** Ikon bintang terisi sebanyak `count` di depan judul kelompok rating. */
function RatingStars({ count }: { count: number }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }, (_, index) => (
        <Star key={index} className="h-3 w-3 fill-current" />
      ))}
    </span>
  );
}

interface LowRatingItem {
  ticketNo: string;
  name: string;
  rating: number;
}

export default function LowRatingCard({
  lowRatings,
}: {
  lowRatings: LowRatingItem[];
}) {
  const rating1 = lowRatings.filter((item) => item.rating === 1);
  const rating2 = lowRatings.filter((item) => item.rating === 2);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs border-l-4 border-l-red-500">
      <h3 className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-zinc-50 font-display">
        <AlertTriangle size={15} className="text-red-500" />
        Rating Rendah - Perlu Perhatian
      </h3>

      <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
        Tiket dengan rating 1 - 2 bintang
      </p>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 bg-red-600 px-4 py-2 text-xs font-black text-white">
          <RatingStars count={1} />
          Rating 1 - Buruk
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          {rating1.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={ShieldCheck}
                title="Tidak Ada Rating 1"
                description="Tidak ada tiket dengan rating 1 (Buruk)"
              />
            </div>
          ) : (
            rating1.map((item, index) => (
              <div
                key={index}
                className="px-4 py-2 text-xs truncate"
                title={`${item.ticketNo} - ${item.name}`}
              >
                {index + 1}.{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {item.ticketNo}
                </span>{" "}
                - {item.name} <span className="text-zinc-400">(1 Tiket)</span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-amber-450 dark:bg-amber-500 px-4 py-2 text-xs font-black text-slate-950">
          <RatingStars count={2} />
          Rating 2 - Kurang
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          {rating2.length === 0 ? (
            <div className="py-4">
              <EmptyState
                icon={ShieldCheck}
                title="Tidak Ada Rating 2"
                description="Tidak ada tiket dengan rating 2 (Kurang)"
              />
            </div>
          ) : (
            rating2.map((item, index) => (
              <div
                key={index}
                className="px-4 py-2 text-xs truncate"
                title={`${item.ticketNo} - ${item.name}`}
              >
                {index + 1}.{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {item.ticketNo}
                </span>{" "}
                - {item.name} <span className="text-zinc-400">(1 Tiket)</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
