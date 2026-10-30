import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";
import { verifyAuthToken } from "@/lib/auth/jwt";
import type { AuthRole, AuthUser } from "@/types/auth.types";
import { PERMISSION_KEYS, type PermissionKey } from "./catalog";
import {
  resolveEffectiveAccess,
  legacyAccessFromClaims,
} from "./effective-access";
import { buildDataScope, type DataScope } from "./data-scope";
import { getAccessProfileRaw } from "./access-profile";
import {
  AccessDeniedError,
  UnauthenticatedError,
} from "./errors";

export interface CurrentAccess {
  user: AuthUser;
  source: "db" | "legacy";
  status: "active" | "suspended";
  roleKey: string | null;
  roleName: string | null;
  fleetRole: AuthRole;
  permissions: ReadonlySet<PermissionKey>;
  scope: DataScope;
  version: number;
}

const isSkipAuth =
  (process.env.SKIP_AUTH === "true" ||
    process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ||
    process.env.DISABLE_AUTH === "true") &&
  process.env.NODE_ENV !== "production";

if (
  process.env.NODE_ENV === "production" &&
  (process.env.SKIP_AUTH === "true" ||
    process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ||
    process.env.DISABLE_AUTH === "true")
) {
  console.warn(
    "[SECURITY WARNING] SKIP_AUTH / DISABLE_AUTH diabaikan pada NODE_ENV=production!",
  );
}

/**
 * Mengambil identitas user sesi dari cookie JWT terverifikasi.
 * Di-memoize per-request menggunakan React cache().
 */
export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  if (isSkipAuth) {
    return {
      id: "dev-local",
      nik: "DEV-LOCAL",
      username: "dev",
      name: "Local Developer",
      role: "internal",
    };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    return verifyAuthToken(token);
  } catch {
    return null;
  }
});

/**
 * Menghitung hak akses otoritatif saat ini dari PostgreSQL.
 * Di-memoize per-request menggunakan React cache().
 */
export const getCurrentAccess = cache(async (): Promise<CurrentAccess | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  if (isSkipAuth) {
    return {
      user,
      source: "legacy",
      status: "active",
      roleKey: "it-admin",
      roleName: "IT Admin (Dev)",
      fleetRole: "internal",
      permissions: new Set(PERMISSION_KEYS),
      scope: { all: true },
      version: 1,
    };
  }

  const profile = await getAccessProfileRaw(user.nik);

  // 1. User terdaftar di tabel helpdesk.access_user
  if (profile) {
    const fleetRole: AuthRole =
      profile.fleet_role === "management" || profile.fleet_role === "internal"
        ? profile.fleet_role
        : user.role;

    if (profile.status !== "active" || !profile.role_key || !profile.role_active) {
      return {
        user,
        source: "db",
        status: "suspended",
        roleKey: profile.role_key,
        roleName: profile.role_name,
        fleetRole,
        permissions: new Set<PermissionKey>(),
        scope: { all: false, departments: [], branches: [] },
        version: profile.version,
      };
    }

    const overrides = [
      ...profile.grants.map((p) => ({
        permissionKey: p,
        effect: "grant" as const,
      })),
      ...profile.revokes.map((p) => ({
        permissionKey: p,
        effect: "revoke" as const,
      })),
    ];

    const effective = resolveEffectiveAccess({
      status: "active",
      role: profile.role_key
        ? {
            key: profile.role_key,
            isActive: profile.role_active ?? false,
            permissions: profile.role_permissions,
          }
        : null,
      overrides,
    });

    const scope = buildDataScope(profile);

    return {
      user,
      source: "db",
      status: "active",
      roleKey: profile.role_key,
      roleName: profile.role_name,
      fleetRole,
      permissions: effective,
      scope,
      version: profile.version,
    };
  }

  // 2. User belum terdaftar di access_user
  const policy = (process.env.ACCESS_UNREGISTERED_POLICY ?? "legacy").trim().toLowerCase();
  if (policy === "deny" || user.accessSource === "db" || user.allowedDashboards !== undefined) {
    return {
      user,
      source: "db",
      status: "suspended",
      roleKey: null,
      roleName: null,
      fleetRole: user.role,
      permissions: new Set<PermissionKey>(),
      scope: { all: false, departments: [], branches: [] },
      version: 0,
    };
  }

  // Bawaan legacy: hak akses diturunkan dari division_access / claims JWT
  const legacyPerms = legacyAccessFromClaims(user.role, user.allowedMenus);
  const isInternal = user.role === "internal";
  return {
    user,
    source: "legacy",
    status: "active",
    roleKey: isInternal ? "it-admin" : "staff",
    roleName: isInternal ? "IT Admin" : "Staff",
    fleetRole: user.role,
    permissions: legacyPerms,
    scope: isInternal
      ? { all: true }
      : { all: false, departments: null, branches: [] },
    version: 1,
  };
});

