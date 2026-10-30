"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { AccessAuditSkeleton } from "./AccessSkeletons";
import { useAccessApi } from "../hooks/useAccessApi";
import type { AuditLogEntry, AuditLogRow } from "../types/access.types";
import {
  formatDiffItemToHuman,
  formatPermissionLabel,
  formatRoleLabel,
  formatScopeSummary,
  formatScopeDetail,
  formatScopeShortSummary,
  unwrapAuditValue,
  formatFriendlyValue,
} from "../utils/access-format";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Search,
  History,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Layers,
  Calendar as CalendarIcon,
} from "lucide-react";

function formatStandaloneTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}.${mins}`;
  } catch {
    return isoString;
  }
}

type AuditCategory = "Add" | "Update" | "Remove";
type AuditObject = "Role" | "Dashboard" | "Menu" | "Cakupan Data" | "Status";

const OBJECT_PRIORITY: AuditObject[] = ["Role", "Status", "Cakupan Data", "Dashboard", "Menu"];

function isPermissionAction(act: string): boolean {
  return (
    act === "user.permission_granted" ||
    act === "user.permission_revoked" ||
    act === "user.override_cleared" ||
    act === "role.permission_granted" ||
    act === "role.permission_revoked"
  );
}

function entryObject(e: AuditLogEntry): AuditObject {
  const act = e.action;
  if (
    act === "user.activated" ||
    act === "user.suspended" ||
    act === "role.activated" ||
    act === "role.deactivated"
  ) {
    return "Status";
  }
  if (act === "user.scope_changed") return "Cakupan Data";
  if (isPermissionAction(act)) {
    return (e.resource ?? "").startsWith("dashboard.") ? "Dashboard" : "Menu";
  }
  return "Role";
}

function entryCategory(e: AuditLogEntry): AuditCategory {
  const act = e.action;
  if (act === "user.enrolled" || act === "role.created" || act.endsWith("permission_granted")) {
    return "Add";
  }
  if (
    act === "user.suspended" ||
    act === "role.deactivated" ||
    act === "role.deleted" ||
    act === "user.role_removed" ||
    act.endsWith("permission_revoked")
  ) {
    return "Remove";
  }
  return "Update";
}

function permissionName(key: string | null): string {
  return formatPermissionLabel(key).title;
}

function listNames(names: string[], max = 3): string {
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")}, +${names.length - max} lainnya`;
}

function statusLabel(v: unknown): string {
  if (v === "active" || v === true) return "Aktif";
  if (v === "suspended") return "Suspended";
  if (v === false) return "Nonaktif";
  return "-";
}

function getEntries(log: AuditLogRow): AuditLogEntry[] {
  if (Array.isArray(log.entries) && log.entries.length > 0) return log.entries;
  return [{ action: log.action, resource: log.resource, before: log.before, after: log.after }];
}

function collectPermissions(entries: AuditLogEntry[]) {
  const granted: string[] = [];
  const revoked: string[] = [];
  const cleared: string[] = [];
  for (const e of entries) {
    if (e.action === "user.permission_granted" || e.action === "role.permission_granted") {
      granted.push(permissionName(e.resource));
    } else if (e.action === "user.permission_revoked" || e.action === "role.permission_revoked") {
      revoked.push(permissionName(e.resource));
    } else if (e.action === "user.override_cleared") {
      cleared.push(permissionName(e.resource));
    }
  }
  return { granted, revoked, cleared };
}

