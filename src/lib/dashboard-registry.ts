import {
  assetMaintenanceMenuList,
  helpdeskMenuList,
  accessMenuList,
  networkPerformanceMenuList,
  picMonitoringMenuList,
  serverPerformanceMenuList,
  processRiskMenuList,
  bugTrackerMenuList,
  learningGrowthMenuList,
  overtimeMenuList,
  itRepairMenuList,
  kaldevPerformanceMenuList,
  type Menu,
} from "./menu-list";

export interface DashboardRegistryItem {
  id: string;
  prefix: string;
  title: string;
  menuList: Menu[];
}

export const DASHBOARD_REGISTRY: Record<string, DashboardRegistryItem> = {
  "asset-maintenance": {
    id: "asset-maintenance",
    prefix: "/dashboard/asset-maintenance",
    title: "IT Asset & PM Dashboard",
    get menuList() {
      return assetMaintenanceMenuList;
    },
  },
  "helpdesk": {
    id: "helpdesk",
    prefix: "/dashboard/helpdesk",
    title: "IT & DCT Helpdesk Dashboard",
    get menuList() {
      return helpdeskMenuList;
    },
  },
  "access-management": {
    id: "access-management",
    prefix: "/dashboard/access",
    title: "Access Management Dashboard",
    get menuList() {
      return accessMenuList;
    },
  },
  "network-performance": {
    id: "network-performance",
    prefix: "/dashboard/network-performance",
    title: "Network Performance Dashboard",
    get menuList() {
      return networkPerformanceMenuList;
    },
  },
  "pic-monitoring": {
    id: "pic-monitoring",
    prefix: "/dashboard/pic-monitoring",
    title: "PIC Monitoring Dashboard",
    get menuList() {
      return picMonitoringMenuList;
    },
  },
  "server-performance": {
    id: "server-performance",
    prefix: "/dashboard/server-performance",
    title: "Server Performance Dashboard",
    get menuList() {
      return serverPerformanceMenuList;
    },
  },
  "process-risk": {
    id: "process-risk",
    prefix: "/dashboard/process-risk",
    title: "Process & Risk Management Dashboard",
    get menuList() {
      return processRiskMenuList;
    },
  },
  "bug-tracker": {
    id: "bug-tracker",
    prefix: "/dashboard/bug-tracker",
    title: "Bug & Issue Tracker Dashboard",
    get menuList() {
      return bugTrackerMenuList;
    },
  },
  "learning-growth": {
    id: "learning-growth",
    prefix: "/dashboard/learning-growth",
    title: "Learning & Growth Dashboard",
    get menuList() {
      return learningGrowthMenuList;
    },
  },
  "overtime": {
    id: "overtime",
    prefix: "/dashboard/overtime",
    title: "Overtime Analytics Dashboard",
    get menuList() {
      return overtimeMenuList;
    },
  },
  "it-repair-maintenance": {
    id: "it-repair-maintenance",
    prefix: "/dashboard/it-repair-maintenance",
    title: "IT Repair & Maintenance Dashboard",
    get menuList() {
      return itRepairMenuList;
    },
  },
  "kaldev-performance": {
    id: "kaldev-performance",
    prefix: "/dashboard/kaldev-performance",
    title: "Kaldev Performance Dashboard",
    get menuList() {
      return kaldevPerformanceMenuList;
    },
  },
};

export function getDashboardForPath(pathname: string): DashboardRegistryItem | null {
  if (pathname.startsWith("/dashboard/helpdesk")) return DASHBOARD_REGISTRY["helpdesk"];
  if (pathname.startsWith("/dashboard/asset-maintenance")) return DASHBOARD_REGISTRY["asset-maintenance"];
  if (pathname.startsWith("/dashboard/access")) return DASHBOARD_REGISTRY["access-management"];
  if (pathname.startsWith("/dashboard/network-performance")) return DASHBOARD_REGISTRY["network-performance"];
  if (pathname.startsWith("/dashboard/pic-monitoring")) return DASHBOARD_REGISTRY["pic-monitoring"];
  if (pathname.startsWith("/dashboard/server-performance")) return DASHBOARD_REGISTRY["server-performance"];
  if (pathname.startsWith("/dashboard/process-risk")) return DASHBOARD_REGISTRY["process-risk"];
  if (pathname.startsWith("/dashboard/bug-tracker")) return DASHBOARD_REGISTRY["bug-tracker"];
  if (pathname.startsWith("/dashboard/learning-growth")) return DASHBOARD_REGISTRY["learning-growth"];
  if (pathname.startsWith("/dashboard/overtime")) return DASHBOARD_REGISTRY["overtime"];
  if (pathname.startsWith("/dashboard/it-repair-maintenance")) return DASHBOARD_REGISTRY["it-repair-maintenance"];
  if (pathname.startsWith("/dashboard/kaldev-performance")) return DASHBOARD_REGISTRY["kaldev-performance"];
  if (pathname === "/dashboard") return DASHBOARD_REGISTRY["helpdesk"];
  return null;
}

export function getDashboardTitle(pathname: string): string {
  const dash = getDashboardForPath(pathname);
  return dash?.title ?? "Advantage Dashboard";
}
