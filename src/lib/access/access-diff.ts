export interface AuditRowDraft {
  action: string;
  resource: string;
  before_value: unknown;
  after_value: unknown;
}

export interface UserAccessSnapshot {
  status: "active" | "suspended";
  roleKey: string | null;
  overrides: { permission: string; effect: "grant" | "revoke" }[];
  scope: {
    all: boolean;
    departments: string[];
    branches: string[];
    regions: string[];
  };
}

export interface DesiredUserAccess {
  status: "active" | "suspended";
  roleKey: string | null;
  overrides: { permission: string; effect: "grant" | "revoke" }[];
  scope: {
    all: boolean;
    departments?: string[];
    branches?: string[];
    regions?: string[];
  };
}

function normalizeScopeForDiff(s?: DesiredUserAccess["scope"]) {
  if (!s) return { all: true, departments: [], branches: [], regions: [] };
  if (s.all) return { all: true, departments: [...(s.departments || [])].sort(), branches: [], regions: [] };
  return {
    all: false,
    departments: [...(s.departments || [])].sort(),
    branches: [...(s.branches || [])].map((b) => b.toUpperCase().trim()).sort(),
    regions: [...(s.regions || [])].map((r) => r.toUpperCase().trim()).sort(),
  };
}

/**
 * Menghitung perbedaan akses pengguna sebelum dan sesudah perubahan
 * untuk mencatat baris audit log secara terstruktur.
 */
export function diffUserAccess(
  before: UserAccessSnapshot | null,
  after: DesiredUserAccess,
): AuditRowDraft[] {
  const diffs: AuditRowDraft[] = [];

  if (!before) {
    diffs.push({
      action: "user.enrolled",
      resource: "metadata",
      before_value: null,
      after_value: { roleKey: after.roleKey, status: after.status },
    });
  }

  // 1. Perubahan Status
  if (!before || before.status !== after.status) {
    diffs.push({
      action: after.status === "active" ? "user.activated" : "user.suspended",
      resource: "status",
      before_value: before ? before.status : null,
      after_value: after.status,
    });
  }

  // 2. Perubahan Role
  if (!before || before.roleKey !== after.roleKey) {
    let action = "user.role_changed";
    if (!before?.roleKey && after.roleKey) action = "user.role_assigned";
    else if (before?.roleKey && !after.roleKey) action = "user.role_removed";

    diffs.push({
      action,
      resource: "role",
      before_value: before?.roleKey ?? null,
      after_value: after.roleKey,
    });
  }

  // 3. Perubahan Scope
  const normBeforeScope = normalizeScopeForDiff(before?.scope);
  const normAfterScope = normalizeScopeForDiff(after.scope);
  if (JSON.stringify(normBeforeScope) !== JSON.stringify(normAfterScope)) {
    diffs.push({
      action: "user.scope_changed",
      resource: "scope",
      before_value: normBeforeScope,
      after_value: normAfterScope,
    });
  }

  // 4. Perubahan Overrides
  const beforeMap = new Map<string, "grant" | "revoke">(
    (before?.overrides || []).map((o) => [o.permission, o.effect]),
  );
  const afterMap = new Map<string, "grant" | "revoke">(
    (after.overrides || []).map((o) => [o.permission, o.effect]),
  );

  for (const [perm, effect] of afterMap.entries()) {
    const prev = beforeMap.get(perm);
    if (!prev || prev !== effect) {
      diffs.push({
        action:
          effect === "grant"
            ? "user.permission_granted"
            : "user.permission_revoked",
        resource: perm,
        before_value: prev ?? null,
        after_value: effect,
      });
    }
  }

  for (const [perm, prev] of beforeMap.entries()) {
    if (!afterMap.has(perm)) {
      diffs.push({
        action: "user.override_cleared",
        resource: perm,
        before_value: prev,
        after_value: null,
      });
    }
  }

  return diffs;
}

export interface RoleSnapshot {
  name: string;
  description: string | null;
  fleetRole: string;
  defaultScopeAll: boolean;
  isActive: boolean;
  permissions: string[];
}

export interface DesiredRole {
  name: string;
  description?: string | null;
  fleetRole: string;
  defaultScopeAll: boolean;
  isActive?: boolean;
  permissions: string[];
}

export function diffRole(
  before: RoleSnapshot | null,
  after: DesiredRole,
): AuditRowDraft[] {
  const diffs: AuditRowDraft[] = [];

  if (!before) {
    diffs.push({
      action: "role.created",
      resource: "metadata",
      before_value: null,
      after_value: {
        name: after.name,
        fleetRole: after.fleetRole,
        permissionsCount: after.permissions.length,
      },
    });
    return diffs;
  }

  // Metadata update
  if (
    before.name !== after.name ||
    (before.description ?? null) !== (after.description ?? null) ||
    before.fleetRole !== after.fleetRole ||
    before.defaultScopeAll !== after.defaultScopeAll
  ) {
    diffs.push({
      action: "role.updated",
      resource: "metadata",
      before_value: {
        name: before.name,
        description: before.description,
        fleetRole: before.fleetRole,
        defaultScopeAll: before.defaultScopeAll,
      },
      after_value: {
        name: after.name,
        description: after.description ?? null,
        fleetRole: after.fleetRole,
        defaultScopeAll: after.defaultScopeAll,
      },
    });
  }

  // Status active/inactive
  if (after.isActive !== undefined && before.isActive !== after.isActive) {
    diffs.push({
      action: after.isActive ? "role.activated" : "role.deactivated",
      resource: "status",
      before_value: before.isActive,
      after_value: after.isActive,
    });
  }

  // Permissions diff
  const beforePerms = new Set(before.permissions);
  const afterPerms = new Set(after.permissions);

  for (const p of afterPerms) {
    if (!beforePerms.has(p)) {
      diffs.push({
        action: "role.permission_granted",
        resource: p,
        before_value: null,
        after_value: true,
      });
    }
  }

  for (const p of beforePerms) {
    if (!afterPerms.has(p)) {
      diffs.push({
        action: "role.permission_revoked",
        resource: p,
        before_value: true,
        after_value: null,
      });
    }
  }

  return diffs;
}
