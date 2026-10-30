"use server";

import {
  getOverviewDashboardData,
  getRow1OverviewData,
  getRow2OverviewData,
  getRow3OverviewData,
} from "../services/overviewService";
import {
  OverviewFilterParams,
  OverviewDashboardData,
  Row1OverviewData,
  Row2OverviewData,
  Row3OverviewData,
  MatrixRole,
  MatrixType,
} from "../types/overviewTypes";

export async function fetchOverviewDashboardAction(
  params: OverviewFilterParams,
  mtRole: MatrixRole = "Developer",
  mtType: MatrixType = "Bug",
): Promise<OverviewDashboardData> {
  return await getOverviewDashboardData(
    params.year,
    params.month,
    params.project,
    params.role,
    mtRole,
    mtType,
  );
}

export async function fetchRow1Action(
  params: OverviewFilterParams,
): Promise<Row1OverviewData> {
  return await getRow1OverviewData(params);
}

export async function fetchRow2Action(
  params: OverviewFilterParams,
  mtRole: MatrixRole = "Developer",
  mtType: MatrixType = "Bug",
): Promise<Row2OverviewData> {
  return await getRow2OverviewData(params, mtRole, mtType);
}

export async function fetchRow3Action(
  params: OverviewFilterParams,
): Promise<Row3OverviewData> {
  return await getRow3OverviewData(params);
}
