import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  DeltaInfo,
  FullOverviewDashboardData,
  RecentIncidentDisplay,
  RootCauseItem,
  Row1OverviewData,
  Row2OverviewData,
  Row3OverviewData,
  SystemDowntimeBreakdown,
  SystemKey,
  SystemSlaBreakdown,
  TrendChartPoint,
} from "../types/overviewTypes";
import {
  MONTHS,
} from "../../utils/month-filter";
import {
  calculateSlaPct,
  getOperationalMinutes,
  getPeriodLabel,
} from "../../utils/calculations";
import {
  formatDateDisplay,
  formatDuration,
  mapSeverity,
} from "../../utils/formatters";
import {
  mapServiceToKey,
  SYSTEM_KEYS,
  SYSTEM_META,
} from "../../utils/server-mapping";

function getFilterMonths(monthStr?: string) {
  const filter = parseMonthFilter(monthStr);
  const activeMonths =
    filter.isAll || filter.months.length === 0
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      : filter.months;

  return {
    ...filter,
    activeMonths,
  };
}

export async function getOverviewRow1Raw(
  yearStr: string,
  monthStr: string,
): Promise<Row1OverviewData> {
  const yrNum = parseInt(yearStr, 10) || 2026;
  const prevYrNum = yrNum - 1;
  const filter = getFilterMonths(monthStr);
  const periodLabel = getPeriodLabel(monthStr, String(yrNum));

  const totalOpsMinsAllCurr = getOperationalMinutes(
    yrNum,
    filter.activeMonths,
    4,
  );
  const totalOpsMinsAllPrev = getOperationalMinutes(
    prevYrNum,
    filter.activeMonths,
    4,
  );

  const totalOpsMinsPerServerCurr = getOperationalMinutes(
    yrNum,
    filter.activeMonths,
    1,
  );

  const currIncidents = await sql`
    SELECT service_id, COALESCE(SUM(duration_minutes), 0)::integer as total_downtime
    FROM server_performance.fact_incidents
    WHERE year = ${yrNum}
      AND month = ANY(${filter.activeMonths})
    GROUP BY service_id
  `;

  const prevIncidents = await sql`
    SELECT service_id, COALESCE(SUM(duration_minutes), 0)::integer as total_downtime
    FROM server_performance.fact_incidents
    WHERE year = ${prevYrNum}
      AND month = ANY(${filter.activeMonths})
    GROUP BY service_id
  `;

  let currTotalDowntimeMins = 0;
  const currDowntimePerKey: Record<SystemKey, number> = {
    dct: 0,
    email: 0,
    cencon: 0,
    centran: 0,
  };

  currIncidents.forEach((row) => {
    const sId = Number(row.service_id);
    const sKey = mapServiceToKey(sId);
    const downtime = Number(row.total_downtime) || 0;
    currDowntimePerKey[sKey] += downtime;
    currTotalDowntimeMins += downtime;
  });

  let prevTotalDowntimeMins = 0;
  const prevDowntimePerKey: Record<SystemKey, number> = {
    dct: 0,
    email: 0,
    cencon: 0,
    centran: 0,
  };

  prevIncidents.forEach((row) => {
    const sId = Number(row.service_id);
    const sKey = mapServiceToKey(sId);
    const downtime = Number(row.total_downtime) || 0;
    prevDowntimePerKey[sKey] += downtime;
    prevTotalDowntimeMins += downtime;
  });

  const currSlaPct = calculateSlaPct(currTotalDowntimeMins, totalOpsMinsAllCurr);
  const prevSlaPct = calculateSlaPct(prevTotalDowntimeMins, totalOpsMinsAllPrev);

  const roundedCurrSla = Math.round(currSlaPct * 100) / 100;
  const slaDeltaVal = Math.round((currSlaPct - prevSlaPct) * 100) / 100;

  const downtimeDeltaMins = currTotalDowntimeMins - prevTotalDowntimeMins;

  const availabilityDelta: DeltaInfo = {
    value: `${slaDeltaVal >= 0 ? "+" : ""}${slaDeltaVal}%`,
    isUp: slaDeltaVal >= 0,
    tone: slaDeltaVal >= 0 ? "green" : "red",
    basis: "YoY",
  };

  const downtimeDelta: DeltaInfo = {
    value: `${downtimeDeltaMins >= 0 ? "+" : ""}${downtimeDeltaMins} min`,
    isUp: downtimeDeltaMins <= 0,
    tone: downtimeDeltaMins <= 0 ? "green" : "red",
    basis: "YoY",
  };

  const systemSlas: SystemSlaBreakdown[] = SYSTEM_KEYS.map((key) => {
    const meta = SYSTEM_META[key];
    const downtime = currDowntimePerKey[key];
    const serverSla = calculateSlaPct(downtime, totalOpsMinsPerServerCurr);
    const roundedServerSla = Math.round(serverSla * 100) / 100;

    return {
      key,
      name: meta.label,
      sla: `${roundedServerSla}%`,
      status: roundedServerSla >= 99.0 ? "Normal" : "Warning",
    };
  });

  const systemDowntimes: SystemDowntimeBreakdown[] = SYSTEM_KEYS.map((key) => {
    const meta = SYSTEM_META[key];
    const downtime = currDowntimePerKey[key];

    return {
      key,
      name: meta.label,
      downtime: formatDuration(downtime),
      status: downtime === 0 ? "Normal" : "Degraded",
    };
  });

  return {
    metrics: {
      availabilitySla: roundedCurrSla,
      availabilityDelta,
      downtimeMinutes: currTotalDowntimeMins,
      downtimeDelta,
      periodLabel,
    },
    systemSlas,
    systemDowntimes,
  };
}

