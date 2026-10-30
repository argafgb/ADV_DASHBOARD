import {
  LayoutGrid,
  TrendingUp,
  LucideIcon,
  CircleDollarSign,
  Package,
  SearchAlert,
  ShoppingCart,
  Monitor,
  Warehouse,
  ShieldCheck,
  AlertTriangle,
  Trophy,
  BookOpen,
  Users,
  Shield,
  History,
  BarChart2,
  Server,
  Boxes,
} from "lucide-react";
import { canViewAssetPmMenu } from "@/lib/auth/menu-access";
import { getDashboardForPath } from "./dashboard-registry";

export type UserRole = "management" | "internal";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

export type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
  allowedRoles: UserRole[];
};

export const assetMaintenanceMenuList: Menu[] = [
  {
    href: "/dashboard/asset-maintenance",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/asset-maintenance/asset-distribution",
    label: "Asset Distribution",
    icon: Package,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/asset-maintenance/cost-maintenance-budget",
    label: "Cost & Maintenance Budget",
    icon: CircleDollarSign,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/asset-maintenance/comparison",
    label: "Comparison",
    icon: TrendingUp,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/asset-maintenance/finding-asset-lifecycle",
    label: "Finding & Asset Lifecycle",
    icon: SearchAlert,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/asset-maintenance/asset-purchasing",
    label: "Asset Purchasing",
    icon: ShoppingCart,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/asset-maintenance/device-requests",
    label: "Device Requests",
    icon: Monitor,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/asset-maintenance/warehouse-stock",
    label: "Warehouse Stock",
    icon: Warehouse,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

export const helpdeskMenuList: Menu[] = [
  {
    href: "/dashboard/helpdesk",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/helpdesk/sla-performance",
    label: "SLA Performance",
    icon: ShieldCheck,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/helpdesk/comparison",
    label: "Comparison",
    icon: TrendingUp,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/helpdesk/rating-root-cause",
    label: "Ticketing & Root Cause",
    icon: AlertTriangle,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/helpdesk/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/helpdesk/fsd-blueprint",
    label: "FSD Blueprint",
    icon: BookOpen,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

export const accessMenuList: Menu[] = [
  {
    href: "/dashboard/access/users",
    label: "User Access",
    icon: Users,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/access/roles",
    label: "Roles & Permissions",
    icon: Shield,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/access/audit",
    label: "Audit Log",
    icon: History,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

export const networkPerformanceMenuList: Menu[] = [
  {
    href: "/dashboard/network-performance",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/network-performance/sla-performance",
    label: "SLA by Site",
    icon: BarChart2,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/network-performance/downtime-incidents",
    label: "Downtime Under SLA",
    icon: AlertTriangle,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/network-performance/isp-bandwidth",
    label: "ISP & Bandwidth",
    icon: TrendingUp,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/network-performance/asset-infrastructure",
    label: "Asset Infrastructure",
    icon: Server,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const NETWORK_PERFORMANCE_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/network-performance": "menu.network-performance.overview.view",
  "/dashboard/network-performance/sla-performance": "menu.network-performance.sla-site.view",
  "/dashboard/network-performance/downtime-incidents": "menu.network-performance.downtime.view",
  "/dashboard/network-performance/isp-bandwidth": "menu.network-performance.isp-bandwidth.view",
  "/dashboard/network-performance/asset-infrastructure": "menu.network-performance.asset-infrastructure.view",
};

export function canViewNetworkPerformanceMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/network-performance")) return true;
  const perm = NETWORK_PERFORMANCE_MENU_PERMISSIONS[pathname];
  if (!perm) return true;
  return permissions.includes(perm);
}

export const processRiskMenuList: Menu[] = [
  {
    href: "/dashboard/process-risk",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/process-risk/program",
    label: "Program",
    icon: Boxes,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const PROCESS_RISK_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/process-risk": "menu.process-risk.overview.view",
  "/dashboard/process-risk/program": "menu.process-risk.program.view",
};

export function canViewProcessRiskMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/process-risk")) return true;
  const perm = PROCESS_RISK_MENU_PERMISSIONS[pathname];
  if (!perm) return true;
  return permissions.includes(perm);
}

export function getMenuList(
  pathname: string,
  role: UserRole = "management",
  permissions?: string[],

): Menu[] {
  const dash = getDashboardForPath(pathname);
  const rawList = dash?.menuList ?? [];

  return rawList
    .filter((menu) => {
      if (menu.allowedRoles && !menu.allowedRoles.includes(role)) {
        return false;
      }
      if (!canViewAssetPmMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewNetworkPerformanceMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewProcessRiskMenu(menu.href, permissions)) {
        return false;
      }
      return true;
    })
    .map((menu) => {
      const isExactMatch = pathname === menu.href;
      const isSubPathMatch =
        menu.href !== "/dashboard/asset-maintenance" &&
        menu.href !== "/dashboard/helpdesk" &&
        menu.href !== "/dashboard/network-performance" &&
        menu.href !== "/dashboard/process-risk" &&
        pathname.startsWith(menu.href);

      return {
        ...menu,
        active: isExactMatch || isSubPathMatch,
        submenus: menu.submenus?.map((submenu) => ({
          ...submenu,
          active: pathname === submenu.href,
        })),
      };
    });
}
