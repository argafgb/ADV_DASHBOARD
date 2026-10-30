import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  CentranIncident,
  CentranMonthlyMetric,
  CentranOpenCloseData,
  CentranPerformanceData,
  CentranQuarterlyMetric,
  CentranSeverityBreakdown,
  MonthlyServerOpenCloseMetric,
  ServerLocationKey,
} from "../types/centranPerformanceTypes";
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

export const formatCentranDuration = formatDuration;
export const getCentranOpsMinutes = (year: number, months: number[]) =>
  getOperationalMinutes(year, months, 1);

export async function getCentranPerformanceRaw(
  yearStr?: string,
  monthStr?: string,
): Promise<CentranPerformanceData> {
  const yrNum = parseInt(yearStr || "2026", 10) || 2026;
  const prevYrNum = yrNum - 1;
  const filter = parseMonthFilter(monthStr);
  const periodLabel = getPeriodLabel(monthStr, String(yrNum));

  const activeMonths =
    filter.isAll || filter.months.length === 0
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      : filter.months;

  const CENTRAN_SERVICE_ID_STR = "831746440722";

  // 1. Fetch Target SLA from dim_sla_targets for Centran (service_id = 831746440722::bigint)
  const targetResult = await sql`
    SELECT sla_target
    FROM server_performance.dim_sla_targets
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
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
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
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
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    GROUP BY LOWER(severity)
  `;

  const severityBreakdown: CentranSeverityBreakdown = {
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

  // Helper mapping for Server Location keys
  const mapServerLocationKey = (
    serverNo: number,
    locStr: string,
  ): ServerLocationKey => {
    if (serverNo === 1 || locStr.includes("Server 1") || locStr === "VDC") return "server1_ampasit";
    if (serverNo === 2 || locStr.includes("Server 2") || locStr === "Ampasit") return "server2_ampasit";
    if (serverNo === 3 || locStr.includes("Server 3") || locStr === "Semarang") return "cos_smg";
    return "dc";
  };

  // 4. Row 2: Total Open & Close Volume (Queried from server_performance.fact_centran_open_close)
  const openCloseDbResult = await sql`
    SELECT
      year,
      month,
      server_number,
      location AS server_location,
      total_incidents AS total_cnt,
      total_open AS open_cnt,
      total_close AS close_cnt
    FROM server_performance.fact_centran_open_close
    WHERE year IN (${yrNum}, ${prevYrNum})
      AND month = ANY(${activeMonths})
  `;

  const serverTotals: Record<ServerLocationKey, number> = {
    server1_ampasit: 0,
    server2_ampasit: 0,
    cos_smg: 0,
    dc: 0,
  };

  const monthlyServerMap: Record<
    number,
    Record<
      ServerLocationKey,
      {
        total25: number;
        open25: number;
        close25: number;
        total26: number;
        open26: number;
        close26: number;
      }
    >
  > = {};

  for (let m = 1; m <= 12; m++) {
    monthlyServerMap[m] = {
      server1_ampasit: {
        total25: 0,
        open25: 0,
        close25: 0,
        total26: 0,
        open26: 0,
        close26: 0,
      },
      server2_ampasit: {
        total25: 0,
        open25: 0,
        close25: 0,
        total26: 0,
        open26: 0,
        close26: 0,
      },
      cos_smg: {
        total25: 0,
        open25: 0,
        close25: 0,
        total26: 0,
        open26: 0,
        close26: 0,
      },
      dc: {
        total25: 0,
        open25: 0,
        close25: 0,
        total26: 0,
        open26: 0,
        close26: 0,
      },
    };
  }

  const serverLabels: Record<ServerLocationKey, string> = {
    server1_ampasit: "Server 1 di Data Center",
    server2_ampasit: "Server 2 di Ampasit",
    cos_smg: "Server 3 di Semarang",
    dc: "Server 4 di Ampasit",
  };

  let totalIncidentsYear = 0;

  openCloseDbResult.forEach((row) => {
    const yr = Number(row.year);
    const m = Number(row.month);
    const sNo = Number(row.server_number);
    const sKey = mapServerLocationKey(sNo, String(row.server_location));
    const totalCnt = Number(row.total_cnt) || 0;
    const openCnt = Number(row.open_cnt) || 0;
    const closeCnt = Number(row.close_cnt) || 0;

    if (row.server_location) {
      serverLabels[sKey] = String(row.server_location);
    }

    if (yr === yrNum) {
      serverTotals[sKey] += totalCnt;
      totalIncidentsYear += totalCnt;
      if (monthlyServerMap[m] && monthlyServerMap[m][sKey]) {
        monthlyServerMap[m][sKey].total26 += totalCnt;
        monthlyServerMap[m][sKey].open26 += openCnt;
        monthlyServerMap[m][sKey].close26 += closeCnt;
      }
    } else if (yr === prevYrNum) {
      if (monthlyServerMap[m] && monthlyServerMap[m][sKey]) {
        monthlyServerMap[m][sKey].total25 += totalCnt;
        monthlyServerMap[m][sKey].open25 += openCnt;
        monthlyServerMap[m][sKey].close25 += closeCnt;
      }
    }
  });

  const monthlyOpenClose: MonthlyServerOpenCloseMetric[] = activeMonths.map(
    (mNum) => {
      const mLabel = MONTHS[mNum - 1];
      const sData = monthlyServerMap[mNum] || {
        server1_ampasit: {
          total25: 0,
          open25: 0,
          close25: 0,
          total26: 0,
          open26: 0,
          close26: 0,
        },
        server2_ampasit: {
          total25: 0,
          open25: 0,
          close25: 0,
          total26: 0,
          open26: 0,
          close26: 0,
        },
        cos_smg: {
          total25: 0,
          open25: 0,
          close25: 0,
          total26: 0,
          open26: 0,
          close26: 0,
        },
        dc: {
          total25: 0,
          open25: 0,
          close25: 0,
          total26: 0,
          open26: 0,
          close26: 0,
        },
      };

      let allTotal25 = 0;
      let allOpen25 = 0;
      let allClose25 = 0;
      let allTotal26 = 0;
      let allOpen26 = 0;
      let allClose26 = 0;

      (Object.keys(sData) as ServerLocationKey[]).forEach((sk) => {
        allTotal25 += sData[sk].total25;
        allOpen25 += sData[sk].open25;
        allClose25 += sData[sk].close25;

        allTotal26 += sData[sk].total26;
        allOpen26 += sData[sk].open26;
        allClose26 += sData[sk].close26;
      });

      return {
        month: mLabel,
        mNum,
        byServer: sData,
        allTotal25,
        allOpen25,
        allClose25,
        allTotal26,
        allOpen26,
        allClose26,
      };
    },
  );

  const openCloseData: CentranOpenCloseData = {
    totalIncidents: totalIncidentsYear,
    serverTotals,
    serverLabels,
    monthly: monthlyOpenClose,
  };

  // 5. Row 3: Quarterly SLA (Q1-Q4)
  const currQuarterIncidents = await sql`
    SELECT quarter, COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    GROUP BY quarter
  `;

  const prevQuarterIncidents = await sql`
    SELECT quarter, COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
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
  const quarterlyMetrics: CentranQuarterlyMetric[] = activeQuarters.map(
    (qNum) => {
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
    },
  );

  // 6. Row 3 & Row 4: Monthly SLA, Incidents, Downtime, CPU, Memory (Active Filter Months)
  const currMonthlyIncidents = await sql`
    SELECT
      month,
      COUNT(*)::integer as freq,
      COALESCE(SUM(duration_minutes), 0)::integer as downtime
    FROM server_performance.fact_incidents
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
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
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
      AND year = ${prevYrNum}
      AND month = ANY(${activeMonths})
    GROUP BY month
  `;

  const currPerfResult = await sql`
    SELECT
      month,
      COALESCE(cpu_pct, 0)::numeric as avg_cpu,
      COALESCE(ram_pct, 0)::numeric as avg_ram
    FROM server_performance.fact_server_performance
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
  `;

  const prevPerfResult = await sql`
    SELECT
      month,
      COALESCE(cpu_pct, 0)::numeric as avg_cpu,
      COALESCE(ram_pct, 0)::numeric as avg_ram
    FROM server_performance.fact_server_performance
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
      AND year = ${prevYrNum}
      AND month = ANY(${activeMonths})
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

  const monthlyMetrics: CentranMonthlyMetric[] = activeMonths.map((mNum) => {
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

  // 7. Row 5: Incident Outage Log & Root Cause Analysis (Full Year YTD)
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
    WHERE service_id = ${CENTRAN_SERVICE_ID_STR}::bigint
      AND year = ${yrNum}
      AND month = ANY(${activeMonths})
    ORDER BY downtime_at DESC
  `;

  const incidents: CentranIncident[] = incidentLogsResult.map((row, idx) => {
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
    name: "Centran Performance",
    sub: "Ketersediaan server Centran, insiden & utilisasi sumber daya",
    year: yrNum,
    prevYear: prevYrNum,
    periodLabel,
    heroSla,
    heroSlaStatus,
    downtime: downtimeStr,
    downtimeMinutes,
    target,
    severityBreakdown,
    openCloseData,
    quarterlyMetrics,
    monthlyMetrics,
    incidents,
  };
}

export const fetchCentranPerformanceRaw = getCentranPerformanceRaw;

export const getCentranPerformanceData = (
  yearStr?: string,
  monthStr?: string,
) =>
  unstable_cache(
    () => getCentranPerformanceRaw(yearStr, monthStr),
    ["server-perf-centran-performance-v2", yearStr || "2026", monthStr || "ALL"],
    { tags: ["server-perf-centran-performance-v2"], revalidate: 300 },
  )();
