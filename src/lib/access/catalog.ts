import {
  type DashboardMenuKey,
  type UserRole,
  DASHBOARD_MENU_KEYS,
  MENU_PATHS,
  menuKeyForPath,
} from "@/lib/auth/permissions";

export const PERMISSION_KEYS = [
  // 1. IT & DCT Helpdesk Dashboard (6 menu)
  "dashboard.helpdesk.view",
  "menu.helpdesk.overview.view",
  "menu.helpdesk.sla-performance.view",
  "menu.helpdesk.comparison.view",
  "menu.helpdesk.rating-root-cause.view",
  "menu.helpdesk.leaderboard.view",
  "menu.helpdesk.fsd-blueprint.view",

  // 2. Asset IT & PM Dashboard (6 menu)
  "dashboard.asset-pm.view",
  "menu.asset-pm.overview.view",
  "menu.asset-pm.asset-distribution.view",
  "menu.asset-pm.cost-budget.view",
  "menu.asset-pm.comparison.view",
  "menu.asset-pm.finding-lifecycle.view",
  "menu.asset-pm.purchasing.view",

  // 3. PIC Monitoring Dashboard (5 menu)
  "dashboard.pic-monitoring.view",
  "menu.pic-monitoring.overview.view",
  "menu.pic-monitoring.pipelines.view",
  "menu.pic-monitoring.milestone-sla.view",
  "menu.pic-monitoring.kategori-divisi.view",
  "menu.pic-monitoring.project-list.view",

  // 4. Bug & List Tracker Dashboard (6 menu)
  "dashboard.bug-tracker.view",
  "menu.bug-tracker.overview.view",
  "menu.bug-tracker.issues-data.view",
  "menu.bug-tracker.issues-project.view",
  "menu.bug-tracker.comparison.view",
  "menu.bug-tracker.qa-tasks.view",
  "menu.bug-tracker.bug-hunter.view",

  // 5. Learning & Growth Dashboard (4 menu)
  "dashboard.learning-growth.view",
  "menu.learning-growth.overview.view",
  "menu.learning-growth.training.view",
  "menu.learning-growth.certifications.view",
  "menu.learning-growth.timeline.view",

  // 6. Server Performance Dashboard (5 menu)
  "dashboard.server-performance.view",
  "menu.server-performance.overview.view",
  "menu.server-performance.dct-performance.view",
  "menu.server-performance.email-performance.view",
  "menu.server-performance.cencon-performance.view",
  "menu.server-performance.centran-performance.view",

  // 7. Network Performance Dashboard (5 menu)
  "dashboard.network-performance.view",
  "menu.network-performance.overview.view",
  "menu.network-performance.sla-site.view",
  "menu.network-performance.downtime.view",
  "menu.network-performance.isp-bandwidth.view",
  "menu.network-performance.asset-infrastructure.view",

  // 8. Process & Risk Dashboard (2 menu)
  "dashboard.process-risk.view",
  "menu.process-risk.overview.view",
  "menu.process-risk.program.view",

  // 9. Overtime Dashboard (3 menu)
  "dashboard.overtime.view",
  "menu.overtime.overview.view",
  "menu.overtime.organization-analysis.view",
  "menu.overtime.employee-compliance.view",

  // 10. IT Repair & Maintenance Dashboard (3 menu)
  "dashboard.it-repair-maintenance.view",
  "menu.it-repair-maintenance.overview.view",
  "menu.it-repair-maintenance.repair-tickets.view",
  "menu.it-repair-maintenance.golden-unit.view",

  // 11. Kaldev Performance Dashboard (4 menu)
  "dashboard.kaldev-performance.view",
  "menu.kaldev-performance.overview.view",
  "menu.kaldev-performance.team-performance.view",
  "menu.kaldev-performance.action-required.view",
  "menu.kaldev-performance.project-register.view",

  // 12. Access Management Dashboard (3 menu)
  "access.users.manage",
  "access.roles.manage",
  "access.audit.view",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSION_KEYS);

export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === "string" && PERMISSION_SET.has(value);
}

