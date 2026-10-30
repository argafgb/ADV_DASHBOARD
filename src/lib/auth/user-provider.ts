import "server-only";

import bcrypt from "bcryptjs";
import { sql as pg } from "@/lib/db";
import { getMssqlPool, isMssqlConfigured, mssql } from "@/lib/db-mssql";
import type { AuthRole, AuthUser } from "@/lib/auth/jwt";
import type { DataScope } from "@/lib/auth/data-scope";

const DEFAULT_ROLE: AuthRole = "management";
const IDENTIFIER_PATTERN = /^[A-Za-z0-9@.+_%\-]{1,128}$/;

function normalizePhoneIdentifier(identifier: string): string {
  const compact = identifier.replace(/[\s()+-]/g, "");
  return /^08\d{8,11}$/.test(compact) ? `62${compact.slice(1)}` : identifier;
}

type MssqlEmployeeRow = {
  nik: string;
  name: string | null;
  code_division: string | null;
  code_department: string | null;
  email: string | null;
};

type DivisionAccessRow = {
  role: AuthRole;
  allowed_menus: string[] | null;
};

export type AuthFailureReason =
  | "invalid_credentials"
  | "backend_unavailable"
  | "not_configured"
  | "access_denied";

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: AuthFailureReason };

async function resolveDivisionAccess(codeDivision: string | null): Promise<{
  role: AuthRole;
}> {
  const division = codeDivision?.trim();
  if (!division) return { role: DEFAULT_ROLE };

  try {
    const rows = await pg<DivisionAccessRow[]>`
      SELECT role, allowed_menus
      FROM helpdesk.division_access
      WHERE code_division = ${division}
        AND is_active = true
      LIMIT 1;
    `;

    const row = rows[0];
    if (!row) return { role: DEFAULT_ROLE };

    return {
      role: row.role === "internal" ? "internal" : "management",
    };
  } catch (err) {
    console.error(
      "[AUTH_DIVISION_ACCESS_ERROR]",
      err instanceof Error ? err.message : "unknown error",
    );
    return { role: DEFAULT_ROLE };
  }
}

async function resolveUserAccessProfile(nik: string): Promise<{
  dataScope: DataScope;
  status: string;
}> {
  try {
    const rows = await pg`
      SELECT status, scope_all
      FROM helpdesk.access_user
      WHERE nik = ${nik}
      LIMIT 1;
    `;
    const row = rows[0];
    if (row) {
      return {
        status: row.status,
        dataScope: row.scope_all ? { all: true } : { all: true }, // Default scope
      };
    }
  } catch (err) {
    console.error("[AUTH_ACCESS_PROFILE_ERROR]", err);
  }

  return {
    status: "active",
    dataScope: { all: true },
  };
}

async function authenticateLocal(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  try {
    const rows = await pg`
      SELECT id, nik, username, name, password_hash, role, is_active
      FROM helpdesk.users
      WHERE nik = ${identifier} OR username = ${identifier}
      LIMIT 1;
    `;

    const row = rows[0];
    if (!row || !row.is_active) {
      return { ok: false, reason: "invalid_credentials" };
    }

    const matches = await bcrypt.compare(password, row.password_hash);
    if (!matches) {
      return { ok: false, reason: "invalid_credentials" };
    }

    const nik = String(row.nik).trim();
    return {
      ok: true,
      user: {
        id: nik,
        nik,
        username: row.username || nik,
        name: row.name || nik,
        role: row.role === "internal" ? "internal" : "management",
        dataScope: { all: true },
      },
    };
  } catch (err) {
    console.error(
      "[AUTH_LOCAL_FALLBACK_ERROR]",
      err instanceof Error ? err.message : "unknown error",
    );
    return { ok: false, reason: "backend_unavailable" };
  }
}