/** Ringkasan satu baris untuk satu aksi simpan (gabungan seluruh perubahan). */
function getAuditDisplay(log: AuditLogRow) {
  const entries = getEntries(log);

  const categories = new Set(entries.map(entryCategory));
  let actionCategory: AuditCategory = "Update";
  if (entries.some((e) => e.action === "user.enrolled" || e.action === "role.created")) {
    actionCategory = "Add";
  } else if (categories.size === 1) {
    actionCategory = [...categories][0];
  }

  const objects = new Set(entries.map(entryObject));
  const objectType: AuditObject = OBJECT_PRIORITY.find((o) => objects.has(o)) ?? "Role";

  const parts: string[] = [];
  const targetLabel = log.target.label || log.target.nik || "";

  for (const e of entries) {
    switch (e.action) {
      case "user.enrolled":
        parts.push(`Daftarkan pengguna ${targetLabel}`.trim());
        break;
      case "user.activated":
        parts.push("Aktifkan akses pengguna");
        break;
      case "user.suspended":
        parts.push("Suspend akses pengguna");
        break;
      case "user.role_assigned":
        parts.push(`Tetapkan role ${formatRoleLabel(String(unwrapAuditValue(e.after) ?? ""))}`);
        break;
      case "user.role_changed":
        parts.push(
          `Ubah role ${formatRoleLabel(String(unwrapAuditValue(e.before) ?? ""))} → ${formatRoleLabel(String(unwrapAuditValue(e.after) ?? ""))}`,
        );
        break;
      case "user.role_removed":
        parts.push(`Copot role ${formatRoleLabel(String(unwrapAuditValue(e.before) ?? ""))}`);
        break;
      case "user.scope_changed": {
        const afterScope = unwrapAuditValue(e.after);
        const scopeShort = formatScopeShortSummary(afterScope);
        parts.push(`Ubah cakupan data (${scopeShort})`);
        break;
      }
      case "role.created":
        parts.push(`Buat role ${log.target.label || ""}`.trim());
        break;
      case "role.updated":
        parts.push(`Ubah informasi role ${log.target.label || ""}`.trim());
        break;
      case "role.deleted":
        parts.push(`Hapus role ${log.target.label || ""}`.trim());
        break;
      case "role.activated":
        parts.push("Aktifkan role");
        break;
      case "role.deactivated":
        parts.push("Nonaktifkan role");
        break;
      default:
        if (!isPermissionAction(e.action)) parts.push("Ubah pengaturan akses");
    }
  }

  // Saat role dibuat, izin awal sudah tercakup dalam "Buat role".
  if (!entries.some((e) => e.action === "role.created")) {
    const { granted, revoked, cleared } = collectPermissions(entries);
    if (granted.length === 1) parts.push(`Beri akses ${granted[0]}`);
    else if (granted.length > 1) parts.push(`Beri ${granted.length} akses (${listNames(granted)})`);
    if (revoked.length === 1) parts.push(`Cabut akses ${revoked[0]}`);
    else if (revoked.length > 1) parts.push(`Cabut ${revoked.length} akses (${listNames(revoked)})`);
    if (cleared.length === 1) parts.push(`Reset akses ${cleared[0]} ke bawaan role`);
    else if (cleared.length > 1) parts.push(`Reset ${cleared.length} akses ke bawaan role`);
  }

  const summary = [...new Set(parts)].join("; ") || "Ubah pengaturan akses";
  return { actionCategory, objectType, summary };
}