export const fetchRow1Raw = getOverviewRow1Raw;

export async function getOverviewRow2Raw(
  yearStr: string,
  monthStr: string,
): Promise<Row2OverviewData> {
  const yrNum = parseInt(yearStr, 10) || 2026;
  const prevYrNum = yrNum - 1;
  const filter = getFilterMonths(monthStr);
  const periodLabel = getPeriodLabel(monthStr, String(yrNum));

  const currCountResult = await sql`
    SELECT COUNT(*)::integer as total_count
    FROM server_performance.fact_incidents
    WHERE year = ${yrNum}
      AND month = ANY(${filter.activeMonths})
  `;

  const prevCountResult = await sql`
    SELECT COUNT(*)::integer as total_count
    FROM server_performance.fact_incidents
    WHERE year = ${prevYrNum}
      AND month = ANY(${filter.activeMonths})
  `;

  const totalIncidents = Number(currCountResult[0]?.total_count) || 0;
  const prevIncidentsCount = Number(prevCountResult[0]?.total_count) || 0;

  const incidentDiff = totalIncidents - prevIncidentsCount;
  let incidentDeltaPct = 0;
  if (prevIncidentsCount > 0) {
    incidentDeltaPct =
      Math.round(
        ((totalIncidents - prevIncidentsCount) / prevIncidentsCount) * 1000,
      ) / 10;
  }

  const incidentsDelta: DeltaInfo = {
    value:
      prevIncidentsCount > 0
        ? `${incidentDeltaPct >= 0 ? "+" : ""}${incidentDeltaPct}%`
        : `${incidentDiff >= 0 ? "+" : ""}${incidentDiff}`,
    isUp: incidentDiff <= 0,
    tone: incidentDiff <= 0 ? "green" : "red",
    basis: "YoY",
  };

  const causesResult = await sql`
    SELECT
      COALESCE(NULLIF(root_cause, ''), NULLIF(issue_name, ''), 'Lainnya') as cause_label,
      COUNT(*)::integer as count,
      MAX(severity) as max_severity
    FROM server_performance.fact_incidents
    WHERE year = ${yrNum}
      AND month = ANY(${filter.activeMonths})
    GROUP BY cause_label
    ORDER BY count DESC
    LIMIT 5
  `;

  const rootCauses: RootCauseItem[] = causesResult.map((row) => {
    const cnt = Number(row.count) || 0;
    const pct =
      totalIncidents > 0 ? Math.round((cnt / totalIncidents) * 100) : 0;

    return {
      label: String(row.cause_label),
      count: cnt,
      percentage: pct,
      severity: mapSeverity(row.max_severity),
    };
  });

  const recentResult = await sql`
    SELECT
      fi.incident_id,
      fi.service_id,
      ds.service_name,
      fi.downtime_at,
      fi.uptime_at,
      fi.duration_minutes,
      fi.issue_name,
      fi.severity,
      fi.impact_desc,
      fi.root_cause,
      fi.action_taken,
      fi.solution_text,
      fi.issue_status
    FROM server_performance.fact_incidents fi
    LEFT JOIN server_performance.dim_services ds ON fi.service_id = ds.service_id
    WHERE fi.year = ${yrNum}
    ORDER BY fi.downtime_at DESC
    LIMIT 10
  `;

  const recentIncidents: RecentIncidentDisplay[] = recentResult.map((row) => {
    const sId = Number(row.service_id);
    const sysKey = mapServiceToKey(sId, row.service_name);
    const meta = SYSTEM_META[sysKey];
    const duration = Number(row.duration_minutes) || 0;

    return {
      sysKey,
      sysLabel: meta.label,
      sysColor: meta.color,
      down: formatDateDisplay(row.downtime_at),
      durasi: formatDuration(duration),
      issue: String(row.issue_name || "Server Issue"),
      sev: mapSeverity(row.severity),
      kendala: String(row.impact_desc || row.issue_name || "Kendala Sistem"),
      penyebab: String(
        row.root_cause || row.solution_text || "Dalam Investigasi",
      ),
    };
  });

  return {
    totalIncidents,
    incidentsDelta,
    periodLabel,
    rootCauses,
    recentIncidents,
  };
}