export function menuPermissionKey(menuKey: DashboardMenuKey): PermissionKey {
  return `menu.helpdesk.${menuKey}.view` as PermissionKey;
}

export function menuKeyFromPermission(perm: string): DashboardMenuKey | null {
  if (!perm.startsWith("menu.helpdesk.") || !perm.endsWith(".view"))
    return null;
  const rawKey = perm.slice("menu.helpdesk.".length, -".view".length);
  return (DASHBOARD_MENU_KEYS as readonly string[]).includes(rawKey)
    ? (rawKey as DashboardMenuKey)
    : null;
}

export function allowedMenusFromPermissions(
  perms: Iterable<string>,
): DashboardMenuKey[] {
  const permSet = perms instanceof Set ? perms : new Set(perms);
  if (!permSet.has("dashboard.helpdesk.view")) return [];

  const result: DashboardMenuKey[] = [];
  for (const menu of DASHBOARD_MENU_KEYS) {
    if (permSet.has(menuPermissionKey(menu))) {
      result.push(menu);
    }
  }
  return result;
}

export const ACCESS_MANAGEMENT_PATHS: Record<string, PermissionKey> = {
  "/dashboard/access/users": "access.users.manage",
  "/dashboard/access/roles": "access.roles.manage",
  "/dashboard/access/audit": "access.audit.view",
};

/**
 * Mendeteksi izin yang dibutuhkan untuk mengakses suatu pathname.
 * Mengembalikan null bila path tidak diproteksi oleh katalog izin
 * (misalnya /dashboard/forbidden atau /dashboard/access redirector).
 */
export function permissionForPath(pathname: string): PermissionKey | null {
  for (const [route, perm] of Object.entries(ACCESS_MANAGEMENT_PATHS)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return perm;
    }
  }

  const menu = menuKeyForPath(pathname);
  if (menu) {
    return menuPermissionKey(menu);
  }

  return null;
}

export const LEGACY_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  management: [
    "dashboard.helpdesk.view",
    "menu.helpdesk.overview.view",
    "menu.helpdesk.sla-performance.view",
    "menu.helpdesk.rating-root-cause.view",
    "dashboard.asset-pm.view",
    "menu.asset-pm.overview.view",
    "dashboard.pic-monitoring.view",
    "menu.pic-monitoring.overview.view",
    "dashboard.learning-growth.view",
    "menu.learning-growth.overview.view",
    "dashboard.server-performance.view",
    "menu.server-performance.overview.view",
    "dashboard.network-performance.view",
    "menu.network-performance.overview.view",
    "dashboard.process-risk.view",
    "menu.process-risk.overview.view",
    "dashboard.overtime.view",
    "menu.overtime.overview.view",
    "dashboard.it-repair-maintenance.view",
    "menu.it-repair-maintenance.overview.view",
    "menu.it-repair-maintenance.repair-tickets.view",
    "menu.it-repair-maintenance.golden-unit.view",
    "dashboard.kaldev-performance.view",
    "menu.kaldev-performance.overview.view",
  ],
  internal: [
    "dashboard.helpdesk.view",
    "menu.helpdesk.overview.view",
    "menu.helpdesk.sla-performance.view",
    "menu.helpdesk.comparison.view",
    "menu.helpdesk.rating-root-cause.view",
    "menu.helpdesk.leaderboard.view",
    "menu.helpdesk.fsd-blueprint.view",
    "dashboard.asset-pm.view",
    "menu.asset-pm.overview.view",
    "dashboard.pic-monitoring.view",
    "menu.pic-monitoring.overview.view",
    "dashboard.bug-tracker.view",
    "menu.bug-tracker.overview.view",
    "dashboard.learning-growth.view",
    "menu.learning-growth.overview.view",
    "dashboard.server-performance.view",
    "menu.server-performance.overview.view",
    "dashboard.network-performance.view",
    "menu.network-performance.overview.view",
    "dashboard.process-risk.view",
    "menu.process-risk.overview.view",
    "dashboard.overtime.view",
    "menu.overtime.overview.view",
    "menu.overtime.organization-analysis.view",
    "menu.overtime.employee-compliance.view",
    "dashboard.it-repair-maintenance.view",
    "menu.it-repair-maintenance.overview.view",
    "menu.it-repair-maintenance.repair-tickets.view",
    "menu.it-repair-maintenance.golden-unit.view",
    "dashboard.kaldev-performance.view",
    "menu.kaldev-performance.overview.view",
    "menu.kaldev-performance.team-performance.view",
    "menu.kaldev-performance.action-required.view",
    "menu.kaldev-performance.project-register.view",
  ],
};

