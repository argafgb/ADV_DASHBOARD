/**
 * Kebijakan akses dashboard per role.
 *
 * File ini sengaja dibuat identik di semua repo dashboard (seperti
 * BrowseDashboardModal dan dashboard-panel) supaya tidak drift. Menambah atau
 * mencabut larangan cukup mengubah ROLE_DENIED_DASHBOARDS di satu tempat lalu
 * menyalin file ini ke repo lain.
 *
 * Dipakai dua sisi:
 * - `src/proxy.ts` sebagai penjaga sebenarnya (menolak request).
 * - `BrowseDashboardModal` sebagai penyaring katalog (menyembunyikan entri).
 *
 * Menyembunyikan entri saja bukan keamanan; penegakannya tetap di proxy.
 */

/** Role yang dikenal issuer (Helpdesk). Token dengan role lain ditolak. */
export const AUTH_ROLES = ["management", "internal"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export function isAuthRole(value: unknown): value is AuthRole {
  return (
    typeof value === "string" &&
    (AUTH_ROLES as readonly string[]).includes(value)
  );
}

/**
 * Identitas stabil tiap dashboard di fleet. Dipakai sebagai kunci kebijakan
 * supaya larangan tidak bergantung pada nama tampilan atau nomor port yang
 * bisa berubah.
 */
export type DashboardId =
  | "helpdesk"
  | "asset-pm"
  | "pic-monitoring"
  | "bug-tracker"
  | "learning-growth"
  | "server-performance"
  | "network-performance"
  | "process-risk"
  | "overtime"
  | "kaldev-performance"
  | "it-repair-maintenance";

/**
 * Dashboard yang tidak boleh diakses oleh sebuah role.
 *
 * Kebijakan ditulis per role, bukan per user. Menambah akun management baru
 * tidak perlu menyentuh kode sama sekali.
 */
export const ROLE_DENIED_DASHBOARDS: Record<DashboardId, readonly AuthRole[]> =
  {
    "bug-tracker": ["management"],
    helpdesk: [],
    "asset-pm": [],
    "pic-monitoring": [],
    "learning-growth": [],
    "server-performance": [],
    "network-performance": [],
    "process-risk": [],
    overtime: [],
    "kaldev-performance": [],
    "it-repair-maintenance": [],
  };

/**
 * Role yang tidak dikenal diperlakukan sebagai tidak berhak, bukan diberi
 * akses penuh. Ini menjaga kebijakan tetap fail-closed bila suatu saat issuer
 * menambah role baru sebelum consumer ikut diperbarui.
 */
export function canAccessDashboard(
  role: string | null | undefined,
  dashboard: DashboardId,
): boolean {
  if (!isAuthRole(role)) return false;
  return !ROLE_DENIED_DASHBOARDS[dashboard].includes(role);
}
