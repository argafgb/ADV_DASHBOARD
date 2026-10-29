import "server-only";
import { sql } from "@/lib/db";
import { randomUUID } from "node:crypto";
import {
  AccessDeniedError,
  VersionConflictError,
} from "@/lib/access/errors";
import { diffRole, type RoleSnapshot } from "@/lib/access/access-diff";
import { insertAuditRows } from "./accessAuditService";
import { expandRoleDashboardMenus } from "@/lib/access/effective-access";
import { ALL_DASHBOARD_MENU_PERMISSIONS, PERMISSION_CATALOG } from "@/lib/access/catalog";
import type { CurrentActor } from "@/lib/access/guards";

function ensureOverviewPermissions(perms: Iterable<string>): string[] {
  const result = new Set<string>(perms);
  for (const group of PERMISSION_CATALOG) {
    if (group.permission && result.has(group.permission)) {
      const overview = group.menus.find((m) => m.key === "overview" || m.permission.endsWith(".overview.view"));
      if (overview) {
        result.add(overview.permission);
      }
    }
  }
  return Array.from(result);
}

export interface RoleDetail {
  id: number;
  key: string;
  name: string;
  description: string | null;
  fleetRole: "management" | "internal";
  defaultScopeAll: boolean;
  isSystem: boolean;
  isActive: boolean;
  version: number;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface CreateRoleInput {
  key: string;
  name: string;
  description?: string | null;
  fleetRole: "management" | "internal";
  defaultScopeAll: boolean;
  permissions: string[];
}

export interface UpdateRoleInput {
  expectedVersion: number;
  name: string;
  description?: string | null;
  fleetRole: "management" | "internal";
  defaultScopeAll: boolean;
  isActive: boolean;
  permissions: string[];
}

let rolesSchemaEnsured = false;

export async function ensureSystemRolesAndPermissionsRaw(): Promise<void> {
  if (rolesSchemaEnsured) return;
  try {
    await sql`
      INSERT INTO helpdesk.access_role (
        key, name, description, fleet_role, default_scope_all, is_system, is_active, updated_by
      ) VALUES (
        'staff', 'Staff', 'Staf operasional standar. Akses ke IT & DCT Helpdesk Dashboard.', 'management', false, true, true, 'system-seed'
      ) ON CONFLICT (key) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        fleet_role = EXCLUDED.fleet_role,
        default_scope_all = false,
        is_active = true,
        updated_at = now();
    `;

    // Pastikan default_scope_all untuk role staff bernilai false (bukan all sites)
    await sql`
      UPDATE helpdesk.access_role
      SET default_scope_all = false
      WHERE key = 'staff';
    `;

    // Pastikan seluruh menu dashboard ter-enable secara default untuk role
    for (const perm of ALL_DASHBOARD_MENU_PERMISSIONS) {
      await sql`
        INSERT INTO helpdesk.access_role_permission (role_id, permission_key)
        SELECT r.id, ${perm}
        FROM helpdesk.access_role r
        WHERE r.is_active = true
        ON CONFLICT (role_id, permission_key) DO NOTHING;
      `;
    }

    // Pastikan default_scope_all untuk role staff bernilai false
    await sql`
      UPDATE helpdesk.access_role
      SET default_scope_all = false, updated_at = now()
      WHERE key = 'staff' AND default_scope_all = true;
    `;

    rolesSchemaEnsured = true;
  } catch (err) {
    console.warn("[ENSURE_SYSTEM_ROLES_WARNING]", err);
  }
}

export async function listRolesWithCountsRaw(): Promise<RoleDetail[]> {
  try {
    await ensureSystemRolesAndPermissionsRaw();
    const rows = await sql<{
      id: number;
      key: string;
      name: string;
      description: string | null;
      fleet_role: "management" | "internal";
      default_scope_all: boolean;
      is_system: boolean;
      is_active: boolean;
      version: number;
      permissions: string[];
      user_count: number;
      created_at: Date;
      updated_at: Date;
      updated_by: string | null;
    }[]>`
      SELECT
        r.id,
        r.key,
        r.name,
        r.description,
        r.fleet_role,
        r.default_scope_all,
        r.is_system,
        r.is_active,
        r.version,
        COALESCE(
          (SELECT array_agg(rp.permission_key ORDER BY rp.permission_key)
           FROM helpdesk.access_role_permission rp
           WHERE rp.role_id = r.id),
          '{}'
        ) AS permissions,
        COUNT(u.nik) FILTER (WHERE u.status = 'active')::int AS user_count,
        r.created_at,
        r.updated_at,
        r.updated_by
      FROM helpdesk.access_role r
      LEFT JOIN helpdesk.access_user u ON u.role_id = r.id
      GROUP BY r.id
      ORDER BY r.id ASC;
    `;

    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      fleetRole: r.fleet_role,
      defaultScopeAll: r.default_scope_all,
      isSystem: r.is_system,
      isActive: r.is_active,
      version: r.version,
      permissions: Array.from(expandRoleDashboardMenus(r.permissions)),
      userCount: r.user_count,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      updatedBy: r.updated_by,
    }));
  } catch (err) {
    console.error("[ROLE_LIST_ERROR]", err);
    return [];
  }
}

