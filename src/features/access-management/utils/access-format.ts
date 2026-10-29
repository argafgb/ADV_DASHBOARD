import { PERMISSION_CATALOG } from "@/lib/access/catalog";

export function formatAccessDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";

    return (
      new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(d) + " WIB"
    );
  } catch {
    return isoString;
  }
}

export function formatActionLabel(action: string): string {
  const map: Record<string, string> = {
    "user.enrolled": "Pendaftaran Pengguna",
    "user.activated": "Pengaktifan Akun",
    "user.suspended": "Penonaktifan (Suspend)",
    "user.role_assigned": "Penetapan Peran",
    "user.role_changed": "Perubahan Peran",
    "user.role_removed": "Pencopotan Peran",
    "user.scope_changed": "Penyesuaian Wilayah & Cabang",
    "user.permission_granted": "Pemberian Izin Khusus",
    "user.permission_revoked": "Pencabutan Izin Khusus",
    "user.override_cleared": "Kembalikan ke Bawaan Peran",
    "user.bootstrap": "Inisialisasi Sistem",
    "role.created": "Pembuatan Peran Baru",
    "role.updated": "Pembaruan Peran",
    "role.permission_granted": "Penambahan Izin Peran",
    "role.permission_revoked": "Pengurangan Izin Peran",
    "role.activated": "Pengaktifan Peran",
    "role.deactivated": "Penonaktifan Peran",
  };

  return map[action] ?? action;
}

export function getActionTone(action: string): "green" | "blue" | "red" | "zinc" {
  if (
    action.includes("activated") ||
    action.includes("granted") ||
    action.includes("created") ||
    action.includes("enrolled") ||
    action.includes("bootstrap")
  ) {
    return "green";
  }

  if (
    action.includes("suspended") ||
    action.includes("revoked") ||
    action.includes("removed") ||
    action.includes("deactivated")
  ) {
    return "red";
  }

  if (action.includes("changed") || action.includes("updated")) {
    return "blue";
  }

  return "zinc";
}

/**
 * Format nama peran teknis (misal: "regional-head") menjadi nama resmi yang rapi ("Regional Head").
 */
export function formatRoleLabel(roleKey: string | null | undefined): string {
  if (!roleKey) return "Tanpa Peran";
  const clean = String(roleKey).replace(/^["']|["']$/g, "").trim();
  if (!clean || clean === "NONE") return "Tanpa Peran";

  const map: Record<string, string> = {
    "it-product": "IT Product",
    "it-admin": "IT Admin",
    management: "Management",
    "regional-head": "Regional Head",
    "branch-manager": "Branch Manager",
    staff: "Staff",
  };

  if (map[clean]) return map[clean];

  return clean
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Menerjemahkan kunci izin teknis (misal: "dashboard.asset-pm.view", "menu.helpdesk.overview.view")
 * menjadi label nama dashboard dan menu yang ramah dibaca pengguna.
 */
export function formatPermissionLabel(key: string | null | undefined): {
  category: "Dashboard" | "Menu" | "Akses Sistem" | "Lainnya";
  title: string;
  subLabel?: string;
} {
  if (!key) {
    return { category: "Lainnya", title: "-" };
  }

  // Khusus Access Management
  if (key === "access.users.manage") {
    return { category: "Akses Sistem", title: "Kelola Akses Pengguna", subLabel: "Access Management" };
  }
  if (key === "access.roles.manage") {
    return { category: "Akses Sistem", title: "Kelola Peran & Izin", subLabel: "Access Management" };
  }
  if (key === "access.audit.view") {
    return { category: "Akses Sistem", title: "Lihat Audit Log Akses", subLabel: "Access Management" };
  }

  // Dashboard master
  const matchedDash = PERMISSION_CATALOG.find((d) => d.permission === key);
  if (matchedDash) {
    return {
      category: "Dashboard",
      title: matchedDash.name,
      subLabel: matchedDash.category,
    };
  }

  // Menu item di dalam dashboard
  for (const dash of PERMISSION_CATALOG) {
    const matchedMenu = dash.menus.find((m) => m.permission === key);
    if (matchedMenu) {
      return {
        category: "Menu",
        title: `${dash.name} > ${matchedMenu.name}`,
        subLabel: matchedMenu.description ?? dash.name,
      };
    }
  }

  // Fallback humanizer
  const clean = key
    .replace(/^dashboard\./, "Dashboard ")
    .replace(/^menu\./, "Menu ")
    .replace(/\.view$/, "")
    .replace(/[._-]/g, " ");

  return {
    category: "Lainnya",
    title: clean.charAt(0).toUpperCase() + clean.slice(1),
  };
}

/**
 * Format badge tipe sumber daya (role -> "Peran", scope -> "Cakupan Data", dll.)
 */
export function formatResourceBadge(resource: string | null | undefined): string {
  if (!resource) return "-";
  if (resource === "role") return "Peran";
  if (resource === "scope") return "Cakupan Data";
  if (resource === "status") return "Status Akun";
  if (resource === "metadata") return "Informasi Akun";

  if (resource.startsWith("dashboard.")) return "Dashboard";
  if (resource.startsWith("menu.")) return "Menu";
  if (resource.startsWith("access.")) return "Akses Sistem";

  return resource;
}

/**
 * Membuka bungkus nilai audit (JSON string, quoted string, dll.) menjadi tipe data aslinya.
 */
export function unwrapAuditValue<T = unknown>(val: unknown): T {
  if (val === null || val === undefined) return val as T;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return unwrapAuditValue(parsed);
      } catch {
        return val as T;
      }
    }
  }
  return val as T;
}

