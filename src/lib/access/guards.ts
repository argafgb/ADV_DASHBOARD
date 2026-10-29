import { AccessDeniedError } from "./errors";
import type { DesiredUserAccess } from "./access-diff";

export interface CurrentActor {
  nik: string;
  permissions: ReadonlySet<string>;
}

export type GuardResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

/**
 * Validasi aturan bisnis mutasi hak akses pengguna.
 *
 * Mencegah:
 * 1. Self-edit: admin tidak boleh mengubah akun sendiri.
 * 2. Privilege escalation: admin tidak boleh memberikan izin yang tidak mereka miliki.
 * 3. Modifikasi izin access.* tanpa memiliki hak access.roles.manage.
 * 4. Mengaktifkan karyawan yang sudah nonaktif di HR (DA..HRD_Employee.IsAktif = 'N').
 */
export function canEditUser(
  actor: CurrentActor,
  targetNik: string,
  desired: DesiredUserAccess,
  options?: { isEmployeeActive?: boolean },
): GuardResult {
  // Self-edit diizinkan agar pengelola akses dapat menguji dan menyesuaikan profil akun mereka sendiri.
  // Proteksi admin terakhir tetap dijaga oleh assertNotLastAdmin.

  // 2. Privilege escalation check pada overrides
  const isSuperAdmin = actor.permissions.has("access.roles.manage");

  for (const override of desired.overrides) {
    if (override.effect === "grant") {
      if (
        override.permission.startsWith("access.") &&
        !actor.permissions.has("access.roles.manage")
      ) {
        return {
          ok: false,
          code: "PRIVILEGE_ESCALATION",
          message:
            "Memberikan izin administratif access.* memerlukan hak access.roles.manage.",
        };
      }

      // Admin dengan wewenang kelola peran (access.roles.manage) dapat mengalokasikan seluruh modul operasional.
      // Aktor reguler/terbatas tidak dapat memberikan izin yang tidak mereka miliki sendiri.
      if (!isSuperAdmin && !actor.permissions.has(override.permission)) {
        return {
          ok: false,
          code: "PRIVILEGE_ESCALATION",
          message: `Anda tidak dapat memberikan izin yang tidak Anda miliki: ${override.permission}`,
        };
      }
    }
  }

  // 3. Employee active state check
  if (options?.isEmployeeActive === false && desired.status === "active") {
    return {
      ok: false,
      code: "EMPLOYEE_INACTIVE",
      message:
        "Karyawan berstatus nonaktif di master HR dan tidak dapat diaktifkan. Anda hanya dapat menyetel status suspend.",
    };
  }

  return { ok: true };
}

/**
 * Memastikan tidak ada aksi yang menghapus/mensuspend/mencopot admin terakhir.
 */
export function assertNotLastAdmin(countActiveAdminsExcluding: number): void {
  if (countActiveAdminsExcluding <= 0) {
    throw new AccessDeniedError(
      "Minimal harus ada satu IT Product aktif sebagai pengelola akses.",
      "LAST_ADMIN",
      422,
    );
  }
}
