import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  DctIncident,
  DctMonthlyMetric,
  DctPerformanceData,
  DctQuarterlyMetric,
  DctSeverityBreakdown,
} from "../types/dctPerformanceTypes";
import { MONTHS } from "../../utils/month-filter";
import {
  calculateSlaPct,
  getDaysInMonth,
  getOperationalMinutes,
  getPeriodLabel,
} from "../../utils/calculations";
import {
  categorizeSeverity,
  formatDateDisplay,
  formatDuration,
} from "../../utils/formatters";

export const formatDctDuration = formatDuration;
export const getDctOpsMinutes = (year: number, months: number[]) =>
  getOperationalMinutes(year, months, 1);

export async function getDctPerformanceRaw(
  yearStr?: string,
  monthStr?: string,
): Promise<DctPerformanceData> {
  const yrNum = parseInt(yearStr || "2026", 10) || 2026;
  const prevYrNum = yrNum - 1;
  const filter = parseMonthFilter(monthStr);
  const periodLabel = getPeriodLabel(monthStr, String(yrNum));

  const activeMonths =
    filter.isAll || filter.months.length === 0
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      : filter.months;

  const DCT_SERVICE_ID = 2;

  // 1. Fetch Target SLA from dim_sla_targets
  const targetResult = await sql`
    SELECT sla_target
    FROM server_performance.dim_sla_targets
    WHERE service_id = ${DCT_SERVICE_ID}
      AND (sla_year = ${yrNum} OR sla_year IS NULL)
    ORDER BY sla_year DESC NULLS LAST
    LIMIT 1
  `;
  const target = Number(targetResult[0]?.sla_target) || 99.5;

  // 2. Row 1: SLA & Total Downtime for the active month range
  const opsMinsActivePeriod = getOperationalMinutes(yrNum, activeMonths, 1);
  const yearlyDowntimeResult = await sql`
    SELECT COALESCE(SUM(duration_minutes), 0)::integer as total_downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${DCT_SERVICE_ID}
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
  `;
  const downtimeMinutes = Number(yearlyDowntimeResult[0]?.total_downtime) || 0;
  const heroSla = calculateSlaPct(downtimeMinutes, opsMinsActivePeriod);
  const heroSlaStatus = heroSla >= target ? "Met" : "Missed";
  const downtimeStr = formatDuration(downtimeMinutes);

  // 3. Row 1: Incident Severity Breakdown (Full Year YTD)
  const severityResult = await sql`
    SELECT LOWER(severity) as sev, COUNT(*)::integer as cnt
    FROM server_performance.fact_incidents
    WHERE service_id = ${DCT_SERVICE_ID}
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    GROUP BY LOWER(severity)
  `;

  const severityBreakdown: DctSeverityBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  };

  severityResult.forEach((row) => {
    const sevKey = categorizeSeverity(row.sev);
    const count = Number(row.cnt) || 0;
    severityBreakdown[sevKey] += count;
    severityBreakdown.total += count;
  });

  // 4. Row 2: Quarterly SLA (Q1-Q4)
  const currQuarterIncidents = await sql`
    SELECT quarter, COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${DCT_SERVICE_ID}
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    GROUP BY quarter
  `;

  const prevQuarterIncidents = await sql`
    SELECT quarter, COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${DCT_SERVICE_ID}
      AND year = ${prevYrNum}
      AND month = ANY(${activeMonths})
    GROUP BY quarter
  `;

  const currQDownMap: Record<number, number> = {};
  currQuarterIncidents.forEach((r) => {
    currQDownMap[Number(r.quarter)] = Number(r.downtime);
  });

  const prevQDownMap: Record<number, number> = {};
  prevQuarterIncidents.forEach((r) => {
    prevQDownMap[Number(r.quarter)] = Number(r.downtime);
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const activeQuarters = [
    ...new Set(activeMonths.map((month) => Math.ceil(month / 3))),
  ];
  const quarterlyMetrics: DctQuarterlyMetric[] = activeQuarters.map((qNum) => {
    const quarterMonths = activeMonths.filter(
      (month) => Math.ceil(month / 3) === qNum,
    );
    const qOpsPrev = getOperationalMinutes(prevYrNum, quarterMonths, 1);
    const qOpsCurr = getOperationalMinutes(yrNum, quarterMonths, 1);

    const qPrevDown = prevQDownMap[qNum] || 0;
    const qPrevSla = calculateSlaPct(qPrevDown, qOpsPrev);

    let qCurrSla: number | null = null;
    if (
      yrNum < currentYear ||
      (yrNum === currentYear && qNum <= currentQuarter)
    ) {
      const qCurrDown = currQDownMap[qNum] || 0;
      qCurrSla = calculateSlaPct(qCurrDown, qOpsCurr);
    }

    return {
      quarter: `Q${qNum}`,
      qCurr: qCurrSla,
      qPrev: qPrevSla,
    };
  });

  // 5. Row 2 & Row 3: Monthly SLA, Incidents, Downtime, CPU, Memory (Active Filter Months)
  const currMonthlyIncidents = await sql`
    SELECT
      month,
      COUNT(*)::integer as freq,
      COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${DCT_SERVICE_ID}
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    GROUP BY month
  `;

  const prevMonthlyIncidents = await sql`
    SELECT
      month,
      COUNT(*)::integer as freq,
      COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${DCT_SERVICE_ID}
      AND year = ${prevYrNum}
      AND month = ANY(${activeMonths})
    GROUP BY month
  `;

  const currPerfResult = await sql`
    SELECT
      month,
      COALESCE(AVG(cpu), 0)::numeric as avg_cpu,
      COALESCE(AVG(memory), 0)::numeric as avg_ram
    FROM server_performance.fact_avg_cpu_memory
    WHERE server = 'DCT'
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    GROUP BY month
  `;

  const prevPerfResult = await sql`
    SELECT
      month,
      COALESCE(AVG(cpu), 0)::numeric as avg_cpu,
      COALESCE(AVG(memory), 0)::numeric as avg_ram
    FROM server_performance.fact_avg_cpu_memory
    WHERE server = 'DCT'
      AND year = ${prevYrNum}
      AND month = ANY(${activeMonths})
    GROUP BY month
  `;

  const currMonthIncMap: Record<number, { freq: number; downtime: number }> =
    {};
  currMonthlyIncidents.forEach((r) => {
    currMonthIncMap[Number(r.month)] = {
      freq: Number(r.freq) || 0,
      downtime: Number(r.downtime) || 0,
    };
  });

  const prevMonthIncMap: Record<number, { freq: number; downtime: number }> =
    {};
  prevMonthlyIncidents.forEach((r) => {
    prevMonthIncMap[Number(r.month)] = {
      freq: Number(r.freq) || 0,
      downtime: Number(r.downtime) || 0,
    };
  });

  const currPerfMap: Record<number, { cpu: number; ram: number }> = {};
  currPerfResult.forEach((r) => {
    currPerfMap[Number(r.month)] = {
      cpu: Math.round(Number(r.avg_cpu) * 10) / 10,
      ram: Math.round(Number(r.avg_ram) * 10) / 10,
    };
  });

  const prevPerfMap: Record<number, { cpu: number; ram: number }> = {};
  prevPerfResult.forEach((r) => {
    prevPerfMap[Number(r.month)] = {
      cpu: Math.round(Number(r.avg_cpu) * 10) / 10,
      ram: Math.round(Number(r.avg_ram) * 10) / 10,
    };
  });

  const monthlyMetrics: DctMonthlyMetric[] = activeMonths.map((mNum) => {
    const mLabel = MONTHS[mNum - 1];
    const opsPrev = getDaysInMonth(prevYrNum, mNum) * 24 * 60;
    const opsCurr = getDaysInMonth(yrNum, mNum) * 24 * 60;

    const prevInc = prevMonthIncMap[mNum] || { freq: 0, downtime: 0 };
    const currInc = currMonthIncMap[mNum] || { freq: 0, downtime: 0 };

    const prevPerf = prevPerfMap[mNum] || { cpu: 0, ram: 0 };
    const currPerf = currPerfMap[mNum] || { cpu: 0, ram: 0 };

    const slaPrev = calculateSlaPct(prevInc.downtime, opsPrev);

    let slaCurr: number | null = null;
    if (
      yrNum < currentYear ||
      (yrNum === currentYear && mNum <= currentMonth)
    ) {
      slaCurr = calculateSlaPct(currInc.downtime, opsCurr);
    }

    return {
      month: mLabel,
      mNum,
      slaCurr,
      slaPrev,
      freqCurr: currInc.freq,
      freqPrev: prevInc.freq,
      downCurr: currInc.downtime,
      downPrev: prevInc.downtime,
      cpuCurr: currPerf.cpu,
      cpuPrev: prevPerf.cpu,
      memCurr: currPerf.ram,
      memPrev: prevPerf.ram,
    };
  });

  // 6. Row 4: Incident Outage Log & Root Cause Analysis (Full Year YTD)
  const incidentLogsResult = await sql`
    SELECT
      incident_id,
      downtime_at,
      uptime_at,
      duration_minutes,
      issue_name,
      severity,
      impact_desc,
      root_cause,
      action_taken,
      solution_text,
      issue_status
    FROM server_performance.fact_incidents
    WHERE service_id = ${DCT_SERVICE_ID}
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    ORDER BY downtime_at DESC
  `;

  const incidents: DctIncident[] = incidentLogsResult.map((row, idx) => {
    const durationMins = Number(row.duration_minutes) || 0;

    return {
      no: idx + 1,
      incidentId: Number(row.incident_id),
      down: formatDateDisplay(row.downtime_at),
      up: formatDateDisplay(row.uptime_at),
      durasi: formatDuration(durationMins),
      issue: String(row.issue_name || "Server Down"),
      sev: categorizeSeverity(row.severity),
      kendala: String(row.impact_desc || row.issue_name || "-"),
      penyebab: String(
        row.root_cause || row.solution_text || "Dalam Investigasi",
      ),
      action: String(row.action_taken || "-"),
      solusi: String(row.solution_text || "-"),
      verify: String(row.issue_status).toLowerCase() === "complete",
    };
  });

  return {
    name: "DCT Performance",
    sub: "Data Center Tools — ketersediaan server & layanan",
    year: yrNum,
    prevYear: prevYrNum,
    periodLabel,
    heroSla,
    heroSlaStatus,
    downtime: downtimeStr,
    downtimeMinutes,
    target,
    severityBreakdown,
    quarterlyMetrics,
    monthlyMetrics,
    incidents,
  };
}

export const fetchDctPerformanceRaw = getDctPerformanceRaw;

export const getDctPerformanceData = (yearStr?: string, monthStr?: string) =>
  unstable_cache(
    () => getDctPerformanceRaw(yearStr, monthStr),
    ["server-perf-dct-performance-v2", yearStr || "2026", monthStr || "ALL"],
    { tags: ["server-perf-dct-performance-v2"], revalidate: 300 },
  )();