/**
 * Format ringkasan satu baris cakupan wilayah dan cabang (bebas dari sintaks JSON).
 */
export function formatScopeSummary(scopeObj: unknown): string {
  const unwrapped = unwrapAuditValue(scopeObj);
  if (!unwrapped) return "-";
  if (typeof unwrapped === "boolean") {
    return unwrapped ? "Semua Wilayah & Cabang (Nasional)" : "Cakupan Terbatas";
  }

  if (typeof unwrapped === "object") {
    const s = unwrapped as Record<string, unknown>;
    if (s.all) {
      return "Semua Wilayah & Cabang (Nasional)";
    }

    const parts: string[] = [];
    if (Array.isArray(s.regions) && s.regions.length > 0) {
      parts.push(`Wilayah: ${s.regions.join(", ")}`);
    }
    if (Array.isArray(s.branches) && s.branches.length > 0) {
      if (s.branches.length === 1) {
        parts.push(`1 Cabang: ${s.branches[0]}`);
      } else {
        parts.push(`${s.branches.length} Cabang (${s.branches.join(", ")})`);
      }
    }
    if (Array.isArray(s.departments) && s.departments.length > 0) {
      parts.push(`Dept: ${s.departments.join(", ")}`);
    }

    return parts.length > 0 ? parts.join(" | ") : "Cakupan Terbatas (Belum ada cabang/wilayah terpilih)";
  }

  return String(unwrapped);
}

/**
 * Format ringkasan sangat ringkas untuk kolom SUMMARY di tabel (misal: "1 Cabang: MALANG" atau "30 Cabang").
 */
export function formatScopeShortSummary(scopeObj: unknown): string {
  const unwrapped = unwrapAuditValue(scopeObj);
  if (!unwrapped) return "Akses Terbatas";
  if (typeof unwrapped === "boolean") {
    return unwrapped ? "Semua Cabang / Nasional" : "Akses Terbatas";
  }

  if (typeof unwrapped === "object") {
    const s = unwrapped as Record<string, unknown>;
    if (s.all) return "Semua Cabang / Nasional";

    const parts: string[] = [];
    if (Array.isArray(s.regions) && s.regions.length > 0) {
      parts.push(`Wilayah ${s.regions.join(", ")}`);
    }
    if (Array.isArray(s.branches) && s.branches.length > 0) {
      if (s.branches.length === 1) {
        parts.push(`1 Cabang: ${s.branches[0]}`);
      } else {
        parts.push(`${s.branches.length} Cabang`);
      }
    }
    return parts.length > 0 ? parts.join(", ") : "Akses Terbatas";
  }

  return String(unwrapped);
}

/**
 * Format rincian cakupan wilayah dan cabang yang rapi dan mudah dipahami user (SEBELUM / SESUDAH).
 */