export async function getRoleRaw(id: number): Promise<RoleDetail | null> {
  try {
    const rows = await sql<{
      id: number;
      key: string;
      name: string;
      description: string | null;
      fleet_role: "management" | "internal";
      default_scope_all: boolean;
      is_system: boolean;
      is_active: boolean;
      version: number;
      permissions: string[];
      user_count: number;
      created_at: Date;
      updated_at: Date;
      updated_by: string | null;
    }[]>`
      SELECT
        r.id,
        r.key,
        r.name,
        r.description,
        r.fleet_role,
        r.default_scope_all,
        r.is_system,
        r.is_active,
        r.version,
        COALESCE(
          (SELECT array_agg(rp.permission_key ORDER BY rp.permission_key)
           FROM helpdesk.access_role_permission rp
           WHERE rp.role_id = r.id),
          '{}'
        ) AS permissions,
        COUNT(u.nik) FILTER (WHERE u.status = 'active')::int AS user_count,
        r.created_at,
        r.updated_at,
        r.updated_by
      FROM helpdesk.access_role r
      LEFT JOIN helpdesk.access_user u ON u.role_id = r.id
      WHERE r.id = ${id}
      GROUP BY r.id;
    `;

    const r = rows[0];
    if (!r) return null;

    return {
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      fleetRole: r.fleet_role,
      defaultScopeAll: r.default_scope_all,
      isSystem: r.is_system,
      isActive: r.is_active,
      version: r.version,
      permissions: Array.from(expandRoleDashboardMenus(r.permissions)),
      userCount: r.user_count,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      updatedBy: r.updated_by,
    };
  } catch (err) {
    console.error(`[GET_ROLE_ERROR] id=${id}:`, err);
    return null;
  }
}