export const fetchRow2Raw = getOverviewRow2Raw;

export async function getOverviewRow3Raw(
  yearStr: string,
  monthStr: string,
): Promise<Row3OverviewData> {
  const yrNum = parseInt(yearStr, 10) || 2026;
  const prevYrNum = yrNum - 1;
  const filter = getFilterMonths(monthStr);
  const periodLabel = getPeriodLabel(monthStr, String(yrNum));

  const currMonthlyIncidents = await sql`
    SELECT month, COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE year = ${yrNum}
      AND month = ANY(${filter.activeMonths})
    GROUP BY month
  `;

  const prevMonthlyIncidents = await sql`
    SELECT month, COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE year = ${prevYrNum}
      AND month = ANY(${filter.activeMonths})
    GROUP BY month
  `;

  const currDowntimeByMonth: Record<number, number> = {};
  currMonthlyIncidents.forEach((row) => {
    currDowntimeByMonth[Number(row.month)] = Number(row.downtime);
  });

  const prevDowntimeByMonth: Record<number, number> = {};
  prevMonthlyIncidents.forEach((row) => {
    prevDowntimeByMonth[Number(row.month)] = Number(row.downtime);
  });

  const currentMonthIndex = new Date().getMonth() + 1;

  const trendData: TrendChartPoint[] = filter.activeMonths.map((mNum) => {
    const mLabel = MONTHS[mNum - 1];
    const opsMinsCurr = getOperationalMinutes(yrNum, [mNum], 4);
    const opsMinsPrev = getOperationalMinutes(prevYrNum, [mNum], 4);

    const prevDown = prevDowntimeByMonth[mNum] || 0;
    const slaPrev = calculateSlaPct(prevDown, opsMinsPrev);

    let slaCurr: number | null = null;
    if (yrNum < new Date().getFullYear() || (yrNum === new Date().getFullYear() && mNum <= currentMonthIndex)) {
      const currDown = currDowntimeByMonth[mNum] || 0;
      slaCurr = calculateSlaPct(currDown, opsMinsCurr);
    }

    return {
      month: mLabel,
      sla2025: slaPrev,
      sla2026: slaCurr,
    };
  });

  return {
    trendData,
    periodLabel,
  };
}

export const fetchRow3Raw = getOverviewRow3Raw;

export const getCachedRow1Data = (year: string, month: string) =>
  unstable_cache(
    () => getOverviewRow1Raw(year, month),
    ["server-perf-overview-row1-v2", year, month],
    { tags: ["server-perf-overview-v2"], revalidate: 300 },
  )();

export const getCachedRow2Data = (year: string, month: string) =>
  unstable_cache(
    () => getOverviewRow2Raw(year, month),
    ["server-perf-overview-row2-v2", year, month],
    { tags: ["server-perf-overview-v2"], revalidate: 300 },
  )();

export const getCachedRow3Data = (year: string, month: string) =>
  unstable_cache(
    () => getOverviewRow3Raw(year, month),
    ["server-perf-overview-row3-v2", year, month],
    { tags: ["server-perf-overview-v2"], revalidate: 300 },
  )();

export async function getOverviewDashboardData(
  year: string,
  month: string,
): Promise<FullOverviewDashboardData> {
  const [row1, row2, row3] = await Promise.all([
    getCachedRow1Data(year, month),
    getCachedRow2Data(year, month),
    getCachedRow3Data(year, month),
  ]);

  return {
    row1,
    row2,
    row3,
  };
}