export function formatScopeDetail(scopeObj: unknown): string {
  const unwrapped = unwrapAuditValue(scopeObj);
  if (!unwrapped) return "Tidak ada konfigurasi cakupan";
  if (typeof unwrapped === "boolean") {
    return unwrapped
      ? "Semua Wilayah & Cabang (Nasional / Seluruh Cabang)"
      : "Cakupan Terbatas";
  }

  if (typeof unwrapped === "object") {
    const s = unwrapped as Record<string, unknown>;
    if (s.all) {
      return "Semua Wilayah & Cabang (Nasional / Seluruh Cabang)";
    }

    const regions = Array.isArray(s.regions) ? (s.regions as string[]) : [];
    const branches = Array.isArray(s.branches) ? (s.branches as string[]) : [];
    const depts = Array.isArray(s.departments) ? (s.departments as string[]) : [];

    const hasRegions = regions.length > 0;
    const hasBranches = branches.length > 0;
    const hasDepts = depts.length > 0;

    const sections: string[] = [];

    if (hasRegions && !hasBranches) {
      sections.push("Tipe Cakupan: Berdasarkan Wilayah (Regional)");
      sections.push(`Daftar Wilayah (${regions.length}):\n${regions.join(", ")}`);
    } else if (hasBranches && !hasRegions) {
      sections.push(`Tipe Cakupan: Khusus Cabang Tertentu (${branches.length} Cabang)`);
      sections.push(`Daftar Cabang:\n${branches.join(", ")}`);
    } else if (hasRegions && hasBranches) {
      sections.push("Tipe Cakupan: Kombinasi Wilayah & Cabang Khusus");
      sections.push(`Daftar Wilayah (${regions.length}):\n${regions.join(", ")}`);
      sections.push(`Daftar Cabang (${branches.length}):\n${branches.join(", ")}`);
    } else {
      sections.push("Tipe Cakupan: Terbatas (Belum ada wilayah/cabang yang dipilih)");
    }

    if (hasDepts) {
      sections.push(`Departemen Khusus: ${depts.join(", ")}`);
    }

    return sections.join("\n\n");
  }

  return String(unwrapped);
}

/**
 * Menerjemahkan nilai sebelum dan sesudah menjadi teks deskriptif berbahasa Indonesia.
 */
export function formatFriendlyValue(val: unknown, resource?: string): string {
  val = unwrapAuditValue(val);
  if (val === null || val === undefined) return "-";

  if (resource === "role") {
    return formatRoleLabel(String(val));
  }

  if (resource === "status") {
    return val === "active" ? "Aktif" : "Dinonaktifkan (Suspended)";
  }

  if (resource === "scope") {
    return formatScopeSummary(val);
  }

  if (val === "grant") return "Izin Diberikan Khusus";
  if (val === "revoke") return "Izin Dicabut";
  if (val === true) return "Aktif";
  if (val === false) return "Nonaktif";

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if ("all" in obj) {
      return formatScopeSummary(obj);
    }
    if ("roleKey" in obj || "status" in obj) {
      const parts: string[] = [];
      if ("roleKey" in obj) parts.push(`Peran: ${formatRoleLabel(String(obj.roleKey))}`);
      if ("status" in obj) parts.push(`Status: ${obj.status === "active" ? "Aktif" : "Suspended"}`);
      return parts.join(", ");
    }

    const keyLabels: Record<string, string> = {
      name: "Nama Peran",
      description: "Deskripsi",
      fleetRole: "Kategori Peran",
      defaultScopeAll: "Cakupan Bawaan",
      permissionsCount: "Jumlah Izin",
      roleKey: "Peran",
      status: "Status",
    };
    const entries = Object.entries(obj)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => {
        const label = keyLabels[k] || k;
        let formattedVal = String(v);
        if (k === "fleetRole") {
          formattedVal = v === "management" ? "Eksekutif & Bisnis" : "Operasional IT";
        } else if (k === "defaultScopeAll") {
          formattedVal = v ? "Semua Cabang (Nasional)" : "Cabang Tertentu";
        } else if (k === "roleKey") {
          formattedVal = formatRoleLabel(String(v));
        } else if (k === "status") {
          formattedVal = v === "active" ? "Aktif" : "Suspended";
        }
        return `${label}: ${formattedVal}`;
      });
    if (entries.length > 0) return entries.join("; ");
  }

  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(", ") : "(Kosong)";
  }

  return String(val);
}

export interface HumanFriendlyDiffItem {
  actionTitle: string;
  detail: string;
  tone: "green" | "blue" | "red" | "zinc";
}

/**
 * Menerjemahkan baris audit diff menjadi pesan informatif berbahasa Indonesia
 * tanpa sintaks teknis (.view, kurung kurawal json, dsb.).
 */