export async function createRole(
  actor: CurrentActor,
  input: CreateRoleInput,
): Promise<RoleDetail> {
  // Privilege escalation check
  for (const perm of input.permissions) {
    if (
      perm.startsWith("access.") &&
      !actor.permissions.has("access.roles.manage")
    ) {
      throw new AccessDeniedError(
        `Memberikan izin administratif ${perm} memerlukan hak access.roles.manage.`,
        "PRIVILEGE_ESCALATION",
        422,
      );
    }

    if (
      !actor.permissions.has("access.roles.manage") &&
      !actor.permissions.has(perm)
    ) {
      throw new AccessDeniedError(
        `Anda tidak dapat membuat role dengan izin yang tidak Anda miliki: ${perm}`,
        "PRIVILEGE_ESCALATION",
        422,
      );
    }
  }

  const requestId = randomUUID();

  const newRoleId = await sql.begin(async (tx) => {
    // Check duplicates
    const existing = await tx<{ id: number }[]>`
      SELECT id FROM helpdesk.access_role
      WHERE key = ${input.key} OR lower(name) = lower(${input.name})
      LIMIT 1;
    `;
    if (existing.length > 0) {
      throw new AccessDeniedError(
        "Key role atau nama role sudah digunakan.",
        "DUPLICATE",
        409,
      );
    }

    const inserted = await tx<{ id: number }[]>`
      INSERT INTO helpdesk.access_role (
        key,
        name,
        description,
        fleet_role,
        default_scope_all,
        is_system,
        is_active,
        version,
        updated_by
      ) VALUES (
        ${input.key},
        ${input.name},
        ${input.description ?? null},
        ${input.fleetRole},
        ${input.defaultScopeAll},
        false,
        true,
        1,
        ${actor.nik}
      )
      RETURNING id;
    `;

    const roleId = inserted[0].id;

    const permsToInsert = ensureOverviewPermissions(
      input.permissions.length > 0
        ? input.permissions
        : Array.from(ALL_DASHBOARD_MENU_PERMISSIONS),
    );

    for (const perm of permsToInsert) {
      await tx`
        INSERT INTO helpdesk.access_role_permission (role_id, permission_key)
        VALUES (${roleId}, ${perm});
      `;
    }

    const diffs = diffRole(null, {
      name: input.name,
      description: input.description,
      fleetRole: input.fleetRole,
      defaultScopeAll: input.defaultScopeAll,
      permissions: permsToInsert,
    });

    await insertAuditRows(tx, diffs, requestId, { nik: actor.nik }, {
      type: "role",
      roleId,
      label: input.name,
    });

    return roleId;
  });

  // Dibaca setelah commit: getRoleRaw memakai pool global, bukan koneksi
  // transaksi, sehingga di dalam sql.begin role baru belum terlihat.
  const created = await getRoleRaw(newRoleId);
  if (!created) {
    throw new Error("Gagal mengambil data role yang baru dibuat.");
  }
  return created;
}

