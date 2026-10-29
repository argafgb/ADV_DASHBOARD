import EmptyState from "@/components/shared/EmptyState";
import { CalendarDays, AlertTriangle, UserCheck } from "lucide-react";

interface AbsenceItem {
  name: string;
  departmentName: string;
  totalHari: number;
  totalTelat: number;
  totalAbsenSebelah: number;
  totalTidakAbsen: number;
  nilai: number;
}

export default function AbsenceCard({ absences }: { absences: AbsenceItem[] }) {
  const itItems = absences.filter((a) => a.departmentName === "IT Support");
  const dctItems = absences.filter((a) => a.departmentName === "DCT Support");
  const isSplit = itItems.length > 0 && dctItems.length > 0;

  const renderList = (items: AbsenceItem[]) => {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={UserCheck}
          title="Absensi Bersih"
          description="Semua absensi bersih (0 hari telat / absen sebelah)"
        />
      );
    }
    return (
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-180 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="py-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 dark:bg-rose-955/20 text-[10px] font-bold text-red-500 dark:text-red-400">
                  {index + 1}
                </span>
                <span
                  className="truncate max-w-45 font-display"
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>
              <span className="font-black text-red-650 dark:text-red-400">
                Nilai: {item.nilai.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1 pl-7 flex flex-wrap gap-x-3 text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>
                Total Roster:{" "}
                <strong className="text-zinc-600 dark:text-zinc-400">
                  {item.totalHari} Hari
                </strong>
              </span>
              <span>
                Telat:{" "}
                <strong className="text-red-500">{item.totalTelat}</strong>
              </span>
              <span>
                Absen Sebelah:{" "}
                <strong className="text-red-500">
                  {item.totalAbsenSebelah}
                </strong>
              </span>
              <span>
                Tidak Absen:{" "}
                <strong className="text-red-500">{item.totalTidakAbsen}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950 dark:text-zinc-50 font-display">
        <CalendarDays size={15} />
        Absensi Telat & Absen Sebelah (Day)
      </h3>

      {isSplit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:divide-x md:divide-zinc-150 md:dark:divide-zinc-800">
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-450">
              IT Support
            </div>
            {renderList(itItems)}
          </div>
          <div className="md:pl-8">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-450">
              DCT Support
            </div>
            {renderList(dctItems)}
          </div>
        </div>
      ) : (
        renderList(absences)
      )}

      <div className="mt-5 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-955/20 px-3 py-2 text-[10px] font-semibold text-red-600 dark:text-red-450">
        <AlertTriangle size={12} className="mr-1 inline" />
        Tidak dibenarkan telat / absen sebelah / tidak absen 1 hari pun
      </div>
    </section>
  );
}