export function formatDiffItemToHuman(diff: {
  action: string;
  resource: string;
  before_value: unknown;
  after_value: unknown;
}): HumanFriendlyDiffItem {
  const tone = getActionTone(diff.action);
  const actionTitle = formatActionLabel(diff.action);

  // 1. Role created
  if (diff.action === "role.created") {
    const obj = diff.after_value as Record<string, unknown> | null;
    return {
      actionTitle: "Pembuatan Role Baru",
      detail: `Membuat template role "${obj?.name ?? "-"}"`,
      tone: "green",
    };
  }

  // 2. Role deleted
  if (diff.action === "role.deleted") {
    const obj = diff.before_value as Record<string, unknown> | null;
    return {
      actionTitle: "Penghapusan Role",
      detail: `Menghapus template role "${obj?.name ?? "-"}"`,
      tone: "red",
    };
  }

  // 3. Role metadata updated
  if (diff.action === "role.updated") {
    const b = (diff.before_value as Record<string, unknown>) || {};
    const a = (diff.after_value as Record<string, unknown>) || {};
    const changes: string[] = [];
    if (b.name !== a.name) {
      changes.push(`Nama: "${b.name}" → "${a.name}"`);
    }
    if ((b.description ?? "") !== (a.description ?? "")) {
      changes.push(`Deskripsi: "${a.description || "(Dikosongkan)"}"`);
    }
    if (b.fleetRole !== a.fleetRole) {
      changes.push(
        `Kategori: ${b.fleetRole === "management" ? "Eksekutif & Bisnis" : "Operasional IT"} → ${a.fleetRole === "management" ? "Eksekutif & Bisnis" : "Operasional IT"}`,
      );
    }
    if (b.defaultScopeAll !== a.defaultScopeAll) {
      changes.push(
        `Cakupan bawaan: ${b.defaultScopeAll ? "Semua Site" : "Site Tertentu"} → ${a.defaultScopeAll ? "Semua Site" : "Site Tertentu"}`,
      );
    }
    return {
      actionTitle: "Pembaruan Informasi Role",
      detail: changes.length > 0 ? changes.join("; ") : "Pembaruan data template role",
      tone: "blue",
    };
  }

  // 4. Role status
  if (diff.action === "role.activated") {
    return {
      actionTitle: "Pengaktifan Role",
      detail: "Mengaktifkan kembali template role ini",
      tone: "green",
    };
  }
  if (diff.action === "role.deactivated") {
    return {
      actionTitle: "Penonaktifan Role",
      detail: "Menonaktifkan template role ini",
      tone: "red",
    };
  }

  // 5. Role or user permissions (granted, revoked, cleared)
  if (
    diff.action === "role.permission_granted" ||
    diff.action === "user.permission_granted"
  ) {
    const permInfo = formatPermissionLabel(diff.resource);
    return {
      actionTitle: "Pemberian Izin Akses",
      detail: `Memberikan akses ke: ${permInfo.title}`,
      tone: "green",
    };
  }

  if (
    diff.action === "role.permission_revoked" ||
    diff.action === "user.permission_revoked"
  ) {
    const permInfo = formatPermissionLabel(diff.resource);
    return {
      actionTitle: "Pencabutan Izin Akses",
      detail: `Mencabut akses dari: ${permInfo.title}`,
      tone: "red",
    };
  }

  if (diff.action === "user.override_cleared") {
    const permInfo = formatPermissionLabel(diff.resource);
    return {
      actionTitle: "Reset Izin Khusus",
      detail: `Mengembalikan izin "${permInfo.title}" ke setelan bawaan peran`,
      tone: "zinc",
    };
  }

  // 6. User account status
  if (diff.action === "user.activated") {
    return {
      actionTitle: "Pengaktifan Akun",
      detail: "Mengubah status akun menjadi Aktif",
      tone: "green",
    };
  }
  if (diff.action === "user.suspended") {
    return {
      actionTitle: "Penonaktifan Akun",
      detail: "Mengubah status akun menjadi Nonaktif (Suspended)",
      tone: "red",
    };
  }

  // 7. User role assignment
  if (diff.action === "user.role_assigned") {
    return {
      actionTitle: "Penetapan Peran",
      detail: `Menetapkan peran pengguna ke: ${formatRoleLabel(String(diff.after_value))}`,
      tone: "blue",
    };
  }
  if (diff.action === "user.role_changed") {
    return {
      actionTitle: "Perubahan Peran",
      detail: `Mengubah peran dari "${formatRoleLabel(String(diff.before_value))}" menjadi "${formatRoleLabel(String(diff.after_value))}"`,
      tone: "blue",
    };
  }
  if (diff.action === "user.role_removed") {
    return {
      actionTitle: "Pencopotan Peran",
      detail: `Mencopot peran "${formatRoleLabel(String(diff.before_value))}" (kini tanpa peran)`,
      tone: "red",
    };
  }

  // 8. User scope changed
  if (diff.action === "user.scope_changed") {
    const bScope = formatScopeSummary(diff.before_value);
    const aScope = formatScopeSummary(diff.after_value);
    return {
      actionTitle: "Penyesuaian Cakupan Data",
      detail: `Cakupan diubah dari "${bScope}" menjadi "${aScope}"`,
      tone: "blue",
    };
  }

  // Fallback
  return {
    actionTitle,
    detail: `${formatFriendlyValue(diff.before_value, diff.resource)} → ${formatFriendlyValue(diff.after_value, diff.resource)}`,
    tone,
  };
}

