import {
  Building2,
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
  FolderKanban,
  GitBranch,
  Clock,
  Tag,
  Activity,
  Mail,
  Database,
  Boxes,
  Ticket,
  Inbox,
  ChartNoAxesCombined,
  ClipboardCheck,
  SearchCode,
  Award,
  Calendar,
  Wrench,
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

export const picMonitoringMenuList: Menu[] = [
  {
    href: "/dashboard/pic-monitoring",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/pic-monitoring/projects",
    label: "Projects",
    icon: FolderKanban,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/pic-monitoring/pipelines",
    label: "Pipelines",
    icon: GitBranch,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/pic-monitoring/sla",
    label: "Milestone & SLA",
    icon: Clock,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/pic-monitoring/kategori",
    label: "Kategori & Divisi",
    icon: Tag,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/pic-monitoring/sync-log",
    label: "Sync Log",
    icon: History,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const PIC_MONITORING_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/pic-monitoring": "menu.pic-monitoring.overview.view",
  "/dashboard/pic-monitoring/projects": "menu.pic-monitoring.project-list.view",
  "/dashboard/pic-monitoring/pipelines": "menu.pic-monitoring.pipelines.view",
  "/dashboard/pic-monitoring/sla": "menu.pic-monitoring.milestone-sla.view",
  "/dashboard/pic-monitoring/kategori": "menu.pic-monitoring.kategori-divisi.view",
  "/dashboard/pic-monitoring/sync-log": "dashboard.pic-monitoring.view",
};

export function canViewPicMonitoringMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/pic-monitoring")) return true;
  const perm = PIC_MONITORING_MENU_PERMISSIONS[pathname];
  if (!perm) return true;
  return permissions.includes(perm);
}

export const serverPerformanceMenuList: Menu[] = [
  {
    href: "/dashboard/server-performance",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/server-performance/dct-performance",
    label: "DCT Performance",
    icon: Activity,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/server-performance/email-performance",
    label: "Email Performance",
    icon: Mail,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/server-performance/cencon-performance",
    label: "Cencon Performance",
    icon: Server,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/server-performance/centran-performance",
    label: "Centran Performance",
    icon: Database,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const SERVER_PERFORMANCE_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/server-performance": "menu.server-performance.overview.view",
  "/dashboard/server-performance/dct-performance": "menu.server-performance.dct-performance.view",
  "/dashboard/server-performance/email-performance": "menu.server-performance.email-performance.view",
  "/dashboard/server-performance/cencon-performance": "menu.server-performance.cencon-performance.view",
  "/dashboard/server-performance/centran-performance": "menu.server-performance.centran-performance.view",
};

export function canViewServerPerformanceMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/server-performance")) return true;
  const perm = SERVER_PERFORMANCE_MENU_PERMISSIONS[pathname];
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

export const bugTrackerMenuList: Menu[] = [
  {
    href: "/dashboard/bug-tracker",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/bug-tracker/issues-data",
    label: "Issues Data",
    icon: Ticket,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/bug-tracker/issues-by-project",
    label: "Issues by Project",
    icon: Inbox,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/bug-tracker/comparison",
    label: "Comparison",
    icon: ChartNoAxesCombined,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/bug-tracker/qa-tasks",
    label: "QA Tasks",
    icon: ClipboardCheck,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/bug-tracker/bug-hunter",
    label: "Bug Hunter",
    icon: SearchCode,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const BUG_TRACKER_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/bug-tracker": "menu.bug-tracker.overview.view",
  "/dashboard/bug-tracker/issues-data": "menu.bug-tracker.issues-data.view",
  "/dashboard/bug-tracker/issues-by-project": "menu.bug-tracker.issues-project.view",
  "/dashboard/bug-tracker/comparison": "menu.bug-tracker.comparison.view",
  "/dashboard/bug-tracker/qa-tasks": "menu.bug-tracker.qa-tasks.view",
  "/dashboard/bug-tracker/bug-hunter": "menu.bug-tracker.bug-hunter.view",
};

export function canViewBugTrackerMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/bug-tracker")) return true;
  const perm = BUG_TRACKER_MENU_PERMISSIONS[pathname];
  if (!perm) return true;
  return permissions.includes(perm);
}

export const learningGrowthMenuList: Menu[] = [
  {
    href: "/dashboard/learning-growth",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/learning-growth/training",
    label: "Training",
    icon: Users,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/learning-growth/sertifikasi",
    label: "Certifications",
    icon: Award,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/learning-growth/timeline",
    label: "Timeline",
    icon: Calendar,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const LEARNING_GROWTH_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/learning-growth": "menu.learning-growth.overview.view",
  "/dashboard/learning-growth/training": "menu.learning-growth.training.view",
  "/dashboard/learning-growth/sertifikasi": "menu.learning-growth.certifications.view",
  "/dashboard/learning-growth/timeline": "menu.learning-growth.timeline.view",
};

export function canViewLearningGrowthMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/learning-growth")) return true;
  const perm = LEARNING_GROWTH_MENU_PERMISSIONS[pathname];
  if (!perm) return true;
  return permissions.includes(perm);
}

export const overtimeMenuList: Menu[] = [
  {
    href: "/dashboard/overtime",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/overtime/employee-compliance",
    label: "Employee Compliance",
    icon: Users,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/overtime/organization",
    label: "Organization Analysis",
    icon: Building2,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const OVERTIME_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/overtime": "menu.overtime.overview.view",
  "/dashboard/overtime/employee-compliance": "menu.overtime.employee-compliance.view",
  "/dashboard/overtime/organization": "menu.overtime.organization-analysis.view",
};

export function canViewOvertimeMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/overtime")) return true;
  const perm = OVERTIME_MENU_PERMISSIONS[pathname];
  if (!perm) return true;
  return permissions.includes(perm);
}

export const itRepairMenuList: Menu[] = [
  {
    href: "/dashboard/it-repair-maintenance",
    label: "Overview",
    icon: LayoutGrid,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/it-repair-maintenance/repair-tickets",
    label: "Repair Tickets",
    icon: Wrench,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
  {
    href: "/dashboard/it-repair-maintenance/golden-unit",
    label: "Golden Unit",
    icon: Award,
    submenus: [],
    allowedRoles: ["management", "internal"],
  },
];

const IT_REPAIR_MENU_PERMISSIONS: Record<string, string> = {
  "/dashboard/it-repair-maintenance": "menu.it-repair-maintenance.overview.view",
  "/dashboard/it-repair-maintenance/repair-tickets": "menu.it-repair-maintenance.repair-tickets.view",
  "/dashboard/it-repair-maintenance/golden-unit": "menu.it-repair-maintenance.golden-unit.view",
};

export function canViewItRepairMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  if (permissions.includes("*")) return true;
  if (!pathname.startsWith("/dashboard/it-repair-maintenance")) return true;
  const perm = IT_REPAIR_MENU_PERMISSIONS[pathname];
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
      if (!canViewPicMonitoringMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewServerPerformanceMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewProcessRiskMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewBugTrackerMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewLearningGrowthMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewOvertimeMenu(menu.href, permissions)) {
        return false;
      }
      if (!canViewItRepairMenu(menu.href, permissions)) {
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
        menu.href !== "/dashboard/pic-monitoring" &&
        menu.href !== "/dashboard/server-performance" &&
        menu.href !== "/dashboard/process-risk" &&
        menu.href !== "/dashboard/bug-tracker" &&
        menu.href !== "/dashboard/learning-growth" &&
        menu.href !== "/dashboard/overtime" &&
        menu.href !== "/dashboard/it-repair-maintenance" &&
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
