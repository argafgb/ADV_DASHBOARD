import "server-only";
import { sql } from "@/lib/db";
import { AccessUnavailableError } from "./errors";

export interface AccessProfileDbRow {
  nik: string;
  status: "active" | "suspended";
  scope_all: boolean;
  version: number;
  role_id: number | null;
  role_key: string | null;
  role_name: string | null;
  fleet_role: "management" | "internal" | null;
  role_active: boolean | null;
  role_permissions: string[];
  grants: string[];
  revokes: string[];
  departments: string[];
  branches: string[];
  regions: string[];
  branch_restricted: boolean;
}

/**
 * Mengambil profil akses pengguna lengkap dalam 1 query terindeks.
 * Null hanya untuk akun yang belum terdaftar. Kegagalan query tidak boleh
 * mengembalikan hak legacy dari token yang mungkin sudah dicabut.
 */
export async function getAccessProfileRaw(
  nik: string,
): Promise<AccessProfileDbRow | null> {
  try {
    const rows = await sql<AccessProfileDbRow[]>`
      SELECT
        u.nik,
        u.status,
        u.scope_all,
        u.version,
        r.id AS role_id,
        r.key AS role_key,
        r.name AS role_name,
        r.fleet_role,
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
          (SELECT array_agg(DISTINCT b) FROM (
             SELECT s.value AS b
             FROM helpdesk.access_user_scope s
             WHERE s.nik = u.nik AND s.dimension = 'branch'
             UNION
             SELECT rb.branch_name
             FROM helpdesk.access_user_scope s
             JOIN helpdesk.access_region rg ON rg.code = s.value AND rg.is_active
             JOIN helpdesk.access_region_branch rb ON rb.region_code = rg.code
             WHERE s.nik = u.nik AND s.dimension = 'region'
           ) x),
          '{}'
        ) AS branches,
        COALESCE(
          (SELECT array_agg(s.value)
           FROM helpdesk.access_user_scope s
           WHERE s.nik = u.nik AND s.dimension = 'region'),
          '{}'
        ) AS regions,
        EXISTS (
          SELECT 1
          FROM helpdesk.access_user_scope s
          WHERE s.nik = u.nik AND s.dimension IN ('branch', 'region')
        ) AS branch_restricted
      FROM helpdesk.access_user u
      LEFT JOIN helpdesk.access_role r ON r.id = u.role_id
      WHERE u.nik = ${nik}
      LIMIT 1;
    `;

    return rows[0] ?? null;
  } catch (err: unknown) {
    const pgErr = err as { code?: string; message?: string };
    console.warn(
      `[ACCESS_PROFILE_ERROR] Gagal memuat profil akses (${pgErr?.code || "connection error"}).`,
    );
    throw new AccessUnavailableError();
  }
}

/**
 * Memperbarui waktu login terakhir dan snapshot tampilan nama/divisi.
 * Dijalankan asinkron secara fire-and-forget.
 */
export async function touchLogin(
  nik: string,
  employeeName?: string | null,
  codeDivision?: string | null,
): Promise<void> {
  try {
    await sql`
      UPDATE helpdesk.access_user
      SET
        last_login_at = now(),
        employee_name = COALESCE(${employeeName ?? null}, employee_name),
        code_division = COALESCE(${codeDivision ?? null}, code_division)
      WHERE nik = ${nik};
    `;
  } catch (err) {
    console.warn(`[touchLogin] Gagal memperbarui login snapshot untuk NIK ${nik}:`, err);
  }
}
