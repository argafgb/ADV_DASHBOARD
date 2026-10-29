import type { AuthUser } from "@/types/auth.types";
import type { DataScope } from "./data-scope";
import { allowedMenusFromPermissions } from "./catalog";
import { allowedDashboardsFromPermissions } from "./effective-access";

type AccessClaims = {
  user: AuthUser;
  source: "db" | "legacy";
  fleetRole: AuthUser["role"];
  roleKey: string | null;
  roleName: string | null;
  permissions: Iterable<string>;
  scope: DataScope;
  version: number;
};

/** Both session endpoints must issue exactly the same authoritative claims. */
export function refreshedSessionUser(access: AccessClaims): AuthUser {
  return {
    ...access.user,
    role: access.fleetRole,
    roleKey: access.roleKey ?? undefined,
    roleName: access.roleName ?? undefined,
    allowedMenus: allowedMenusFromPermissions(access.permissions),
    allowedDashboards:
      access.source === "db"
        ? allowedDashboardsFromPermissions(access.permissions)
        : undefined,
    permissions: Array.from(access.permissions),
    dataScope: access.scope as any,
    accessVersion: access.version,
    accessSource: access.source,
  };
}

export function sessionClaimsChanged(before: AuthUser, after: AuthUser): boolean {
  return (
    before.role !== after.role ||
    before.accessSource !== after.accessSource ||
    before.roleKey !== after.roleKey ||
    before.roleName !== after.roleName ||
    before.accessVersion !== after.accessVersion ||
    JSON.stringify(before.dataScope) !== JSON.stringify(after.dataScope) ||
    JSON.stringify(before.allowedMenus?.slice().sort()) !==
      JSON.stringify(after.allowedMenus?.slice().sort()) ||
    JSON.stringify(before.allowedDashboards?.slice().sort()) !==
      JSON.stringify(after.allowedDashboards?.slice().sort())
  );
}