export interface CatalogMenuItem {
  key: string;
  name: string;
  permission: PermissionKey;
  path?: string;
  description?: string;
}

export interface CatalogDashboardItem {
  id: string;
  name: string;
  permission: PermissionKey | null;
  description?: string;
  category?: string;
  hasSiteFilter?: boolean;
  menus: CatalogMenuItem[];
}

export const PERMISSION_CATALOG: readonly CatalogDashboardItem[] = [
  // 1. IT & DCT Helpdesk Dashboard (6 menu)
  {
    id: "helpdesk",
    name: "IT & DCT Helpdesk Dashboard",
    permission: "dashboard.helpdesk.view",
    description:
      "Dashboard utama analitik helpdesk, tren SLA, volume tiket, dan evaluasi layanan.",
    category: "Helpdesk & Tiket",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.helpdesk.overview.view",
        path: MENU_PATHS.overview,
      },
      {
        key: "sla-performance",
        name: "SLA Performance",
        permission: "menu.helpdesk.sla-performance.view",
        path: MENU_PATHS["sla-performance"],
      },
      {
        key: "comparison",
        name: "Comparison",
        permission: "menu.helpdesk.comparison.view",
        path: MENU_PATHS.comparison,
      },
      {
        key: "rating-root-cause",
        name: "Ticketing & Root Cause",
        permission: "menu.helpdesk.rating-root-cause.view",
        path: MENU_PATHS["rating-root-cause"],
      },
      {
        key: "leaderboard",
        name: "Leaderboard",
        permission: "menu.helpdesk.leaderboard.view",
        path: MENU_PATHS.leaderboard,
      },
      {
        key: "fsd-blueprint",
        name: "FSD Blueprint",
        permission: "menu.helpdesk.fsd-blueprint.view",
        path: MENU_PATHS["fsd-blueprint"],
      },
    ],
  },

  // 2. Asset IT & PM Dashboard (6 menu, Filter Site: Ya)
  {
    id: "asset-pm",
    name: "Asset IT & PM Dashboard",
    permission: "dashboard.asset-pm.view",
    description:
      "Manajemen inventaris aset hardware/software dan jadwal pemeliharaan preventif (PM).",
    category: "Operasional IT",
    hasSiteFilter: true,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.asset-pm.overview.view",
      },
      {
        key: "asset-distribution",
        name: "Asset Distribution",
        permission: "menu.asset-pm.asset-distribution.view",
      },
      {
        key: "cost-budget",
        name: "Cost & Maintenance Budget",
        permission: "menu.asset-pm.cost-budget.view",
      },
      {
        key: "comparison",
        name: "Comparison",
        permission: "menu.asset-pm.comparison.view",
      },
      {
        key: "finding-lifecycle",
        name: "Finding & Asset Lifecycle",
        permission: "menu.asset-pm.finding-lifecycle.view",
      },
      {
        key: "purchasing",
        name: "Asset Purchasing",
        permission: "menu.asset-pm.purchasing.view",
      },
    ],
  },

  // 3. PIC Monitoring Dashboard (5 menu)
  {
    id: "pic-monitoring",
    name: "PIC Monitoring Dashboard",
    permission: "dashboard.pic-monitoring.view",
    description:
      "Monitoring beban kerja personil, status pengerjaan tiket aktif, dan performa PIC.",
    category: "Operasional IT",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.pic-monitoring.overview.view",
      },
      {
        key: "pipelines",
        name: "Pipelines",
        permission: "menu.pic-monitoring.pipelines.view",
      },
      {
        key: "milestone-sla",
        name: "Milestone & SLA",
        permission: "menu.pic-monitoring.milestone-sla.view",
      },
      {
        key: "kategori-divisi",
        name: "Kategori & Divisi",
        permission: "menu.pic-monitoring.kategori-divisi.view",
      },
      {
        key: "project-list",
        name: "Project List",
        permission: "menu.pic-monitoring.project-list.view",
      },
    ],
  },

  // 4. Bug & List Tracker Dashboard (6 menu)
  {
    id: "bug-tracker",
    name: "Bug & List Tracker Dashboard",
    permission: "dashboard.bug-tracker.view",
    description:
      "Pelacakan defect aplikasi, status pengujian sistem, dan pelaporan issue teknis.",
    category: "Development & QA",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.bug-tracker.overview.view",
      },
      {
        key: "issues-data",
        name: "Issues Data",
        permission: "menu.bug-tracker.issues-data.view",
      },
      {
        key: "issues-project",
        name: "Issues by Project",
        permission: "menu.bug-tracker.issues-project.view",
      },
      {
        key: "comparison",
        name: "Comparison",
        permission: "menu.bug-tracker.comparison.view",
      },
      {
        key: "qa-tasks",
        name: "QA Tasks",
        permission: "menu.bug-tracker.qa-tasks.view",
      },
      {
        key: "bug-hunter",
        name: "Bug Hunter",
        permission: "menu.bug-tracker.bug-hunter.view",
      },
    ],
  },

  // 5. Learning & Growth Dashboard (4 menu)
  {
    id: "learning-growth",
    name: "Learning & Growth Dashboard",
    permission: "dashboard.learning-growth.view",
    description:
      "Pemantauan program pelatihan, peningkatan kompetensi, dan sertifikasi karyawan.",
    category: "Sumber Daya Manusia",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.learning-growth.overview.view",
      },
      {
        key: "training",
        name: "Training",
        permission: "menu.learning-growth.training.view",
      },
      {
        key: "certifications",
        name: "Certifications",
        permission: "menu.learning-growth.certifications.view",
      },
      {
        key: "timeline",
        name: "Timeline",
        permission: "menu.learning-growth.timeline.view",
      },
    ],
  },

  // 6. Server Performance Dashboard (5 menu)
  {
    id: "server-performance",
    name: "Server Performance Dashboard",
    permission: "dashboard.server-performance.view",
    description:
      "Metrik kesehatan server, utilisasi CPU/Memory, dan ketersediaan sistem inti.",
    category: "Infrastruktur",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.server-performance.overview.view",
      },
      {
        key: "dct-performance",
        name: "DCT Performance",
        permission: "menu.server-performance.dct-performance.view",
      },
      {
        key: "email-performance",
        name: "Email Performance",
        permission: "menu.server-performance.email-performance.view",
      },
      {
        key: "cencon-performance",
        name: "Cencon Performance",
        permission: "menu.server-performance.cencon-performance.view",
      },
      {
        key: "centran-performance",
        name: "Centran Performance",
        permission: "menu.server-performance.centran-performance.view",
      },
    ],
  },

  // 7. Network Performance Dashboard (5 menu, Filter Site: Ya)
  {
    id: "network-performance",
    name: "Network Performance Dashboard",
    permission: "dashboard.network-performance.view",
    description:
      "Monitoring kestabilan jaringan antar cabang, latency koneksi, dan bandwidth.",
    category: "Infrastruktur",
    hasSiteFilter: true,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.network-performance.overview.view",
      },
      {
        key: "sla-site",
        name: "SLA by site",
        permission: "menu.network-performance.sla-site.view",
      },
      {
        key: "downtime",
        name: "Downtime Under SLA",
        permission: "menu.network-performance.downtime.view",
      },
      {
        key: "isp-bandwidth",
        name: "ISP & bandwidth",
        permission: "menu.network-performance.isp-bandwidth.view",
      },
      {
        key: "asset-infrastructure",
        name: "Asset Infrastructure",
        permission: "menu.network-performance.asset-infrastructure.view",
      },
    ],
  },

  // 8. Process & Risk Dashboard (2 menu)
  {
    id: "process-risk",
    name: "Process & Risk Dashboard",
    permission: "dashboard.process-risk.view",
    description:
      "Evaluasi risiko operasional, kepatuhan SOP perusahaan, dan manajemen mitigasi.",
    category: "Tata Kelola & Risiko",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.process-risk.overview.view",
      },
      {
        key: "program",
        name: "Program",
        permission: "menu.process-risk.program.view",
      },
    ],
  },

  // 9. Overtime Dashboard (3 menu)
  {
    id: "overtime",
    name: "Overtime Dashboard",
    permission: "dashboard.overtime.view",
    description:
      "Analisis lembur karyawan, jam kerja organisasi, dan kepatuhan beban kerja.",
    category: "Operasional & SDM",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.overtime.overview.view",
      },
      {
        key: "organization-analysis",
        name: "Organization Analysis",
        permission: "menu.overtime.organization-analysis.view",
      },
      {
        key: "employee-compliance",
        name: "Employee Compliance",
        permission: "menu.overtime.employee-compliance.view",
      },
    ],
  },

  // 10. IT Repair & Maintenance Dashboard (3 menu)
  {
    id: "it-repair-maintenance",
    name: "IT Repair & Maintenance Dashboard",
    permission: "dashboard.it-repair-maintenance.view",
    description:
      "Monitoring perbaikan dan pemeliharaan perangkat IT serta data servis.",
    category: "Operasional IT",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.it-repair-maintenance.overview.view",
      },
      {
        key: "repair-tickets",
        name: "Repair Tickets",
        permission: "menu.it-repair-maintenance.repair-tickets.view",
      },
      {
        key: "golden-unit",
        name: "Golden Unit",
        permission: "menu.it-repair-maintenance.golden-unit.view",
      },
    ],
  },

  // 11. Kaldev Performance Dashboard (4 menu)
  {
    id: "kaldev-performance",
    name: "Kaldev Performance Dashboard",
    permission: "dashboard.kaldev-performance.view",
    description:
      "Monitoring performa pengembang, backlog, dan aktivitas tim Kaldev.",
    category: "Development & QA",
    hasSiteFilter: false,
    menus: [
      {
        key: "overview",
        name: "Overview",
        permission: "menu.kaldev-performance.overview.view",
      },
      {
        key: "team-performance",
        name: "Team Performance",
        permission: "menu.kaldev-performance.team-performance.view",
      },
      {
        key: "action-required",
        name: "Action Required",
        permission: "menu.kaldev-performance.action-required.view",
      },
      {
        key: "project-register",
        name: "Project Register",
        permission: "menu.kaldev-performance.project-register.view",
      },
    ],
  },

  // 12. Access Management Dashboard (3 menu)
  {
    id: "access-management",
    name: "Access Management",
    permission: null,
    description:
      "Pengelolaan pengguna, role template, dan pengawasan jejak audit akses.",
    category: "Sistem & Keamanan",
    hasSiteFilter: false,
    menus: [
      {
        key: "users",
        name: "User Access",
        permission: "access.users.manage",
        path: "/dashboard/access/users",
        description:
          "Kelola pengguna, penugasan role, override izin, dan cakupan data",
      },
      {
        key: "roles",
        name: "Roles & Permissions",
        permission: "access.roles.manage",
        path: "/dashboard/access/roles",
        description: "Kelola template role dan konfigurasi izin standar",
      },
      {
        key: "audit",
        name: "Audit Log",
        permission: "access.audit.view",
        path: "/dashboard/access/audit",
        description:
          "Riwayat dan jejak audit perubahan hak akses pengguna dan role",
      },
    ],
  },
];

/**
 * Seluruh izin dashboard & menu operasional (11 dashboard utama dan sub-menunya).
 * Tidak mencakup izin administratif sistem (access-management).
 * Digunakan sebagai nilai bawaan (default enabled) saat membuat role baru.
 */
export const ALL_DASHBOARD_MENU_PERMISSIONS: readonly PermissionKey[] =
  PERMISSION_CATALOG.filter((d) => d.id !== "access-management").flatMap(
    (d) => [
      ...(d.permission ? [d.permission] : []),
      ...d.menus.map((m) => m.permission),
    ],
  );
