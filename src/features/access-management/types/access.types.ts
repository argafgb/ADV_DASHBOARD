import type { CatalogDashboardItem, PermissionKey } from "@/lib/access/catalog";
import type { Department } from "@/lib/access/data-scope";

export interface EnrolledUserItem {
  nik: string;
  name: string;
  codeDivision: string | null;
  status: "active" | "suspended" | "pending";
  role: {
    key: string;
    name: string;
  } | null;
  hasOverrides: boolean;
  scopeSummary: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface EmployeeSearchResultItem {
  nik: string;
  name: string;
  codeDivision: string | null;
  codeDepartment: string | null;
  branch?: string | null;
  employeeActive: boolean;
  access: {
    enrolled: boolean;
    status?: "active" | "suspended";
    role?: { key: string; name: string } | null;
    hasOverrides?: boolean;
  };
}

export interface UserAccessDetailDto {
  enrolled: boolean;
  version: number;
  status: "active" | "suspended";
  roleKey: string | null;
  overrides: { permission: PermissionKey; effect: "grant" | "revoke" }[];
  scope: {
    all: boolean;
    departments: Department[];
    branches: string[];
    regions: string[];
  };
  effectivePermissions: string[];
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UserDetailResponse {
  employee: {
    nik: string;
    name: string;
    codeDivision: string | null;
    codeDepartment: string | null;
    branch?: string | null;
    employeeActive: boolean;
  } | null;
  access: UserAccessDetailDto;
  canEdit: {
    ok: boolean;
    reason?: string;
  };
}

export interface RoleListItem {
  id: number;
  key: string;
  name: string;
  description: string | null;
  fleetRole: "management" | "internal";
  defaultScopeAll: boolean;
  isSystem: boolean;
  isActive: boolean;
  version: number;
  permissions: PermissionKey[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface RegionMetadata {
  code: string;
  name: string;
  isActive: boolean;
  branches: string[];
}

export const STANDARD_REGIONS: readonly RegionMetadata[] = [
  {
    code: "R1",
    name: "R1 (Sumatera)",
    isActive: true,
    branches: ["BATAM", "JAMBI", "MEDAN", "PADANG", "PALEMBANG", "PEKANBARU"],
  },
  {
    code: "R2",
    name: "R2 (Kalimantan & Sulawesi)",
    isActive: true,
    branches: ["BALIKPAPAN", "SAMARINDA", "BANJARMASIN", "SINGKAWANG", "PONTIANAK"],
  },
  {
    code: "R3",
    name: "R3 (Jabodetabek)",
    isActive: true,
    branches: ["BENGKULU", "LAMPUNG", "MERUYA", "RAWAMANGUN", "SERANG"],
  },
  {
    code: "R4",
    name: "R4 (Jawa Barat & Bali)",
    isActive: true,
    branches: ["BANDUNG", "DENPASAR", "KARAWANG", "KUPANG", "MATARAM", "TASIKMALAYA", "CIREBON"],
  },
  {
    code: "R5",
    name: "R5 (Jawa Tengah & DIY)",
    isActive: true,
    branches: ["KUDUS", "SEMARANG", "TEGAL", "YOGYAKARTA", "PURWOKERTO", "SOLO"],
  },
  {
    code: "R6",
    name: "R6 (Jawa Timur & Indonesia Timur)",
    isActive: true,
    branches: ["KEDIRI", "MALANG", "MANADO", "SURABAYA", "JEMBER", "MAKASSAR"],
  },
  {
    code: "OTHERS",
    name: "Others (Kantor Pusat / HO)",
    isActive: true,
    branches: ["SENEN GA", "TANAH ABANG 5", "CIDENG", "JAKARTA-CIDENG"],
  },
];

export const ALL_STANDARD_SITES: readonly string[] = [
  ...STANDARD_REGIONS.flatMap((r) => r.branches),
  "AMPASIT",
  "JAKARTA-CIDENG",
  "COS SEMARANG",
].sort();

export interface MetadataResponse {
  catalog: CatalogDashboardItem[];
  departments: Department[];
  branches: string[];
  regions: RegionMetadata[];
  fleetRoles: { value: "management" | "internal"; deniedDashboards: string[] }[];
}

export interface AuditLogEntry {
  action: string;
  resource: string | null;
  before: unknown;
  after: unknown;
}

export interface AuditLogRow {
  id: number;
  occurredAt: string;
  requestId: string;
  actor: {
    nik: string;
    name: string | null;
  };
  target: {
    type: "user" | "role";
    nik?: string;
    roleId?: number;
    label: string | null;
  };
  action: string;
  resource: string | null;
  before: unknown;
  after: unknown;
  /** Seluruh perubahan dalam satu aksi simpan (request_id yang sama). */
  entries: AuditLogEntry[];
}