/**
 * Penjaga rute halaman Server Component (RSC).
 * Mengarahkan ke /login bila belum terautentikasi atau /dashboard/forbidden bila tidak berhak.
 */
export async function requirePagePermission(
  key: PermissionKey,
): Promise<CurrentAccess> {
  const access = await getCurrentAccess();
  if (!access) {
    redirect("/login");
  }

  if (access.status !== "active" || !access.permissions.has(key)) {
    redirect("/dashboard/forbidden");
  }

  return access;
}

/**
 * Penjaga Server Actions. Melemparkan exception bila ditolak.
 */
export async function requireActionPermission(
  key: PermissionKey,
): Promise<CurrentAccess> {
  const access = await getCurrentAccess();
  if (!access) {
    throw new UnauthenticatedError();
  }

  if (access.status !== "active" || !access.permissions.has(key)) {
    throw new AccessDeniedError(
      "Anda tidak memiliki hak akses untuk tindakan ini.",
      "FORBIDDEN",
      403,
    );
  }

  return access;
}

/**
 * Validasi origin untuk proteksi CSRF pada mutasi API.
 */
export async function assertSameOrigin(req: Request): Promise<void> {
  const origin = req.headers.get("origin");
  if (!origin) return; // Non-browser / GET requests

  const hostHeader = req.headers.get("host") ?? (await headers()).get("host");
  const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL;

  let originHost = "";
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    throw new AccessDeniedError("Format header Origin tidak valid.", "CSRF_DETECTED", 403);
  }

  const matchesHost = hostHeader && originHost === hostHeader.toLowerCase();
  let matchesIssuer = false;
  if (issuerUrl) {
    try {
      matchesIssuer = originHost === new URL(issuerUrl).host.toLowerCase();
    } catch {
      // ignore
    }
  }

  if (!matchesHost && !matchesIssuer) {
    throw new AccessDeniedError(
      "Permintaan lintas domain (CSRF) ditolak.",
      "CSRF_DETECTED",
      403,
    );
  }
}

/**
 * Penjaga endpoint API Route Handler.
 */
export async function requireApiPermission(
  req: Request,
  required: PermissionKey | PermissionKey[] | { anyOf: PermissionKey[] },
): Promise<CurrentAccess> {
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await assertSameOrigin(req);
  }

  const access = await getCurrentAccess();
  if (!access) {
    throw new UnauthenticatedError();
  }

  if (access.status !== "active") {
    throw new AccessDeniedError(
      "Akun Anda sedang dinonaktifkan.",
      "ACCOUNT_SUSPENDED",
      403,
    );
  }

  let hasAccess = false;
  if (typeof required === "string") {
    hasAccess = access.permissions.has(required);
  } else if (Array.isArray(required)) {
    hasAccess = required.every((k) => access.permissions.has(k));
  } else if ("anyOf" in required) {
    hasAccess = required.anyOf.some((k) => access.permissions.has(k));
  }

  if (!hasAccess) {
    throw new AccessDeniedError(
      "Anda tidak memiliki hak akses yang dibutuhkan untuk memanggil resource ini.",
      "FORBIDDEN",
      403,
    );
  }

  return access;
}
