import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";
import type { DashboardData } from "../types/dashboard.types";
import {
  transformLearnGrowthRows,
  type LearnGrowthSourceRow,
} from "../utils/transform-learn-growth-rows";

export async function getLastUpdatedAtRaw(): Promise<string> {
  try {
    const rows = await sql<{ last_updated: Date | string | null }[]>`
      select max(greatest(time_edit, time_input))
               at time zone 'Asia/Jakarta' as last_updated
      from public.learn_n_growth
    `;

    const value = rows[0]?.last_updated ?? null;
    if (value === null) return "";

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  } catch {
    return "";
  }
}

export async function getLearningGrowthDashboardRaw(): Promise<DashboardData> {
  try {
    const rows = await sql<LearnGrowthSourceRow[]>`
      select
        id::text,
        program,
        rencana_kerja,
        to_char(tanggal_pelaksanaan, 'YYYY-MM-DD') as tanggal,
        narasumber,
        category_kerja,
        peserta,
        to_char(exp_sertifikat, 'YYYY-MM-DD') as exp_sertifikat
      from public.learn_n_growth
      where tanggal_pelaksanaan is not null
        and rencana_kerja is not null
        and upper(trim(program)) in ('TRAINING INTERNAL', 'TRAINING EKSTERNAL', 'CERTIFICATION')
      order by tanggal_pelaksanaan, program, rencana_kerja
    `;

    const { trainings, certifications } = transformLearnGrowthRows(rows);
    const updatedAt = await getLastUpdatedAtRaw();

    return {
      trainings,
      certifications,
      source: "database",
      updatedAt,
    };
  } catch {
    return {
      trainings: [],
      certifications: [],
      source: "database",
      updatedAt: "",
    };
  }
}

export async function getLearningGrowthDashboardData(): Promise<DashboardData> {
  return unstable_cache(
    async () => getLearningGrowthDashboardRaw(),
    ["learning-growth-dashboard-data"],
    { revalidate: 300, tags: ["learning-growth-dashboard"] },
  )();
}
