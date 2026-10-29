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

  try {
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .input("Query", mssql.NVarChar(100), cleanQuery)
      .input("Top", mssql.Int, safeTop)
      .execute<EmployeeDirectoryItem>("UM_DB.dbo.USP_DASHBOARD_SearchEmployee");

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
      .execute<EmployeeDirectoryItem>("UM_DB.dbo.USP_DASHBOARD_GetEmployee");

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
