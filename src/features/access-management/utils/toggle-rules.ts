import { PERMISSION_CATALOG, type PermissionKey } from "@/lib/access/catalog";
import { expandRoleDashboardMenus } from "@/lib/access/effective-access";

export function togglePermissionWithRules(
  currentEffective: Set<string>,
  roleDefaultPerms: Set<string>,
  targetPerm: PermissionKey,
  enabled: boolean,
): { permission: PermissionKey; effect: "grant" | "revoke" }[] {
  const nextEffective = new Set(currentEffective);

  // Find if targetPerm is a dashboard master permission or a menu permission
  const matchingDashboard = PERMISSION_CATALOG.find(
    (d) => d.permission === targetPerm,
  );

  const parentDashboard = PERMISSION_CATALOG.find((d) =>
    d.menus.some((m) => m.permission === targetPerm),
  );

  if (matchingDashboard) {
    // 1. Target is a Dashboard master permission
    if (enabled) {
      nextEffective.add(targetPerm);
      // Nyalakan menu bawaan atau semua menu dashboard
      if (matchingDashboard.menus.length > 0) {
        matchingDashboard.menus.forEach((m) => {
          nextEffective.add(m.permission);
        });
      }
    } else {
      nextEffective.delete(targetPerm);
      // Mematikan dashboard mematikan seluruh menunya
      if (matchingDashboard.menus.length > 0) {
        matchingDashboard.menus.forEach((m) => {
          nextEffective.delete(m.permission);
        });
      }
    }
  } else if (parentDashboard) {
    // 2. Target is a Menu permission
    // Overview wajib aktif dan tidak boleh dimatikan secara individu selama dashboard aktif
    if (targetPerm.endsWith(".overview.view") && !enabled) {
      return diffToOverrides(nextEffective, roleDefaultPerms);
    }
    if (enabled) {
      nextEffective.add(targetPerm);
      // Menyalakan menu otomatis memastikan dashboard utamanya ikut aktif
      if (parentDashboard.permission) {
        nextEffective.add(parentDashboard.permission);
      }
    } else {
      nextEffective.delete(targetPerm);
    }
  } else {
    // 3. Standalone permission (e.g. access.*)
    if (enabled) nextEffective.add(targetPerm);
    else nextEffective.delete(targetPerm);
  }

  return diffToOverrides(nextEffective, roleDefaultPerms);
}

function diffToOverrides(
  effective: Set<string>,
  roleDefaultPerms: Set<string>,
): { permission: PermissionKey; effect: "grant" | "revoke" }[] {
  // Role lama dapat menyimpan izin dashboard saja. Saat dibaca, seluruh menu
  // dashboard itu menjadi izin bawaan, jadi diff harus memakai dasar yang sama.
  const expandedDefaults = expandRoleDashboardMenus(roleDefaultPerms);
  const overrides: { permission: PermissionKey; effect: "grant" | "revoke" }[] =
    [];

  for (const p of effective) {
    if (!expandedDefaults.has(p)) {
      overrides.push({ permission: p as PermissionKey, effect: "grant" });
    }
  }

  for (const p of expandedDefaults) {
    if (!effective.has(p)) {
      overrides.push({ permission: p as PermissionKey, effect: "revoke" });
    }
  }

  return overrides;
}
