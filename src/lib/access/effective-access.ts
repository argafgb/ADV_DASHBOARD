import {
  type UserRole,
  DASHBOARD_MENU_KEYS,
  MENU_PATHS,
  resolveAllowedMenus,
} from "@/lib/auth/permissions";
import {
  isPermissionKey,
  menuPermissionKey,
  PERMISSION_CATALOG,
  type PermissionKey,
} from "./catalog";

/**
 * Melengkapi izin role dengan seluruh menu dari setiap dashboard yang aktif.
 *
 * Seed role lama hanya menyimpan `dashboard.<id>.view` untuk dashboard selain
 * Helpdesk, tanpa baris `menu.<id>.*`. Akibatnya di editor menu-menunya tampil
 * mati padahal dashboard-nya menyala, dan baru terisi setelah switch dashboard
 * dimatikan lalu dinyalakan lagi. Makna "dashboard aktif tanpa daftar menu"
 * diartikan sebagai "seluruh menu dashboard itu aktif".
 *
 * Hanya berlaku bila role tidak menyimpan satu pun menu dashboard tersebut;
 * role yang sengaja memilih sebagian menu tidak diubah.
 */
export function expandRoleDashboardMenus(
  rolePermissions: Iterable<string>,
): Set<string> {
  const result = new Set<string>(rolePermissions);
  for (const dash of PERMISSION_CATALOG) {
    if (!dash.permission || !result.has(dash.permission)) continue;
    const hasAnyMenu = dash.menus.some((m) => result.has(m.permission));
    if (!hasAnyMenu) {
      for (const m of dash.menus) result.add(m.permission);
    }
  }
  return result;
}

/** Dashboard fleet (selain Helpdesk) yang boleh dibuka, menurut izin efektif. */
export function allowedDashboardsFromPermissions(
  perms: Iterable<string>,
): string[] {
  const permSet = perms instanceof Set ? perms : new Set(perms);
  const result: string[] = [];
  for (const dash of PERMISSION_CATALOG) {
    if (dash.permission && permSet.has(dash.permission)) {
      result.push(dash.id);
    }
  }
  return result;
}

export interface RoleInput {
  key?: string;
  isActive: boolean;
  permissions: Iterable<string>;
}

export interface UserOverrideInput {
  permissionKey: string;
  effect: "grant" | "revoke";
}

export interface ResolveEffectiveAccessInput {
  status: "active" | "suspended" | string;
  role?: RoleInput | null;
  overrides?: Iterable<UserOverrideInput> | null;
}

/**
 * Menghitung izin efektif dari status user, role bawaan, dan daftar override user.
 *
 * Aturan:
 * 1. User suspended atau tidak aktif -> izin kosong.
 * 2. Role inactive atau null -> izin bawaan role kosong.
 * 3. User overrides: grant menambahkan izin, revoke mencabut izin (menang atas role).
 * 4. Normalisasi: hanya kunci dalam katalog yang dipertahankan.
 * 5. Jika dashboard.helpdesk.view tidak ada, semua menu.helpdesk.* dicabut.
 */
export function resolveEffectiveAccess(
  input: ResolveEffectiveAccessInput,
): Set<PermissionKey> {
  if (input.status !== "active" || !input.role?.isActive) {
    return new Set<PermissionKey>();
  }

  const effective = new Set<string>();

  if (input.role && input.role.isActive) {
    for (const p of expandRoleDashboardMenus(input.role.permissions)) {
      if (isPermissionKey(p)) {
        effective.add(p);
      }
    }
  }

  if (input.overrides) {
    for (const ov of input.overrides) {
      if (!isPermissionKey(ov.permissionKey)) continue;

      if (ov.effect === "grant") {
        effective.add(ov.permissionKey);
      } else if (ov.effect === "revoke") {
        effective.delete(ov.permissionKey);
      }
    }
  }

  // Setiap dashboard yang aktif wajib menyertakan menu overview-nya,
  // dan dashboard yang tidak aktif seluruh menunya dicabut.
  for (const dash of PERMISSION_CATALOG) {
    if (dash.permission) {
      if (effective.has(dash.permission)) {
        const overview = dash.menus.find((m) => m.key === "overview" || m.permission.endsWith(".overview.view"));
        if (overview) {
          effective.add(overview.permission);
        }
      } else {
        for (const m of dash.menus) {
          effective.delete(m.permission);
        }
      }
    }
  }

  const result = new Set<PermissionKey>();
  const canUsePrivilegedHelpdeskMenus =
    input.role.key === "it-admin" || input.role.key === "it-product";
  for (const p of effective) {
    // These pages are reserved for IT Admin and IT Product, even if older role
    // templates or user overrides still contain these permission keys.
    if (
      (p === "menu.helpdesk.leaderboard.view" ||
        p === "menu.helpdesk.fsd-blueprint.view") &&
      !canUsePrivilegedHelpdeskMenus
    ) continue;
    // IT Admin is an operational role, even if an old override grants access.*.
    if (input.role.key === "it-admin" && p.startsWith("access.")) continue;
    if (isPermissionKey(p)) {
      result.add(p);
    }
  }

  return result;
}

/**
 * Menghasilkan set izin warisan (legacy) dari claim JWT role & allowedMenus.
 */
export function legacyAccessFromClaims(
  role: UserRole,
  allowedMenus?: readonly string[] | null,
): Set<PermissionKey> {
  const menus = resolveAllowedMenus(role, allowedMenus);
  const result = new Set<PermissionKey>();

  result.add("dashboard.helpdesk.view");
  for (const m of menus) {
    result.add(menuPermissionKey(m));
  }

  return result;
}

const ORDERED_DESTINATIONS: readonly { path: string; permission: PermissionKey }[] = [
  { path: MENU_PATHS.overview, permission: "menu.helpdesk.overview.view" },
  { path: MENU_PATHS["sla-performance"], permission: "menu.helpdesk.sla-performance.view" },
  { path: MENU_PATHS["rating-root-cause"], permission: "menu.helpdesk.rating-root-cause.view" },
  { path: MENU_PATHS.comparison, permission: "menu.helpdesk.comparison.view" },
  { path: MENU_PATHS.leaderboard, permission: "menu.helpdesk.leaderboard.view" },
  { path: MENU_PATHS["fsd-blueprint"], permission: "menu.helpdesk.fsd-blueprint.view" },
  { path: "/dashboard/access/users", permission: "access.users.manage" },
  { path: "/dashboard/access/roles", permission: "access.roles.manage" },
  { path: "/dashboard/access/audit", permission: "access.audit.view" },
];

/**
 * Menentukan path halaman pertama yang diizinkan untuk diarahkan saat login
 * atau saat menu yang dituju tidak memiliki hak akses.
 */
export function firstAllowedPath(perms: Iterable<string>): string {
  const permSet = perms instanceof Set ? perms : new Set(perms);

  for (const dest of ORDERED_DESTINATIONS) {
    if (dest.permission.startsWith("menu.helpdesk.")) {
      if (permSet.has("dashboard.helpdesk.view") && permSet.has(dest.permission)) {
        return dest.path;
      }
    } else if (permSet.has(dest.permission)) {
      return dest.path;
    }
  }

  return "/dashboard/forbidden";
}
