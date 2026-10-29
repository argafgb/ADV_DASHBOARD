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
      return true;
    })
    .map((menu) => {
      const isExactMatch = pathname === menu.href;
      const isSubPathMatch =
        menu.href !== "/dashboard/asset-maintenance" &&
        menu.href !== "/dashboard/helpdesk" &&
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