export async function updateRole(
  actor: CurrentActor,
  id: number,
  input: UpdateRoleInput,
): Promise<RoleDetail> {
  const requestId = randomUUID();

  await sql.begin(async (tx) => {
    const rows = await tx<{
      id: number;
      key: string;
      name: string;
      description: string | null;
      fleet_role: "management" | "internal";
      default_scope_all: boolean;
      is_system: boolean;
      is_active: boolean;
      version: number;
      permissions: string[];
    }[]>`
      SELECT
        r.*,
        COALESCE(
          (SELECT array_agg(rp.permission_key)
           FROM helpdesk.access_role_permission rp
           WHERE rp.role_id = r.id),
          '{}'
        ) AS permissions
      FROM helpdesk.access_role r
      WHERE r.id = ${id}
      FOR UPDATE;
    `;

    const current = rows[0];
    if (!current) {
      throw new AccessDeniedError("Role tidak ditemukan.", "NOT_FOUND", 404);
    }

    if (current.version !== input.expectedVersion) {
      throw new VersionConflictError(
        "Role ini baru saja diperbarui oleh admin lain. Muat ulang halaman.",
      );
    }

    // Sistem role rules
    if (current.is_system) {
      if (input.fleetRole !== current.fleet_role) {
        throw new AccessDeniedError(
          "Fleet role pada role sistem bawaan tidak dapat diubah.",
          "IMMUTABLE_SYSTEM_ROLE",
          422,
        );
      }
      if (!input.isActive) {
        throw new AccessDeniedError(
          "Role sistem bawaan tidak dapat dinonaktifkan.",
          "IMMUTABLE_SYSTEM_ROLE",
          422,
        );
      }
    }

    // Role in use check when deactivating
    if (!input.isActive && current.is_active) {
      const activeUsers = await tx<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM helpdesk.access_user
        WHERE role_id = ${id} AND status = 'active';
      `;
      if ((activeUsers[0]?.count ?? 0) > 0) {
        throw new AccessDeniedError(
          `Role tidak dapat dinonaktifkan karena masih digunakan oleh ${activeUsers[0].count} pengguna aktif.`,
          "ROLE_IN_USE",
          422,
        );
      }
    }

    // Privilege escalation check
    for (const perm of input.permissions) {
      if (
        perm.startsWith("access.") &&
        !actor.permissions.has("access.roles.manage")
      ) {
        throw new AccessDeniedError(
          `Memberikan izin administratif ${perm} memerlukan hak access.roles.manage.`,
          "PRIVILEGE_ESCALATION",
          422,
        );
      }

      if (
        !current.permissions.includes(perm) &&
        !actor.permissions.has("access.roles.manage") &&
        !actor.permissions.has(perm)
      ) {
        throw new AccessDeniedError(
          `Anda tidak dapat menambahkan izin yang tidak Anda miliki: ${perm}`,
          "PRIVILEGE_ESCALATION",
          422,
        );
      }
    }

    await tx`
      UPDATE helpdesk.access_role
      SET
        name = ${input.name},
        description = ${input.description ?? null},
        fleet_role = ${input.fleetRole},
        default_scope_all = ${input.defaultScopeAll},
        is_active = ${input.isActive},
        version = version + 1,
        updated_at = now(),
        updated_by = ${actor.nik}
      WHERE id = ${id};
    `;

    // Sync permissions
    await tx`
      DELETE FROM helpdesk.access_role_permission
      WHERE role_id = ${id};
    `;

    const finalRolePerms = ensureOverviewPermissions(input.permissions);

    for (const perm of finalRolePerms) {
      await tx`
        INSERT INTO helpdesk.access_role_permission (role_id, permission_key)
        VALUES (${id}, ${perm});
      `;
    }

    const beforeSnapshot: RoleSnapshot = {
      name: current.name,
      description: current.description,
      fleetRole: current.fleet_role,
      defaultScopeAll: current.default_scope_all,
      isActive: current.is_active,
      permissions: current.permissions,
    };

    const diffs = diffRole(beforeSnapshot, {
      name: input.name,
      description: input.description,
      fleetRole: input.fleetRole,
      defaultScopeAll: input.defaultScopeAll,
      isActive: input.isActive,
      permissions: finalRolePerms,
    });

    await insertAuditRows(tx, diffs, requestId, { nik: actor.nik }, {
      type: "role",
      roleId: id,
      label: input.name,
    });
  });

  // Dibaca setelah commit supaya mengembalikan data terbaru (lihat createRole).
  const updated = await getRoleRaw(id);
  if (!updated) {
    throw new Error("Gagal memuat role setelah diperbarui.");
  }
  return updated;
}

export async function deleteRole(
  actor: CurrentActor,
  id: number,
): Promise<{ success: boolean; message: string }> {
  const requestId = randomUUID();

  await sql.begin(async (tx) => {
    const rows = await tx<{
      id: number;
      key: string;
      name: string;
      is_system: boolean;
    }[]>`
      SELECT id, key, name, is_system
      FROM helpdesk.access_role
      WHERE id = ${id}
      FOR UPDATE;
    `;

    const role = rows[0];
    if (!role) {
      throw new AccessDeniedError("Role tidak ditemukan.", "NOT_FOUND", 404);
    }

    if (role.is_system) {
      throw new AccessDeniedError(
        `Role "${role.name}" adalah role bawaan sistem dan tidak dapat dihapus.`,
        "IMMUTABLE_SYSTEM_ROLE",
        422,
      );
    }

    const assignedUsers = await tx<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM helpdesk.access_user
      WHERE role_id = ${id};
    `;

    const userCount = assignedUsers[0]?.count ?? 0;
    if (userCount > 0) {
      throw new AccessDeniedError(
        `Role "${role.name}" tidak dapat dihapus karena masih digunakan oleh ${userCount} pengguna. Pindahkan pengguna ke role lain terlebih dahulu.`,
        "ROLE_IN_USE",
        422,
      );
    }

    await tx`
      DELETE FROM helpdesk.access_role_permission
      WHERE role_id = ${id};
    `;

    await tx`
      DELETE FROM helpdesk.access_role
      WHERE id = ${id};
    `;

    await insertAuditRows(
      tx,
      [
        {
          action: "role.deleted",
          resource: "metadata",
          before_value: { id: role.id, key: role.key, name: role.name },
          after_value: null,
        },
      ],
      requestId,
      { nik: actor.nik },
      {
        type: "role",
        roleId: id,
        label: role.name,
      },
    );
  });

  return {
    success: true,
    message: "Role berhasil dihapus.",
  };
}