/** Rincian SEBELUM / SESUDAH yang sudah digabung per aksi dan ramah dibaca. */
function getAuditDetails(log: AuditLogRow): { before: string; after: string } {
  const entries = getEntries(log);
  const before: string[] = [];
  const after: string[] = [];

  for (const e of entries) {
    const rawBefore = unwrapAuditValue(e.before);
    const rawAfter = unwrapAuditValue(e.after);

    switch (e.action) {
      case "user.enrolled": {
        const a = (rawAfter ?? {}) as Record<string, unknown>;
        before.push("Belum terdaftar di sistem");
        const details = [
          `Terdaftar sebagai pengguna baru`,
          `• Peran: ${formatRoleLabel(String(a.roleKey ?? ""))}`,
        ];
        if (a.status) {
          details.push(`• Status: ${statusLabel(a.status)}`);
        }
        after.push(details.join("\n"));
        break;
      }
      case "user.activated":
      case "user.suspended":
      case "role.activated":
      case "role.deactivated":
        before.push(`Status: ${statusLabel(rawBefore)}`);
        after.push(`Status: ${statusLabel(rawAfter)}`);
        break;
      case "user.role_assigned":
      case "user.role_changed":
      case "user.role_removed":
        before.push(`Peran: ${formatRoleLabel(rawBefore ? String(rawBefore) : null)}`);
        after.push(`Peran: ${formatRoleLabel(rawAfter ? String(rawAfter) : null)}`);
        break;
      case "user.scope_changed":
        before.push(formatScopeDetail(rawBefore));
        after.push(formatScopeDetail(rawAfter));
        break;
      case "role.created": {
        const a = (rawAfter ?? {}) as Record<string, unknown>;
        before.push("Peran belum ada di sistem");
        after.push(
          `Pembuatan peran baru "${String(a.name ?? log.target.label ?? "-")}"` +
            (a.permissionsCount !== undefined ? ` dengan ${String(a.permissionsCount)} izin akses` : ""),
        );
        break;
      }
      case "role.deleted":
        before.push(`Peran "${log.target.label || "-"}" aktif`);
        after.push(`Peran "${log.target.label || "-"}" telah dihapus`);
        break;
      case "role.updated": {
        const b = (rawBefore as Record<string, unknown>) || {};
        const a = (rawAfter as Record<string, unknown>) || {};
        const bLines: string[] = [];
        const aLines: string[] = [];

        if (b.name !== a.name) {
          bLines.push(`Nama Peran: ${b.name || "-"}`);
          aLines.push(`Nama Peran: ${a.name || "-"}`);
        }
        if ((b.description ?? "") !== (a.description ?? "")) {
          bLines.push(`Deskripsi: ${b.description || "(Kosong)"}`);
          aLines.push(`Deskripsi: ${a.description || "(Kosong)"}`);
        }
        if (b.fleetRole !== a.fleetRole) {
          bLines.push(`Kategori: ${b.fleetRole === "management" ? "Eksekutif & Bisnis" : "Operasional IT"}`);
          aLines.push(`Kategori: ${a.fleetRole === "management" ? "Eksekutif & Bisnis" : "Operasional IT"}`);
        }
        if (b.defaultScopeAll !== a.defaultScopeAll) {
          bLines.push(`Cakupan Bawaan: ${b.defaultScopeAll ? "Semua Cabang (Nasional)" : "Cabang Tertentu"}`);
          aLines.push(`Cakupan Bawaan: ${a.defaultScopeAll ? "Semua Cabang (Nasional)" : "Cabang Tertentu"}`);
        }

        before.push(bLines.length > 0 ? bLines.join("\n") : "Data template peran sebelumnya");
        after.push(aLines.length > 0 ? aLines.join("\n") : "Data template peran diperbarui");
        break;
      }
      default:
        if (!isPermissionAction(e.action)) {
          const d = formatDiffItemToHuman({
            action: e.action,
            resource: e.resource ?? "",
            before_value: rawBefore,
            after_value: rawAfter,
          });
          const bVal = formatFriendlyValue(rawBefore, e.resource ?? "");
          const aVal = formatFriendlyValue(rawAfter, e.resource ?? "");
          before.push(bVal !== "-" ? bVal : "Nilai sebelumnya");
          after.push(aVal !== "-" ? aVal : d.detail);
        }
    }
  }

  if (!entries.some((e) => e.action === "role.created")) {
    const { granted, revoked, cleared } = collectPermissions(entries);
    const bullet = (names: string[]) => names.map((n) => `• ${n}`).join("\n");
    if (granted.length > 0) {
      before.push(`Belum punya akses (${granted.length}):\n${bullet(granted)}`);
      after.push(`Akses diberikan (${granted.length}):\n${bullet(granted)}`);
    }
    if (revoked.length > 0) {
      before.push(`Punya akses (${revoked.length}):\n${bullet(revoked)}`);
      after.push(`Akses dicabut (${revoked.length}):\n${bullet(revoked)}`);
    }
    if (cleared.length > 0) {
      before.push(`Akses khusus (${cleared.length}):\n${bullet(cleared)}`);
      after.push(`Dikembalikan ke bawaan role (${cleared.length}):\n${bullet(cleared)}`);
    }
  }

  return {
    before: before.length > 0 ? before.join("\n\n") : "-",
    after: after.length > 0 ? after.join("\n\n") : "-",
  };
}

const MONTHS_FILTER_OPTS = [
  { label: "Semua", value: "ALL" },
  { label: "Januari", value: "1" },
  { label: "Februari", value: "2" },
  { label: "Maret", value: "3" },
  { label: "April", value: "4" },
  { label: "Mei", value: "5" },
  { label: "Juni", value: "6" },
  { label: "Juli", value: "7" },
  { label: "Agustus", value: "8" },
  { label: "September", value: "9" },
  { label: "Oktober", value: "10" },
  { label: "November", value: "11" },
  { label: "Desember", value: "12" },
];

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, -1, total];
  }
  if (current >= total - 3) {
    return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, -1, current - 1, current, current + 1, -1, total];
}

