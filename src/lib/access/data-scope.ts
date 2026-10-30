import { normalizeDepartment } from "@/lib/helpdesk/dashboard-filters";

export const DEPARTMENTS = ["IT Support", "DCT Support"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export function isDepartment(value: unknown): value is Department {
  return typeof value === "string" && (DEPARTMENTS as readonly string[]).includes(value);
}

export type DataScope =
  | { all: true }
  | {
      all: false;
      departments: Department[] | null; // null = tidak dibatasi (seluruh departemen)
      branches: string[] | null;       // null = tidak dibatasi; string[] = daftar cabang UPPER(TRIM)
    };

export type DatasetCaps = {
  department: boolean;
  branch: boolean;
};

/** Validate signed scope claims too: malformed restrictions must never widen access. */
export function parseDataScope(value: unknown): DataScope {
  const denied: DataScope = { all: false, departments: [], branches: [] };
  if (!value || typeof value !== "object") return denied;
  const scope = value as Record<string, unknown>;
  if (scope.all === true) return { all: true };
  if (scope.all !== false) return denied;
  if (scope.departments !== null && (!Array.isArray(scope.departments) || !scope.departments.every(isDepartment))) return denied;
  if (scope.branches !== null && (!Array.isArray(scope.branches) || !scope.branches.every((b) => typeof b === "string" && b.trim()))) return denied;
  return {
    all: false,
    departments: scope.departments as Department[] | null,
    branches: scope.branches === null ? null : (scope.branches as string[]).map((b) => b.trim().toUpperCase()).sort(),
  };
}

export function requiresBranchScope(roleKey?: string | null): boolean {
  return roleKey === "staff" || roleKey === "branch-manager" || roleKey === "regional-head";
}

export const DATASET_CAPS = {
  datachat: { department: true, branch: true },
  trx: { department: true, branch: false },
  sla: { department: true, branch: false },
  productivity: { department: true, branch: false },
  attendance: { department: true, branch: false },
  fsd: { department: false, branch: false },
} as const;

export type DatasetAccess =
  | { kind: "deny" }
  | {
      kind: "allow";
      departments: Department[];
      branches: string[] | null;
    };

/**
 * Menyelesaikan pembatasan cakupan data pada level query database.
 * Aturan utama: cakupan berasal dari server, filter klien hanya boleh mempersempit.
 */
export function resolveDatasetAccess(
  scope: DataScope,
  caps: DatasetCaps,
  clientDept: string = "ALL",
): DatasetAccess {
  // 1. Tentukan departemen yang diizinkan oleh scope
  let allowedDepts: Department[];
  if (scope.all || scope.departments === null) {
    allowedDepts = [...DEPARTMENTS];
  } else {
    allowedDepts = [...scope.departments];
  }

  // 2. Filter klien hanya boleh mempersempit
  const normalizedClient = normalizeDepartment(clientDept);
  if (normalizedClient !== "ALL") {
    allowedDepts = allowedDepts.filter((d) => d === normalizedClient);
  }

  if (allowedDepts.length === 0) {
    return { kind: "deny" };
  }

  // 3. Dataset caps validation (fail-closed)
  // Bila scope membatasi cabang tetapi dataset tidak memiliki kolom cabang:
  if (!scope.all && scope.branches !== null && !caps.branch) {
    return { kind: "deny" };
  }

  // Bila scope membatasi departemen tetapi dataset tidak memiliki dimensi departemen (misal FSD):
  if (!scope.all && scope.departments !== null && !caps.department) {
    return { kind: "deny" };
  }

  // Bila scope membatasi cabang dan hasilnya kosong:
  if (!scope.all && scope.branches !== null && scope.branches.length === 0) {
    return { kind: "deny" };
  }

  return {
    kind: "allow",
    departments: allowedDepts,
    branches: scope.all ? null : scope.branches,
  };
}

/**
 * FNV-1a 32-bit hash murni (JS) untuk menyingkat cache key panjang.
 */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Menghasilkan cache key deterministik dan stabil untuk cakupan data.
 */
export function scopeKey(scope: DataScope): string {
  if (scope.all) return "all";

  const parts: string[] = [];

  if (scope.departments === null) {
    parts.push("d=*");
  } else {
    const sortedDepts = [...scope.departments].sort();
    parts.push(`d=${sortedDepts.join(",")}`);
  }

  if (scope.branches === null) {
    parts.push("b=*");
  } else {
    const sortedBranches = [...scope.branches].sort();
    parts.push(`b=${sortedBranches.join(",")}`);
  }

  const rawKey = parts.join(";");
  if (rawKey.length > 120) {
    return `h_${fnv1a(rawKey)}`;
  }
  return rawKey;
}

export interface AccessProfileRowScope {
  role_key?: string | null;
  scope_all: boolean;
  departments: string[];
  branches: string[];
  branch_restricted: boolean;
}

/**
 * Memetakan baris profil database menjadi objek DataScope runtime.
 */
export function buildDataScope(row: AccessProfileRowScope): DataScope {
  const validDepts = row.departments.filter(isDepartment).sort();
  const restrictedRole = requiresBranchScope(row.role_key);
  if (row.scope_all && !restrictedRole) {
    return row.departments.length === 0
      ? { all: true }
      : { all: false, departments: validDepts, branches: null };
  }

  // Jika tidak memiliki baris departemen dan tidak ada batasan cabang/region,
  // maka user tidak memiliki konfigurasi scope sama sekali -> tolak semua.
  if (validDepts.length === 0 && !row.branch_restricted) {
    return {
      all: false,
      departments: [],
      branches: [],
    };
  }

  const branches = row.branch_restricted || restrictedRole
    ? row.branches.map((b) => b.trim().toUpperCase()).filter(Boolean).sort()
    : null;

  return {
    all: false,
    departments: row.departments.length > 0 ? validDepts : null,
    branches,
  };
}