async function authenticateDct(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  if (!isMssqlConfigured()) return { ok: false, reason: "not_configured" };

  if (!IDENTIFIER_PATTERN.test(identifier)) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const normalizedPhone = normalizePhoneIdentifier(identifier);
  let row: MssqlEmployeeRow | undefined;

  try {
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .input("Identifier", mssql.NVarChar(128), identifier)
      .input("NormalizedPhone", mssql.NVarChar(128), normalizedPhone)
      .input("Password", mssql.NVarChar(256), password)
      .query<MssqlEmployeeRow>(`
        SELECT TOP (1)
          u.NIK            AS nik,
          h.Name           AS name,
          h.CodeDivision   AS code_division,
          h.CodeDepartment AS code_department,
          u.Email          AS email
        FROM UM_DB.dbo.UM_Employee u WITH (NOLOCK)
        INNER JOIN DA.dbo.HRD_Employee h WITH (NOLOCK)
          ON h.EmployeeCode = u.NIK
        WHERE (
            u.NIK = @Identifier
            OR LOWER(LTRIM(RTRIM(ISNULL(u.Email, '')))) = LOWER(LTRIM(RTRIM(@Identifier)))
            OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                 LTRIM(RTRIM(ISNULL(CONVERT(varchar(128), u.No_Hp), ''))),
                 '+', ''), ' ', ''), '-', ''), '(', ''), ')', '') = @NormalizedPhone
          )
          AND h.IsAktif = 'Y'
          AND ISNULL(u.IsLocked, 0) = 0
          AND (
            (
              u.PasswordHash IS NOT NULL
              AND u.PasswordHash COLLATE SQL_Latin1_General_CP1_CS_AS = LOWER(
                CONVERT(
                  VARCHAR(50),
                  HASHBYTES(
                    'SHA2_512',
                    LOWER(
                      CONVERT(
                        VARCHAR(50),
                        HASHBYTES(
                          'SHA2_512',
                          CONVERT(VARCHAR(50), @Password) + CONVERT(VARCHAR(50), u.NIK)
                        ),
                        2
                      )
                    ) + CONVERT(VARCHAR(50), u.NIK)
                  ),
                  2
                )
              ) COLLATE SQL_Latin1_General_CP1_CS_AS
            )
            OR (
              u.Password IS NOT NULL
              AND CONVERT(
                VARCHAR(100),
                DecryptByPassPhrase(
                  'ADV' + ISNULL(LEFT(u.ID_Employee, 4), '0') + '8',
                  TRY_CONVERT(VARBINARY(MAX), u.Password, 1)
                )
              ) = @Password COLLATE Latin1_General_BIN2
            )
          )
        ORDER BY CASE WHEN u.NIK = @Identifier THEN 0 ELSE 1 END, u.NIK DESC;
      `);

    row = result.recordset?.[0];
  } catch (err) {
    console.error(
      "[AUTH_DCT_MSSQL_ERROR]",
      err instanceof Error ? err.message : "unknown error",
    );
    return { ok: false, reason: "backend_unavailable" };
  }

  if (!row) return { ok: false, reason: "invalid_credentials" };

  const nik = row.nik.trim();
  const codeDivision = row.code_division?.trim();

  const [divisionAccess, profile] = await Promise.all([
    resolveDivisionAccess(codeDivision ?? null),
    resolveUserAccessProfile(nik),
  ]);

  if (profile.status !== "active") {
    return { ok: false, reason: "access_denied" };
  }

  return {
    ok: true,
    user: {
      id: nik,
      nik,
      username: nik,
      name: row.name?.trim() || nik,
      role: divisionAccess.role,
      codeDivision: codeDivision || undefined,
      dataScope: profile.dataScope,
    },
  };
}

export async function authenticateUser(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  const dctResult = await authenticateDct(identifier, password);
  if (dctResult.ok) return dctResult;

  if (dctResult.reason === "access_denied") {
    return dctResult;
  }

  const localResult = await authenticateLocal(identifier, password);
  if (localResult.ok) return localResult;

  if (dctResult.reason === "backend_unavailable" && !localResult.ok) {
    return { ok: false, reason: "backend_unavailable" };
  }

  return { ok: false, reason: "invalid_credentials" };
}
