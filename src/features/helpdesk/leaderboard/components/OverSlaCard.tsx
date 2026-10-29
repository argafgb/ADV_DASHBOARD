import EmptyState from "@/components/shared/EmptyState";
import { Info, ShieldCheck } from "lucide-react";

interface OverSlaItem {
  type: "RESPONSE" | "RESOLVED";
  name: string;
  ticketCount: number;
  ticketList: string[];
}

export default function OverSlaCard({
  overSla,
  onSelectDispatcher,
}: {
  overSla: OverSlaItem[];
  onSelectDispatcher: (
    name: string,
    type: "RESPONSE" | "RESOLVED",
    ticketList: string[],
  ) => void;
}) {
  const overSlaResponse = overSla.filter((item) => item.type === "RESPONSE");
  const overSlaResolved = overSla.filter((item) => item.type === "RESOLVED");

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-zinc-50 font-display">
        <Info size={15} />
        Over SLA (Jumlah Ticket)
      </h3>

      <div className="space-y-5">
        {(["RESPONSE", "RESOLVED"] as const).map((type) => {
          const items = type === "RESPONSE" ? overSlaResponse : overSlaResolved;

          return (
            <div key={type}>
              <div className="mb-2 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                {type}
              </div>

              {items.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title={`Over SLA ${type} Bersih`}
                  description={`Tidak ada tiket Over SLA untuk kategori ${type}`}
                />
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="py-2 text-xs flex justify-between items-center"
                    >
                      <div>
                        {index + 1}.{" "}
                        <button
                          type="button"
                          onClick={() =>
                            onSelectDispatcher(item.name, type, item.ticketList)
                          }
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                        >
                          {item.name}
                        </button>
                      </div>
                      <span className="text-zinc-400 font-medium">
                        ({item.ticketCount} Tiket)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
