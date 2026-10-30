import {
  assetMaintenanceMenuList,
  helpdeskMenuList,
  accessMenuList,
  networkPerformanceMenuList,
  picMonitoringMenuList,
  serverPerformanceMenuList,
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
};

export function getDashboardForPath(pathname: string): DashboardRegistryItem | null {
  if (pathname.startsWith("/dashboard/helpdesk")) return DASHBOARD_REGISTRY["helpdesk"];
  if (pathname.startsWith("/dashboard/asset-maintenance")) return DASHBOARD_REGISTRY["asset-maintenance"];
  if (pathname.startsWith("/dashboard/access")) return DASHBOARD_REGISTRY["access-management"];
  if (pathname.startsWith("/dashboard/network-performance")) return DASHBOARD_REGISTRY["network-performance"];
  if (pathname.startsWith("/dashboard/pic-monitoring")) return DASHBOARD_REGISTRY["pic-monitoring"];
  if (pathname.startsWith("/dashboard/server-performance")) return DASHBOARD_REGISTRY["server-performance"];
  if (pathname === "/dashboard") return DASHBOARD_REGISTRY["helpdesk"];
  return null;
}

export function getDashboardTitle(pathname: string): string {
  const dash = getDashboardForPath(pathname);
  return dash?.title ?? "Advantage Dashboard";
}
