import {
  assetMaintenanceMenuList,
  helpdeskMenuList,
  accessMenuList,
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
};

export function getDashboardForPath(pathname: string): DashboardRegistryItem | null {
  if (pathname.startsWith("/dashboard/helpdesk")) return DASHBOARD_REGISTRY["helpdesk"];
  if (pathname.startsWith("/dashboard/asset-maintenance")) return DASHBOARD_REGISTRY["asset-maintenance"];
  if (pathname.startsWith("/dashboard/access")) return DASHBOARD_REGISTRY["access-management"];
  if (pathname === "/dashboard") return DASHBOARD_REGISTRY["helpdesk"];
  return null;
}

export function getDashboardTitle(pathname: string): string {
  const dash = getDashboardForPath(pathname);
  return dash?.title ?? "Advantage Dashboard";
}