export function AccessAuditClient() {
  const { request } = useAccessApi();

  const [loading, setLoading] = React.useState(true);
  const [logs, setLogs] = React.useState<AuditLogRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("ALL");
  const [objectFilter, setObjectFilter] = React.useState("ALL");
  const [monthFilter, setMonthFilter] = React.useState("ALL");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (actionFilter !== "ALL") params.set("category", actionFilter);
    if (objectFilter !== "ALL") params.set("objectType", objectFilter);

    let effectiveFrom = fromDate;
    let effectiveTo = toDate;
    if (!effectiveFrom && !effectiveTo && monthFilter !== "ALL") {
      const year = new Date().getFullYear();
      const m = parseInt(monthFilter, 10);
      const start = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      effectiveFrom = start.toISOString();
      effectiveTo = end.toISOString();
    }
    // Validasi backdate: tanggal awal tidak boleh melebihi tanggal akhir
    if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
      effectiveTo = effectiveFrom;
    }
    if (effectiveFrom) params.set("from", effectiveFrom);
    if (effectiveTo) params.set("to", effectiveTo);

    // Debounce supaya mengetik di kotak cari tidak mengirim satu request per huruf.
    const timer = setTimeout(() => {
    request<{ items: AuditLogRow[]; total: number }>(
      `/api/access/audit?${params.toString()}`,
    )
      .then((res) => {
        if (!ignore) {
          setLogs(res.items ?? []);
          setTotal(res.total ?? 0);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("[FETCH_AUDIT_LOGS_ERROR]", err);
          setLoading(false);
        }
      });
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [page, debouncedSearch, actionFilter, objectFilter, monthFilter, fromDate, toDate, request]);

  // Process rows with display helpers
  const paginatedRows = React.useMemo(() => {
    return logs.map((log) => {
      const { actionCategory, objectType, summary } = getAuditDisplay(log);
      const details = getAuditDetails(log);
      return {
        ...log,
        actionCategory,
        objectType,
        displaySummary: summary,
        detailBefore: details.before,
        detailAfter: details.after,
      };
    });
  }, [logs]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4 font-sans">
      {/* Top Header & Search Bar matching Standalone */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Audit log
            </h2>
            <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {total} perubahan
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Log tidak bisa diubah atau dihapus. Klik baris untuk melihat nilai sebelum dan sesudah.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Cari nama, NIK, atau summary..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-8 text-xs h-9 bg-zinc-50 dark:bg-zinc-900/50"
          />
        </div>
      </div>

      {/* Filter Row matching Standalone */}
      <div className="flex items-center gap-2.5 flex-wrap pt-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        {/* Action Filter */}
        <div className="w-36">
          <Select
            value={actionFilter}
            onValueChange={(val) => {
              if (val) {
                setActionFilter(val);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-1.5 truncate">
                <RotateCcw className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="text-zinc-400 font-normal">Action:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {actionFilter === "ALL" ? "Semua" : actionFilter}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="Add">Add</SelectItem>
              <SelectItem value="Update">Update</SelectItem>
              <SelectItem value="Remove">Remove</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Object Filter */}
        <div className="w-40">
          <Select
            value={objectFilter}
            onValueChange={(val) => {
              if (val) {
                setObjectFilter(val);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-1.5 truncate">
                <Layers className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="text-zinc-400 font-normal">Object:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {objectFilter === "ALL" ? "Semua" : objectFilter}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="Role">Role</SelectItem>
              <SelectItem value="Dashboard">Dashboard</SelectItem>
              <SelectItem value="Menu">Menu</SelectItem>
              <SelectItem value="Cakupan Data">Cakupan Data</SelectItem>
              <SelectItem value="Status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulan Filter */}
        <div className="w-40">
          <Select
            value={monthFilter}
            onValueChange={(val) => {
              if (val) {
                setMonthFilter(val);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-1.5 truncate">
                <CalendarIcon className="h-3 w-3 text-zinc-400 shrink-0" />
                <span className="text-zinc-400 font-normal">Bulan:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {MONTHS_FILTER_OPTS.find((m) => m.value === monthFilter)?.label ?? "Semua"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {MONTHS_FILTER_OPTS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Optional Custom Date Picker Range */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 ml-auto">
          <DatePicker
            value={fromDate}
            onChange={(d) => {
              setFromDate(d);
              if (toDate && d && d > toDate) {
                setToDate(d);
              }
              setPage(1);
            }}
            maxDate={toDate || undefined}
            placeholder="Dari tanggal"
            className="w-32 h-8.5"
          />
          <span>-</span>
          <DatePicker
            value={toDate}
            onChange={(d) => {
              setToDate(d);
              if (fromDate && d && d < fromDate) {
                setFromDate(d);
              }
              setPage(1);
            }}
            minDate={fromDate || undefined}
            placeholder="Sampai tanggal"
            className="w-32 h-8.5"
          />
        </div>
      </div>

      {/* Table Sesuai Standalone UI */}
      {loading ? (
        <AccessAuditSkeleton />
      ) : paginatedRows.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={History}
            title="Tidak Ada Catatan Audit"
            description="Tidak ditemukan jejak audit untuk kriteria pencarian yang dipilih."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5 w-36">TIME</th>
                <th className="py-3 px-3.5 w-52">ACTOR</th>
                <th className="py-3 px-3.5 w-24">ACTION</th>
                <th className="py-3 px-3.5 w-52">TARGET</th>
                <th className="py-3 px-3.5 w-28">OBJECT</th>
                <th className="py-3 px-3.5">SUMMARY</th>
                <th className="py-3 px-2 w-10 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {paginatedRows.map((r) => {
                const isExpanded = expandedId === r.id;
                let toneBadge = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
                if (r.actionCategory === "Add") {
                  toneBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
                } else if (r.actionCategory === "Remove") {
                  toneBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";
                }

                const actorDisplayName = r.actor.name
                  ? `${r.actor.name} (${r.actor.nik})`
                  : r.actor.nik;

                const targetDisplayName = r.target.type === "role"
                  ? `Role: ${r.target.label || "Template Role"}`
                  : r.target.label
                    ? `${r.target.label} (${r.target.nik || ""})`
                    : r.target.nik || "Pengguna";

                const targetSub = r.target.type === "role"
                  ? "Template role"
                  : "Pengguna";

                return (
                  <React.Fragment key={r.id}>
                    <tr
                      onClick={() => toggleExpand(r.id)}
                      className={`hover:bg-zinc-50/75 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer ${
                        isExpanded ? "bg-zinc-50/50 dark:bg-zinc-900/30" : ""
                      }`}
                    >
                      {/* TIME */}
                      <td className="py-3 px-3.5 tabular-nums text-[11px] whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        {formatStandaloneTime(r.occurredAt)}
                      </td>

                      {/* ACTOR (Stacked) */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {actorDisplayName}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {r.actor.nik === "system" ? "Sistem" : "IT Product"}
                        </div>
                      </td>

                      {/* ACTION (Chip) */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${toneBadge}`}
                        >
                          {r.actionCategory}
                        </span>
                      </td>

                      {/* TARGET (Stacked) */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {targetDisplayName}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {targetSub}
                        </div>
                      </td>

                      {/* OBJECT */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-zinc-600 dark:text-zinc-300 font-medium">
                        {r.objectType}
                      </td>

                      {/* SUMMARY */}
                      <td className="py-3 px-3.5 text-zinc-600 dark:text-zinc-300">
                        <span className="line-clamp-1" title={r.displaySummary}>
                          {r.displaySummary}
                        </span>
                      </td>

                      {/* Chevron Arrow */}
                      <td className="py-3 px-2 text-right text-zinc-400">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 inline" />
                        ) : (
                          <ChevronRight className="h-4 w-4 inline" />
                        )}
                      </td>
                    </tr>

                    {/* Expandable SEBELUM & SESUDAH side-by-side matching Standalone */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/70 dark:bg-zinc-900/50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* SEBELUM */}
                            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2 shadow-2xs">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                SEBELUM
                              </span>
                              <div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                                {r.detailBefore}
                              </div>
                            </div>

                            {/* SESUDAH */}
                            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2 shadow-2xs">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                SESUDAH
                              </span>
                              <div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                                {r.detailAfter}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Numbered Pagination Footer matching Standalone */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
          <span>
            Menampilkan {total ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, total)} dari {total} perubahan
          </span>

          <div className="flex items-center gap-1.5 self-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0 text-xs"
              title="Sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Numbered Page Buttons */}
            {getPageNumbers(page, totalPages).map((p, idx) => {
              if (p === -1) {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1 text-zinc-400">
                    ...
                  </span>
                );
              }
              const isActive = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 p-0 text-xs"
              title="Berikutnya"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
