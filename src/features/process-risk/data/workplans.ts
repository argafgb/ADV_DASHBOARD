import { create } from 'zustand';
import type { ProcessRiskDashboardData, ProgramMeta, Workplan } from '../types';

export const EMPTY_DASHBOARD_DATA: ProcessRiskDashboardData = Object.freeze({
  workplans: [],
  programs: [],
  source: 'database',
  recordCount: 0,
  undatedCount: 0,
  updatedAt: null,
});

interface DashboardDataState {
  data: ProcessRiskDashboardData;
  replaceData: (data: ProcessRiskDashboardData) => void;
}

export const useDashboardDataStore = create<DashboardDataState>((set) => ({
  data: EMPTY_DASHBOARD_DATA,
  replaceData: (data) =>
    set({ data: { ...data, workplans: [...data.workplans], programs: [...data.programs] } }),
}));

export function dashboardDataSnapshot(): ProcessRiskDashboardData {
  return useDashboardDataStore.getState().data;
}

export function replaceDashboardData(data: ProcessRiskDashboardData): void {
  useDashboardDataStore.getState().replaceData(data);
}

export function replaceWorkplans(
  workplans: Workplan[],
  programs: ProgramMeta[] = [],
  undatedCount = 0,
): void {
  replaceDashboardData({
    workplans,
    programs,
    undatedCount,
    source: 'database',
    recordCount: workplans.length,
    updatedAt: null,
  });
}

export function useDashboardData(): ProcessRiskDashboardData {
  return useDashboardDataStore((state) => state.data);
}
