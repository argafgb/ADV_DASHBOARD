import "server-only";
import { getMssqlPool, isMssqlConfigured, mssql } from "@/lib/db-mssql";
import { AccessUnavailableError } from "@/lib/access/errors";

export interface EmployeeDirectoryItem {
  nik: string;
  name: string;
  code_division: string | null;
  code_department: string | null;
  branch?: string | null;
  is_active: boolean;
}

export async function searchEmployees(
  query: string,
  top: number = 20,
): Promise<EmployeeDirectoryItem[]> {
  if (!isMssqlConfigured()) {
    throw new AccessUnavailableError(
      "Direktori karyawan (ADV) sedang tidak tersedia (koneksi MSSQL belum dikonfigurasi).",
    );
  }

  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  const safeTop = Math.max(1, Math.min(top, 50));
  const escapedQuery = cleanQuery
    .replace(/\[/g, "[[]")
    .replace(/%/g, "[%]")
    .replace(/_/g, "[_]");

  try {
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .input("ExactQuery", mssql.NVarChar(100), cleanQuery)
      .input("PrefixPattern", mssql.NVarChar(210), `${escapedQuery}%`)
      .input("ContainsPattern", mssql.NVarChar(210), `%${escapedQuery}%`)
      .input("Top", mssql.Int, safeTop)
      .query<EmployeeDirectoryItem>(`
        SELECT TOP (@Top)
          u.NIK AS nik,
          h.Name AS name,
          h.CodeDivision AS code_division,
          h.CodeDepartment AS code_department,
          u.Branch AS branch,
          CAST(CASE WHEN h.IsAktif = 'Y' AND ISNULL(u.IsLocked, 0) = 0 THEN 1 ELSE 0 END AS bit) AS is_active
        FROM UM_DB.dbo.UM_Employee u WITH (NOLOCK)
        INNER JOIN DA.dbo.HRD_Employee h WITH (NOLOCK)
          ON h.EmployeeCode = u.NIK
        WHERE (u.NIK LIKE @PrefixPattern OR h.Name LIKE @ContainsPattern)
          AND h.IsAktif = 'Y'
          AND ISNULL(u.IsLocked, 0) = 0
        ORDER BY
          CASE WHEN u.NIK = @ExactQuery THEN 0 ELSE 1 END,
          h.Name;
      `);

    const items = result.recordset ?? [];
    return items.filter(
      (emp) =>
        emp.is_active &&
        !emp.nik.includes("-") &&
        emp.nik !== "WSSTR250301" &&
        emp.nik !== "WSSTR260806" &&
        emp.nik !== "8211185690",
    );
  } catch (err) {
    console.error("[MSSQL_SEARCH_EMPLOYEES_ERROR]", err);
    throw new AccessUnavailableError(
      "Direktori karyawan (ADV) sedang tidak dapat diakses.",
    );
  }
}

export async function getEmployee(
  nik: string,
): Promise<EmployeeDirectoryItem | null> {
  if (!isMssqlConfigured()) {
    return null;
  }

  const cleanNik = nik.trim();
  if (
    !cleanNik ||
    cleanNik.includes("-") ||
    cleanNik === "WSSTR250301" ||
    cleanNik === "WSSTR260806" ||
    cleanNik === "8211185690"
  ) {
    return null;
  }

  try {
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .input("NIK", mssql.NVarChar(128), cleanNik)
      .query<EmployeeDirectoryItem>(`
        SELECT TOP (1)
          u.NIK AS nik,
          h.Name AS name,
          h.CodeDivision AS code_division,
          h.CodeDepartment AS code_department,
          u.Branch AS branch,
          CAST(CASE WHEN h.IsAktif = 'Y' AND ISNULL(u.IsLocked, 0) = 0 THEN 1 ELSE 0 END AS bit) AS is_active
        FROM UM_DB.dbo.UM_Employee u WITH (NOLOCK)
        INNER JOIN DA.dbo.HRD_Employee h WITH (NOLOCK)
          ON h.EmployeeCode = u.NIK
        WHERE u.NIK = @NIK
          AND h.IsAktif = 'Y'
          AND ISNULL(u.IsLocked, 0) = 0;
      `);

    const emp = result.recordset?.[0] ?? null;
    if (
      emp &&
      (emp.nik.includes("-") ||
        emp.nik === "WSSTR250301" ||
        emp.nik === "WSSTR260806" ||
        emp.nik === "8211185690")
    ) {
      return null;
    }
    return emp;
  } catch (err) {
    console.warn(`[MSSQL_GET_EMPLOYEE_WARNING] Gagal membaca NIK ${cleanNik}:`, err);
    return null;
  }
}
