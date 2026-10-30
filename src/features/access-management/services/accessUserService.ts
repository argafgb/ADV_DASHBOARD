import "server-only";
import { sql } from "@/lib/db";
import { randomUUID } from "node:crypto";
import {
  AccessDeniedError,
  VersionConflictError,
} from "@/lib/access/errors";
import {
  diffUserAccess,
  type UserAccessSnapshot,
  type DesiredUserAccess,
} from "@/lib/access/access-diff";
import { canEditUser, assertNotLastAdmin, type CurrentActor } from "@/lib/access/guards";
import { insertAuditRows } from "./accessAuditService";
import { resolveEffectiveAccess } from "@/lib/access/effective-access";
import { getEmployee } from "./employeeDirectoryService";
import { ensureSystemRolesAndPermissionsRaw } from "./accessRoleService";
import { normalizeScopeInput } from "@/lib/access/scope-input";
import { branchNameAliases } from "@/lib/access/branch-options";

export interface UserSummaryItem {
  nik: string;
  name: string;
  codeDivision: string | null;
  status: "active" | "suspended";
  role: {
    key: string;
    name: string;
  } | null;
  hasOverrides: boolean;
  scopeSummary: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface UserDetailData {
  enrolled: boolean;
  version: number;
  status: "active" | "suspended";
  roleKey: string | null;
  overrides: { permission: string; effect: "grant" | "revoke" }[];
  scope: {
    all: boolean;
    departments: string[];
    branches: string[];
    regions: string[];
  };
  effectivePermissions: string[];
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface ListUsersQuery {
  status?: "active" | "suspended";
  roleKey?: string;
  custom?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listAccessUsersRaw(
  query: ListUsersQuery = {},
): Promise<{
  items: UserSummaryItem[];
  total: number;
  counts: { all: number; custom: number; suspended: number };
}> {
  // Pastikan role sistem (termasuk staff) dan migrasi user selalu aktif
  await ensureSystemRolesAndPermissionsRaw();

  const page = Math.max(1, query.page || 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize || 50));
  const offset = (page - 1) * pageSize;

  // Filter: jika ada query.status spesifik gunakan itu; jika tidak, hanya ambil user yang berstatus 'active'
  const statusCondition = query.status
    ? sql`AND u.status = ${query.status}`
    : sql`AND u.status = 'active'`;

  const roleCondition = query.roleKey
    ? sql`AND r.key = ${query.roleKey}`
    : sql``;

  const customCondition =
    query.custom !== undefined
      ? query.custom
        ? sql`AND EXISTS (SELECT 1 FROM helpdesk.access_user_permission up WHERE up.nik = u.nik)`
        : sql`AND NOT EXISTS (SELECT 1 FROM helpdesk.access_user_permission up WHERE up.nik = u.nik)`
      : sql``;

  const qCondition = query.q?.trim()
    ? sql`AND (u.nik ILIKE ${"%" + query.q.trim() + "%"} OR u.employee_name ILIKE ${"%" + query.q.trim() + "%"})`
    : sql``;

  // Filter akun dengan tanda minus (-1, -2, dsb.) dan akun testing Adit agar tidak dimuat di daftar pengguna
  const hyphenCondition = sql`AND u.nik NOT LIKE '%-%'`;
  const excludedAccountsCondition = sql`AND u.nik NOT IN ('WSSTR250301', 'WSSTR260806', '8211185690')`;

  try {
    const [rows, countRow, segmentCounts] = await Promise.all([
      sql<{
        nik: string;
        employee_name: string | null;
        code_division: string | null;
        status: "active" | "suspended";
        role_key: string | null;
        role_name: string | null;
        scope_all: boolean;
        has_overrides: boolean;
        departments: string[];
        branches: string[];
        regions: string[];
        updated_at: Date;
        updated_by: string | null;
      }[]>`
        SELECT
          u.nik,
          COALESCE(u.employee_name, u.nik) AS employee_name,
          u.code_division,
          u.status,
          r.key AS role_key,
          r.name AS role_name,
          u.scope_all,
          EXISTS (SELECT 1 FROM helpdesk.access_user_permission up WHERE up.nik = u.nik) AS has_overrides,
          COALESCE((SELECT array_agg(s.value) FROM helpdesk.access_user_scope s WHERE s.nik = u.nik AND s.dimension = 'department'), '{}') AS departments,
          COALESCE((SELECT array_agg(s.value) FROM helpdesk.access_user_scope s WHERE s.nik = u.nik AND s.dimension = 'branch'), '{}') AS branches,
          COALESCE((SELECT array_agg(s.value) FROM helpdesk.access_user_scope s WHERE s.nik = u.nik AND s.dimension = 'region'), '{}') AS regions,
          u.updated_at,
          u.updated_by
        FROM helpdesk.access_user u
        LEFT JOIN helpdesk.access_role r ON r.id = u.role_id
        WHERE TRUE
          ${statusCondition}
          ${roleCondition}
          ${customCondition}
          ${qCondition}
          ${hyphenCondition}
          ${excludedAccountsCondition}
        ORDER BY u.updated_at DESC, u.nik ASC
        LIMIT ${pageSize} OFFSET ${offset};
      `,
      sql<{ total: number }[]>`
        SELECT COUNT(*)::int AS total
        FROM helpdesk.access_user u
        LEFT JOIN helpdesk.access_role r ON r.id = u.role_id
        WHERE TRUE
          ${statusCondition}
          ${roleCondition}
          ${customCondition}
          ${qCondition}
          ${hyphenCondition}
          ${excludedAccountsCondition};
      `,
      sql<{
        all_count: number;
        custom_count: number;
        suspended_count: number;
      }[]>`
        SELECT
          COUNT(*) FILTER (WHERE u.status = 'active' AND u.nik NOT LIKE '%-%' AND u.nik NOT IN ('WSSTR250301', 'WSSTR260806', '8211185690'))::int AS all_count,
          COUNT(*) FILTER (
            WHERE u.status = 'active'
              AND u.nik NOT LIKE '%-%'
              AND u.nik NOT IN ('WSSTR250301', 'WSSTR260806', '8211185690')
              AND EXISTS (SELECT 1 FROM helpdesk.access_user_permission up WHERE up.nik = u.nik)
          )::int AS custom_count,
          COUNT(*) FILTER (WHERE u.status = 'suspended' AND u.nik NOT LIKE '%-%' AND u.nik NOT IN ('WSSTR250301', 'WSSTR260806', '8211185690'))::int AS suspended_count
        FROM helpdesk.access_user u
        LEFT JOIN helpdesk.access_role r ON r.id = u.role_id;
      `,
    ]);

    const items: UserSummaryItem[] = rows.map((r) => {
      let scopeSummary = "Semua data";
      if (!r.scope_all) {
        const parts: string[] = [];
        if (r.departments.length > 0) {
          parts.push(`Dept: ${r.departments.join(", ")}`);
        }
        if (r.regions.length > 0) {
          parts.push(`Region: ${r.regions.join(", ")}`);
        }
        if (r.branches.length > 0) {
          parts.push(
            r.branches.length > 2
              ? `${r.branches.slice(0, 2).join(", ")} +${r.branches.length - 2}`
              : `Cabang: ${r.branches.join(", ")}`,
          );
        }
        scopeSummary = parts.length > 0 ? parts.join(" | ") : "Sesuai Cabang (Site)";
      }

      return {
        nik: r.nik,
        name: r.employee_name ?? r.nik,
        codeDivision: r.code_division,
        status: r.status,
        role: r.role_key && r.role_name
          ? { key: r.role_key, name: r.role_name }
          : { key: "staff", name: "Staff" },
        hasOverrides: r.has_overrides,
        scopeSummary,
        updatedAt: r.updated_at.toISOString(),
        updatedBy: r.updated_by,
      };
    });

    const counts = {
      all: segmentCounts[0]?.all_count ?? 0,
      custom: segmentCounts[0]?.custom_count ?? 0,
      suspended: segmentCounts[0]?.suspended_count ?? 0,
    };

    return {
      items,
      total: countRow[0]?.total ?? 0,
      counts,
    };
  } catch (err) {
    console.error("[LIST_ACCESS_USERS_ERROR]", err);
    return {
      items: [],
      total: 0,
      counts: { all: 0, custom: 0, suspended: 0 },
    };
  }
}

export async function getAccessUserDetailRaw(
  nik: string,
): Promise<UserDetailData | null> {
  if (nik.includes("-")) return null;
  try {
    const rows = await sql<{
      nik: string;
      status: "active" | "suspended";
      scope_all: boolean;
      version: number;
      role_key: string | null;
      role_active: boolean | null;
      role_permissions: string[];
      grants: string[];
      revokes: string[];
      departments: string[];
      branches: string[];
      regions: string[];
      updated_at: Date;
      updated_by: string | null;
    }[]>`
      SELECT
        u.nik,
        u.status,
        u.scope_all,
        u.version,
        r.key AS role_key,
        r.is_active AS role_active,
        COALESCE(
          (SELECT array_agg(rp.permission_key)
           FROM helpdesk.access_role_permission rp
           WHERE rp.role_id = r.id),
          '{}'
        ) AS role_permissions,
        COALESCE(
          (SELECT array_agg(up.permission_key)
           FROM helpdesk.access_user_permission up
           WHERE up.nik = u.nik AND up.effect = 'grant'),
          '{}'
        ) AS grants,
        COALESCE(
          (SELECT array_agg(up.permission_key)
           FROM helpdesk.access_user_permission up
           WHERE up.nik = u.nik AND up.effect = 'revoke'),
          '{}'
        ) AS revokes,
        COALESCE(
          (SELECT array_agg(s.value)
           FROM helpdesk.access_user_scope s
           WHERE s.nik = u.nik AND s.dimension = 'department'),
          '{}'
        ) AS departments,
        COALESCE(
          (SELECT array_agg(s.value)
           FROM helpdesk.access_user_scope s
           WHERE s.nik = u.nik AND s.dimension = 'branch'),
          '{}'
        ) AS branches,
        COALESCE(
          (SELECT array_agg(s.value)
           FROM helpdesk.access_user_scope s
           WHERE s.nik = u.nik AND s.dimension = 'region'),
          '{}'
        ) AS regions,
        u.updated_at,
        u.updated_by
      FROM helpdesk.access_user u
      LEFT JOIN helpdesk.access_role r ON r.id = u.role_id
      WHERE u.nik = ${nik};
    `;

    const r = rows[0];
    if (!r) return null;

    const overrides: { permission: string; effect: "grant" | "revoke" }[] = [
      ...r.grants.map((p) => ({ permission: p, effect: "grant" as const })),
      ...r.revokes.map((p) => ({ permission: p, effect: "revoke" as const })),
    ];

    const effectivePerms = resolveEffectiveAccess({
      status: r.status,
      role: r.role_key
        ? { key: r.role_key, isActive: r.role_active ?? false, permissions: r.role_permissions }
        : null,
      overrides: overrides.map((o) => ({
        permissionKey: o.permission,
        effect: o.effect,
      })),
    });

    return {
      enrolled: true,
      version: r.version,
      status: r.status,
      roleKey: r.role_key,
      overrides,
      scope: {
        all: r.scope_all,
        departments: r.departments,
        branches: r.branches,
        regions: r.regions,
      },
      effectivePermissions: Array.from(effectivePerms),
      updatedAt: r.updated_at.toISOString(),
      updatedBy: r.updated_by,
    };
  } catch (err) {
    console.error(`[GET_USER_DETAIL_ERROR] nik=${nik}:`, err);
    return null;
  }
}

export async function getAccessStatusByNiksRaw(
  niks: string[],
): Promise<Map<string, { enrolled: boolean; status?: string; roleKey?: string; roleName?: string; hasOverrides?: boolean }>> {
  const map = new Map<string, { enrolled: boolean; status?: string; roleKey?: string; roleName?: string; hasOverrides?: boolean }>();
  if (niks.length === 0) return map;

  try {
    const rows = await sql<{
      nik: string;
      status: string;
      role_key: string | null;
      role_name: string | null;
      has_overrides: boolean;
    }[]>`
      SELECT
        u.nik,
        u.status,
        r.key AS role_key,
        r.name AS role_name,
        EXISTS (SELECT 1 FROM helpdesk.access_user_permission up WHERE up.nik = u.nik) AS has_overrides
      FROM helpdesk.access_user u
      LEFT JOIN helpdesk.access_role r ON r.id = u.role_id
      WHERE u.nik IN ${sql(niks)};
    `;

    for (const r of rows) {
      map.set(r.nik, {
        enrolled: true,
        status: r.status,
        roleKey: r.role_key ?? undefined,
        roleName: r.role_name ?? undefined,
        hasOverrides: r.has_overrides,
      });
    }
  } catch (err) {
    console.error("[GET_ACCESS_STATUS_BY_NIKS_ERROR]", err);
  }

  return map;
}

export async function saveUserAccess(
  actor: CurrentActor,
  nik: string,
  desired: DesiredUserAccess,
  expectedVersion?: number | null,
): Promise<{ access: UserDetailData; auditIds: number[] }> {
  // Check employee in HR or local
  const emp = await getEmployee(nik);
  const targetKey = desired.roleKey || "staff";
  const employeeRegions = targetKey === "regional-head" && emp?.branch
    ? await sql<{ code: string }[]>`
        SELECT r.code FROM helpdesk.access_region r
        JOIN helpdesk.access_region_branch b ON b.region_code = r.code
        WHERE r.is_active AND UPPER(TRIM(b.branch_name)) IN ${sql(branchNameAliases(emp.branch))};
      `
    : [];
  desired = {
    ...desired,
    roleKey: targetKey,
    scope: normalizeScopeInput(desired.scope, targetKey, emp?.branch, employeeRegions.map((r) => r.code)),
  };

  // Business guard checks
  const guard = canEditUser(actor, nik, desired, {
    isEmployeeActive: emp?.is_active,
  });
  if (!guard.ok) {
    throw new AccessDeniedError(guard.message, guard.code, 422);
  }

  const requestId = randomUUID();

  const auditIds = await sql.begin(async (tx) => {
    const existing = await tx<{
      nik: string;
      employee_name: string | null;
      status: "active" | "suspended";
      scope_all: boolean;
      version: number;
      role_id: number | null;
      role_key: string | null;
      role_name: string | null;
      grants: string[];
      revokes: string[];
      departments: string[];
      branches: string[];
      regions: string[];
    }[]>`
      SELECT
        u.nik,
        u.employee_name,
        u.status,
        u.scope_all,
        u.version,
        u.role_id,
        r.key AS role_key,
        r.name AS role_name,
        COALESCE((SELECT array_agg(up.permission_key) FROM helpdesk.access_user_permission up WHERE up.nik = u.nik AND up.effect='grant'), '{}') AS grants,
        COALESCE((SELECT array_agg(up.permission_key) FROM helpdesk.access_user_permission up WHERE up.nik = u.nik AND up.effect='revoke'), '{}') AS revokes,
        COALESCE((SELECT array_agg(s.value) FROM helpdesk.access_user_scope s WHERE s.nik = u.nik AND s.dimension='department'), '{}') AS departments,
        COALESCE((SELECT array_agg(s.value) FROM helpdesk.access_user_scope s WHERE s.nik = u.nik AND s.dimension='branch'), '{}') AS branches,
        COALESCE((SELECT array_agg(s.value) FROM helpdesk.access_user_scope s WHERE s.nik = u.nik AND s.dimension='region'), '{}') AS regions
      FROM helpdesk.access_user u
      LEFT JOIN helpdesk.access_role r ON r.id = u.role_id
      WHERE u.nik = ${nik}
      FOR UPDATE OF u;
    `;

    const current = existing[0] ?? null;

    if (current && expectedVersion !== undefined && expectedVersion !== null) {
      if (current.version !== expectedVersion) {
        throw new VersionConflictError();
      }
    }

    // Last admin protection:
    // IT Product manages access; IT Admin is an operational role.
    const isCurrentlyAdmin = current?.role_key === "it-product" && current?.status === "active";
    const willBeAdmin = desired.roleKey === "it-product" && desired.status === "active";
    if (isCurrentlyAdmin && !willBeAdmin) {
      const remainingAdmins = await tx<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM helpdesk.access_user u
        JOIN helpdesk.access_role r ON r.id = u.role_id
        WHERE r.key = 'it-product' AND r.is_active AND u.status = 'active' AND u.nik <> ${nik};
      `;
      assertNotLastAdmin(remainingAdmins[0]?.count ?? 0);
    }

    let roleId: number | null = null;
    const targetRoleKey = desired.roleKey || "staff";
    if (targetRoleKey) {
      const roleRow = await tx<{ id: number; permissions: string[] }[]>`
        SELECT r.id, COALESCE(array_agg(p.permission_key) FILTER (WHERE p.permission_key IS NOT NULL), '{}') AS permissions
        FROM helpdesk.access_role r
        LEFT JOIN helpdesk.access_role_permission p ON p.role_id = r.id
        WHERE r.key = ${targetRoleKey} AND r.is_active = true
        GROUP BY r.id LIMIT 1;
      `;
      if (roleRow.length === 0) {
        throw new AccessDeniedError(`Role "${targetRoleKey}" tidak ditemukan atau tidak aktif.`, "INVALID_ROLE", 400);
      }
      roleId = roleRow[0].id;
      if (!actor.permissions.has("access.roles.manage") &&
        roleRow[0].permissions.some((permission) => !actor.permissions.has(permission))) {
        throw new AccessDeniedError("Anda tidak dapat menetapkan role dengan izin yang tidak Anda miliki.", "PRIVILEGE_ESCALATION", 422);
      }
    }

    const effectiveScopeAll = desired.scope.all;
    for (const region of desired.scope.regions ?? []) {
      const valid = await tx<{ code: string }[]>`
        SELECT r.code FROM helpdesk.access_region r
        WHERE r.code = ${region} AND r.is_active
        AND EXISTS (SELECT 1 FROM helpdesk.access_region_branch b WHERE b.region_code = r.code);
      `;
      if (valid.length === 0) throw new AccessDeniedError(`Region ${region} tidak aktif atau belum memiliki site.`, "INVALID_REGION", 422);
    }

    // Upsert access_user
    await tx`
      INSERT INTO helpdesk.access_user (
        nik,
        role_id,
        status,
        scope_all,
        employee_name,
        code_division,
        version,
        created_by,
        updated_by
      ) VALUES (
        ${nik},
        ${roleId},
        ${desired.status},
        ${effectiveScopeAll},
        ${emp?.name ?? null},
        ${emp?.code_division ?? null},
        1,
        ${actor.nik},
        ${actor.nik}
      )
      ON CONFLICT (nik) DO UPDATE SET
        role_id = EXCLUDED.role_id,
        status = EXCLUDED.status,
        scope_all = EXCLUDED.scope_all,
        employee_name = COALESCE(EXCLUDED.employee_name, helpdesk.access_user.employee_name),
        code_division = COALESCE(EXCLUDED.code_division, helpdesk.access_user.code_division),
        version = helpdesk.access_user.version + 1,
        updated_at = now(),
        updated_by = ${actor.nik};
    `;

    // Overrides (overview wajib aktif, revoke pada overview diabaikan)
    await tx`
      DELETE FROM helpdesk.access_user_permission WHERE nik = ${nik};
    `;
    const sanitizedOverrides = desired.overrides.filter((ov) => {
      if (ov.effect === "revoke" && (ov.permission.endsWith(".overview.view") || ov.permission.endsWith(".overview"))) {
        return false;
      }
      return true;
    });
    for (const ov of sanitizedOverrides) {
      await tx`
        INSERT INTO helpdesk.access_user_permission (nik, permission_key, effect)
        VALUES (${nik}, ${ov.permission}, ${ov.effect});
      `;
    }

    // Scopes
    await tx`
      DELETE FROM helpdesk.access_user_scope WHERE nik = ${nik};
    `;
    for (const d of desired.scope.departments ?? []) {
      await tx`
        INSERT INTO helpdesk.access_user_scope (nik, dimension, value)
        VALUES (${nik}, 'department', ${d})
        ON CONFLICT (nik, dimension, value) DO NOTHING;
      `;
    }
    if (!desired.scope.all) {
      for (const b of desired.scope.branches ?? []) {
        const cleanB = b.trim().toUpperCase();
        if (cleanB) {
          await tx`
            INSERT INTO helpdesk.access_user_scope (nik, dimension, value)
            VALUES (${nik}, 'branch', ${cleanB})
            ON CONFLICT (nik, dimension, value) DO NOTHING;
          `;
        }
      }
      for (const r of desired.scope.regions ?? []) {
        const cleanR = r.trim().toUpperCase();
        if (cleanR) {
          await tx`
            INSERT INTO helpdesk.access_user_scope (nik, dimension, value)
            VALUES (${nik}, 'region', ${cleanR})
            ON CONFLICT (nik, dimension, value) DO NOTHING;
          `;
        }
      }
    }

    const beforeSnapshot: UserAccessSnapshot | null = current
      ? {
          status: current.status,
          roleKey: current.role_key,
          overrides: [
            ...current.grants.map((p) => ({ permission: p, effect: "grant" as const })),
            ...current.revokes.map((p) => ({ permission: p, effect: "revoke" as const })),
          ],
          scope: {
            all: current.scope_all,
            departments: current.departments,
            branches: current.branches,
            regions: current.regions,
          },
        }
      : null;

    const diffs = diffUserAccess(beforeSnapshot, desired);
    return insertAuditRows(tx, diffs, requestId, { nik: actor.nik }, {
      type: "user",
      nik,
      label: emp?.name ?? current?.employee_name ?? nik,
    });
  });

  // Dibaca SETELAH transaksi commit. getAccessUserDetailRaw memakai pool
  // global (koneksi lain), sehingga bila dipanggil di dalam sql.begin ia tidak
  // melihat baris yang belum di-commit: user baru terbaca null, lalu error
  // dilempar dan seluruh transaksi di-rollback (HTTP 500).
  //
  // Data sudah ter-commit di titik ini. Bila pembacaan ulang gagal, jangan
  // membalas 500 (admin akan mengira penyimpanan gagal padahal sukses);
  // kembalikan state yang diminta, klien memuat ulang detail sesudahnya.
  const updated = await getAccessUserDetailRaw(nik);
  if (!updated) {
    console.warn(`[SAVE_USER_ACCESS] nik=${nik} tersimpan, tetapi detail gagal dibaca ulang.`);
    return {
      access: {
        enrolled: true,
        version: (expectedVersion ?? 0) + 1,
        status: desired.status,
        roleKey: desired.roleKey,
        overrides: desired.overrides,
        scope: {
          all: desired.scope.all,
          departments: desired.scope.departments ?? [],
          branches: desired.scope.branches ?? [],
          regions: desired.scope.regions ?? [],
        },
        effectivePermissions: [],
        updatedAt: new Date().toISOString(),
        updatedBy: actor.nik,
      },
      auditIds,
    };
  }

  return { access: updated, auditIds };
}
