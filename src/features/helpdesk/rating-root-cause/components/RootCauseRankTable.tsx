"use client";

import type { RootCauseItem } from "../types/rootCause.types";
import { formatNumber } from "../utils/rating-root-cause-utils";

interface RootCauseRankTableProps {
  data: RootCauseItem[];
  onSelect: (item: RootCauseItem) => void;
}

export default function RootCauseRankTable({
  data,
  onSelect,
}: RootCauseRankTableProps) {
  const restData = data.slice(3);

  if (restData.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
          <tr>
            <th className="w-22.5 px-5 py-4 text-left">Rank</th>
            <th className="px-5 py-4 text-left">Root Cause</th>
            <th className="px-5 py-4 text-right">Tickets</th>
            <th className="px-5 py-4 text-right">Contribute (%)</th>
          </tr>
        </thead>

        <tbody>
          {restData.map((item) => {
            return (
              <tr
                key={item.name}
                onClick={() => onSelect(item)}
                className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-5 py-4 font-black text-slate-500">
                  #{item.rank}
                </td>

                <td className="px-5 py-4 font-black uppercase text-slate-950">
                  {item.name}
                </td>

                <td className="px-5 py-4 text-right font-black text-slate-950">
                  {formatNumber(item.tickets)}
                </td>

                <td className="px-5 py-4 text-right font-black text-blue-600 dark:text-blue-400">
                  {(item.sharePercentage ?? 0).toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
