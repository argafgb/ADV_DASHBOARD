"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PermissionTree } from "./PermissionTree";
import { CustomRadio } from "./CustomRadio";
import { AccessRolesSkeleton } from "./AccessSkeletons";
import { ConfirmChangesDialog } from "./ConfirmChangesDialog";
import { useAccessApi } from "../hooks/useAccessApi";
import type { RoleListItem } from "../types/access.types";
import { PERMISSION_CATALOG, ALL_DASHBOARD_MENU_PERMISSIONS, type PermissionKey } from "@/lib/access/catalog";
import { diffRole, type AuditRowDraft, type RoleSnapshot } from "@/lib/access/access-diff";
import { cn } from "@/lib/utils";
import {
  Plus,
  Lock,
  ChevronRight,
  Edit3,
  Trash2,
  AlertCircle,
} from "lucide-react";

export function AccessRolesClient() {
  const { request } = useAccessApi();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [roles, setRoles] = React.useState<RoleListItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | null>(null);

  // Editor draft state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [fleetRole, setFleetRole] = React.useState<"management" | "internal">("internal");
  const [scopeType, setScopeType] = React.useState<"All sites" | "Region" | "Site">("All sites");
  const [isActive, setIsActive] = React.useState(true);
  const [permissions, setPermissions] = React.useState<Set<PermissionKey>>(new Set());

  // Save changes confirmation dialog state
  const [confirmSaveOpen, setConfirmSaveOpen] = React.useState(false);

  // Edit role detail modal state
  const [editInfoOpen, setEditInfoOpen] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editFleetRole, setEditFleetRole] = React.useState<"management" | "internal">("management");
  const [editErrors, setEditErrors] = React.useState<{ name?: string; description?: string } | null>(null);

  // Delete role confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // Create role modal state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newFleetRole, setNewFleetRole] = React.useState<"management" | "internal">("management");
  const [newScopeType, setNewScopeType] = React.useState<"All sites" | "Region" | "Site">("All sites");
  const [newPermissions, setNewPermissions] = React.useState<Set<PermissionKey>>(
    () => new Set(ALL_DASHBOARD_MENU_PERMISSIONS),
  );
  const [createErrors, setCreateErrors] = React.useState<{ name?: string; description?: string } | null>(null);
  const [createModalError, setCreateModalError] = React.useState<string | null>(null);

  // Expanded state for permissions in modal (expanded by default to show enabled menus)
  const [newExpanded, setNewExpanded] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    PERMISSION_CATALOG.forEach((d) => {
      init[d.id] = true;
    });
    return init;
  });

  const [notification, setNotification] = React.useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const loadRoles = React.useCallback(async () => {
    try {
      const res = await request<{ items: RoleListItem[] }>("/api/access/roles");
      setRoles(res.items ?? []);
      setSelectedRoleId((current) => current ?? res.items?.[0]?.id ?? null);
    } catch (err) {
      console.error("[LOAD_ROLES_ERROR]", err);
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memuat daftar role.",
      });
    } finally {
      setLoading(false);
    }
  }, [request]);

  React.useEffect(() => {
    let ignore = false;
    request<{ items: RoleListItem[] }>("/api/access/roles")
      .then((res) => {
        if (!ignore) {
          setRoles(res.items ?? []);
          setSelectedRoleId((current) => current ?? res.items?.[0]?.id ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setNotification({
            type: "error",
            message: err instanceof Error ? err.message : "Gagal memuat daftar role.",
          });
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [request]);

  const selectedRole = React.useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) ?? null;
  }, [roles, selectedRoleId]);

  const [prevSelectedRoleId, setPrevSelectedRoleId] = React.useState<number | null>(null);
  if (selectedRoleId !== prevSelectedRoleId) {
    setPrevSelectedRoleId(selectedRoleId);
    if (selectedRole) {
      setName(selectedRole.name);
      setDescription(selectedRole.description ?? "");
      setFleetRole(selectedRole.fleetRole);
      setScopeType(
        selectedRole.key === "regional-head"
          ? "Region"
          : selectedRole.key === "branch-manager" || selectedRole.key === "staff" || !selectedRole.defaultScopeAll
            ? "Site"
            : "All sites",
      );
      setIsActive(selectedRole.isActive);
      setPermissions(new Set(selectedRole.permissions));
    }
  }

  // Dashboard & Menu Counts for selected role
  const totalDashboards = 10;
  const totalMenus = 45;
  const activeDashboardsCount = React.useMemo(() => {
    return PERMISSION_CATALOG.filter(
      (d) =>
        (d.permission && permissions.has(d.permission)) ||
        d.menus.some((m) => permissions.has(m.permission)),
    ).length;
  }, [permissions]);

  const activeMenusCount = React.useMemo(() => {
    let count = 0;
    PERMISSION_CATALOG.forEach((d) => {
      d.menus.forEach((m) => {
        if (permissions.has(m.permission)) count++;
      });
    });
    return count;
  }, [permissions]);

  // Dashboard & Menu Counts for new role dialog
  const newActiveDashCount = React.useMemo(() => {
    return PERMISSION_CATALOG.filter(
      (d) =>
        (d.permission && newPermissions.has(d.permission)) ||
        d.menus.some((m) => newPermissions.has(m.permission)),
    ).length;
  }, [newPermissions]);

  const newActiveMenuCount = React.useMemo(() => {
    let count = 0;
    PERMISSION_CATALOG.forEach((d) => {
      d.menus.forEach((m) => {
        if (newPermissions.has(m.permission)) count++;
      });
    });
    return count;
  }, [newPermissions]);

  const handleTogglePermission = (perm: PermissionKey, enabled: boolean) => {
    setPermissions((prev) => {
      if (perm.endsWith(".overview.view") && !enabled) return prev;
      const next = new Set(prev);
      const matchingDashboard = PERMISSION_CATALOG.find((d) => d.permission === perm);
      const parentDashboard = PERMISSION_CATALOG.find((d) =>
        d.menus.some((m) => m.permission === perm),
      );

      if (matchingDashboard) {
        if (enabled) {
          next.add(perm);
          matchingDashboard.menus.forEach((m) => next.add(m.permission));
        } else {
          next.delete(perm);
          matchingDashboard.menus.forEach((m) => next.delete(m.permission));
        }
      } else if (parentDashboard) {
        if (enabled) {
          next.add(perm);
          if (parentDashboard.permission) next.add(parentDashboard.permission);
        } else {
          next.delete(perm);
        }
      } else {
        if (enabled) next.add(perm);
        else next.delete(perm);
      }

      return next;
    });
  };

  const handleToggleNewPermission = (perm: PermissionKey, enabled: boolean) => {
    setNewPermissions((prev) => {
      if (perm.endsWith(".overview.view") && !enabled) return prev;
      const next = new Set(prev);
      const matchingDashboard = PERMISSION_CATALOG.find((d) => d.permission === perm);
      const parentDashboard = PERMISSION_CATALOG.find((d) =>
        d.menus.some((m) => m.permission === perm),
      );

      if (matchingDashboard) {
        if (enabled) {
          next.add(perm);
          matchingDashboard.menus.forEach((m) => next.add(m.permission));
        } else {
          next.delete(perm);
          matchingDashboard.menus.forEach((m) => next.delete(m.permission));
        }
      } else if (parentDashboard) {
        if (enabled) {
          next.add(perm);
          if (parentDashboard.permission) next.add(parentDashboard.permission);
        } else {
          next.delete(perm);
        }
      } else {
        if (enabled) next.add(perm);
        else next.delete(perm);
      }

      return next;
    });
  };

  // Diff calculation for updating the role
  const roleDiffs: AuditRowDraft[] = React.useMemo(() => {
    if (!selectedRole) return [];
    const before: RoleSnapshot = {
      name: selectedRole.name,
      description: selectedRole.description,
      fleetRole: selectedRole.fleetRole,
      defaultScopeAll: selectedRole.defaultScopeAll,
      isActive: selectedRole.isActive,
      permissions: selectedRole.permissions,
    };
    return diffRole(before, {
      name,
      description: description || null,
      fleetRole,
      defaultScopeAll: scopeType === "All sites",
      isActive,
      permissions: Array.from(permissions),
    });
  }, [selectedRole, name, description, fleetRole, scopeType, isActive, permissions]);

  const handleSaveClick = () => {
    if (!selectedRole) return;
    if (roleDiffs.length === 0) {
      setNotification({
        type: "info",
        message: "Tidak ada perubahan konfigurasi yang perlu disimpan.",
      });
      return;
    }
    setConfirmSaveOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await request(`/api/access/roles/${selectedRole.id}`, {
        method: "PUT",
        body: JSON.stringify({
          expectedVersion: selectedRole.version,
          name,
          description: description || null,
          fleetRole,
          defaultScopeAll: scopeType === "All sites",
          isActive,
          permissions: Array.from(permissions),
        }),
      });

      setConfirmSaveOpen(false);
      setNotification({
        type: "success",
        message: `Template role "${name}" berhasil diperbarui.`,
      });

      await loadRoles();
    } catch (err) {
      console.error("[UPDATE_ROLE_ERROR]", err);
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memperbarui role.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Edit role detail modal handlers
  const handleOpenEditInfo = () => {
    if (!selectedRole) return;
    setEditName(name);
    setEditDesc(description);
    setEditFleetRole(fleetRole);
    setEditErrors(null);
    setEditInfoOpen(true);
  };

  const handleSaveEditInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; description?: string } = {};
    if (!editName.trim() || editName.trim().length < 2) {
      errors.name = "Nama role wajib diisi (minimal 2 karakter)";
    }
    if (!editDesc.trim() || editDesc.trim().length < 2) {
      errors.description = "Deskripsi role wajib diisi (minimal 2 karakter)";
    }
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setName(editName.trim());
    setDescription(editDesc.trim());
    if (!selectedRole?.isSystem) {
      setFleetRole(editFleetRole);
    }
    setEditInfoOpen(false);
  };

  // Delete role handlers
  const handleDeleteClick = () => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      setNotification({
        type: "error",
        message: `Role "${selectedRole.name}" adalah role bawaan sistem dan tidak dapat dihapus.`,
      });
      return;
    }
    if (selectedRole.userCount > 0) {
      setNotification({
        type: "error",
        message: `Role "${selectedRole.name}" tidak dapat dihapus karena masih digunakan oleh ${selectedRole.userCount} pengguna aktif. Pindahkan pengguna ke role lain terlebih dahulu.`,
      });
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedRole) return;
    try {
      setDeleting(true);
      await request(`/api/access/roles/${selectedRole.id}`, {
        method: "DELETE",
      });
      setDeleteConfirmOpen(false);
      setNotification({
        type: "success",
        message: `Template role "${selectedRole.name}" berhasil dihapus.`,
      });
      await loadRoles();
      setSelectedRoleId(null);
    } catch (err) {
      console.error("[DELETE_ROLE_ERROR]", err);
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus role.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Create role modal handler
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateModalError(null);
    const errs: { name?: string; description?: string } = {};
    if (!newName.trim() || newName.trim().length < 2) {
      errs.name = "Nama role wajib diisi (minimal 2 karakter)";
    }
    if (!newDesc.trim() || newDesc.trim().length < 2) {
      errs.description = "Deskripsi role wajib diisi (minimal 2 karakter)";
    }
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      setCreateModalError("Silakan lengkapi kolom yang bertanda merah di bawah ini.");
      return;
    }

    try {
      setSaving(true);
      const generatedKey = newName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 35);

      const created = await request<{ role: RoleListItem }>("/api/access/roles", {
        method: "POST",
        body: JSON.stringify({
          key: generatedKey || `role-${Date.now()}`,
          name: newName.trim(),
          description: newDesc.trim() || null,
          fleetRole: newFleetRole,
          defaultScopeAll: newScopeType === "All sites",
          permissions: Array.from(newPermissions),
        }),
      });

      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setCreateErrors(null);
      setCreateModalError(null);
      setNewPermissions(new Set(ALL_DASHBOARD_MENU_PERMISSIONS));
      setNotification({
        type: "success",
        message: `Template role "${newName}" berhasil dibuat.`,
      });

      await loadRoles();
      if (created.role) {
        setSelectedRoleId(created.role.id);
      }
    } catch (err) {
      console.error("[CREATE_ROLE_ERROR]", err);
      setCreateModalError(
        err instanceof Error ? err.message : "Gagal membuat template role.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AccessRolesSkeleton />;
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : notification.type === "info"
                ? "bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                : "bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Role Templates List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Roles
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Template akses bawaan sistem.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setNewName("");
                setNewDesc("");
                setNewScopeType("Site");
                setNewPermissions(new Set(ALL_DASHBOARD_MENU_PERMISSIONS));
                const allExpanded: Record<string, boolean> = {};
                PERMISSION_CATALOG.forEach((d) => {
                  allExpanded[d.id] = true;
                });
                setNewExpanded(allExpanded);
                setCreateErrors(null);
                setCreateModalError(null);
                setCreateOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah template
            </Button>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              Role templates
            </div>

            {roles.map((r) => {
              const isSelected = selectedRoleId === r.id;
              const rScope =
                r.key === "regional-head"
                  ? "Region"
                  : r.key === "branch-manager" || r.key === "staff" || !r.defaultScopeAll
                    ? "Site"
                    : "All sites";

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {r.name}
                    </span>
                    {r.isSystem && (
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        <Lock className="h-2.5 w-2.5" />
                        Sistem
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {r.userCount} user · {rScope}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Role Template Editor */}
        <div className="lg:col-span-8">
          {selectedRole ? (
            <Card className="p-6 space-y-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              {/* Header Title & Status Switch */}
              <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {name || selectedRole.name}
                    </h3>
                    {selectedRole.isSystem ? (
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        <Lock className="h-2.5 w-2.5" />
                        Role Sistem
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        Custom Role
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <Label htmlFor="role-description-input" className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Deskripsi template:
                    </Label>
                    <Input
                      id="role-description-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Masukkan deskripsi template role..."
                      className="text-xs h-8 max-w-xl bg-zinc-50/70 hover:bg-zinc-50 focus:bg-white dark:bg-zinc-900/60 dark:hover:bg-zinc-900 dark:focus:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditInfo}
                    className="h-8 text-xs gap-1.5 cursor-pointer"
                    title="Ubah nama, deskripsi, atau kategori role"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit role
                  </Button>

                  {!selectedRole.isSystem && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteClick}
                      className="h-8 text-xs gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/60 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Hapus template role ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus role
                    </Button>
                  )}

                  <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                    <Label htmlFor="role-active-switch" className="text-xs">
                      {isActive ? "Aktif" : "Nonaktif"}
                    </Label>
                    <Switch
                      id="role-active-switch"
                      checked={isActive}
                      disabled={selectedRole.isSystem || saving}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </div>
              </div>

              {/* 3 KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Dashboard Bawaan
                  </span>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {activeDashboardsCount}
                    </span>
                    <span className="text-zinc-400">dari {totalDashboards} dashboard</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(activeDashboardsCount / totalDashboards) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Menu Bawaan
                  </span>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {activeMenusCount}
                    </span>
                    <span className="text-zinc-400">dari {totalMenus} menu</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(activeMenusCount / totalMenus) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Dipakai
                  </span>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedRole.userCount} <span className="text-xs font-normal text-zinc-400">user</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedRole.userCount} Active
                  </div>
                </div>
              </div>

              {/* Tipe data scope 3 cards */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tipe data scope
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(["All sites", "Region", "Site"] as const).map((mode) => {
                    const isSelected = scopeType === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={selectedRole.isSystem}
                        onClick={() => !selectedRole.isSystem && setScopeType(mode)}
                        className={`flex items-center gap-2.5 h-10 px-3.5 rounded-lg border text-xs font-semibold text-left transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-2xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                        } ${selectedRole.isSystem ? "pointer-events-none opacity-80" : "cursor-pointer"}`}
                      >
                        <CustomRadio checked={isSelected} disabled={selectedRole.isSystem} />
                        <span className="truncate">{mode}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {scopeType === "All sites"
                    ? "Melihat seluruh 7 region dan 40 site. Site baru otomatis ikut."
                    : scopeType === "Region"
                      ? "Melihat seluruh site di region terpilih. Bawaan untuk Regional Head."
                      : "Hanya site yang dipilih. Bawaan untuk Branch Manager dan Staff."}
                </p>
              </div>

              {/* Dashboard & Menu Header & Tree */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Dashboard &amp; Menu
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Nyalakan dashboard untuk role ini, lalu atur hak akses menunya.
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {activeDashboardsCount} dashboard · {activeMenusCount} menu aktif
                  </span>
                </div>

                <PermissionTree
                  effectivePermissions={permissions}
                  onChangePermission={handleTogglePermission}
                  disabled={saving}
                />
              </div>

              {/* Save Button Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-xs text-zinc-500">
                  {roleDiffs.length > 0 ? (
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      Ada {roleDiffs.length} perubahan belum disimpan
                    </span>
                  ) : (
                    <span>Tidak ada perubahan</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedRole) {
                        setName(selectedRole.name);
                        setDescription(selectedRole.description ?? "");
                        setFleetRole(selectedRole.fleetRole);
                        setScopeType(
                          selectedRole.key === "regional-head"
                            ? "Region"
                            : selectedRole.key === "branch-manager" || selectedRole.key === "staff" || !selectedRole.defaultScopeAll
                              ? "Site"
                              : "All sites",
                        );
                        setIsActive(selectedRole.isActive);
                        setPermissions(new Set(selectedRole.permissions));
                      }
                    }}
                    disabled={saving || roleDiffs.length === 0}
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveClick}
                    disabled={saving || !name.trim() || roleDiffs.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Menyimpan..." : "Simpan perubahan"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-72 flex items-center justify-center border border-dashed rounded-lg">
              <p className="text-xs text-zinc-500">Pilih salah satu role untuk mengedit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Edit Detail Role */}
      <Dialog open={editInfoOpen} onOpenChange={setEditInfoOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <form onSubmit={handleSaveEditInfo} className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-4">
            <DialogHeader className="shrink-0 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Edit Detail Role
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 py-2">
              {/* Nama role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama role
                </Label>
                <Input
                  value={editName}
                  disabled={selectedRole?.isSystem}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editErrors?.name) setEditErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Nama role"
                  className={cn(
                    "text-xs h-9.5",
                    editErrors?.name && "border-rose-500 focus-visible:ring-rose-500",
                    selectedRole?.isSystem && "opacity-80 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed",
                  )}
                />
                {selectedRole?.isSystem && (
                  <p className="text-[10px] text-zinc-400">
                    Nama role bawaan sistem tidak dapat diubah.
                  </p>
                )}
                {editErrors?.name && (
                  <p className="text-[10px] text-rose-500 font-medium">
                    {editErrors.name}
                  </p>
                )}
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Deskripsi
                </Label>
                <Input
                  value={editDesc}
                  onChange={(e) => {
                    setEditDesc(e.target.value);
                    if (editErrors?.description) setEditErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Siapa yang memakai role ini"
                  className={cn(
                    "text-xs h-9.5",
                    editErrors?.description && "border-rose-500 focus-visible:ring-rose-500",
                  )}
                />
                {editErrors?.description && (
                  <p className="text-[10px] text-rose-500 font-medium">
                    {editErrors.description}
                  </p>
                )}
              </div>

              {/* Kategori Wewenang (Fleet Role) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Kategori Wewenang
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    role="radio"
                    disabled={selectedRole?.isSystem}
                    aria-checked={editFleetRole === "management"}
                    onClick={() => !selectedRole?.isSystem && setEditFleetRole("management")}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                      editFleetRole === "management"
                        ? "border-blue-500 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-2xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300"
                    } ${selectedRole?.isSystem ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <CustomRadio checked={editFleetRole === "management"} className="mt-0.5" disabled={selectedRole?.isSystem} />
                    <div className="min-w-0">
                      <div>Eksekutif &amp; Bisnis</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Overview, SLA, dan analitik</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    disabled={selectedRole?.isSystem}
                    aria-checked={editFleetRole === "internal"}
                    onClick={() => !selectedRole?.isSystem && setEditFleetRole("internal")}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                      editFleetRole === "internal"
                        ? "border-blue-500 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-2xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300"
                    } ${selectedRole?.isSystem ? "opacity-80 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <CustomRadio checked={editFleetRole === "internal"} className="mt-0.5" disabled={selectedRole?.isSystem} />
                    <div className="min-w-0">
                      <div>Operasional IT</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Akses penuh menu teknis &amp; FSD</div>
                    </div>
                  </button>
                </div>
                {selectedRole?.isSystem && (
                  <p className="text-[10px] text-zinc-400">
                    Kategori wewenang role sistem tidak dapat diubah.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="shrink-0 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditInfoOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Terapkan Detail
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Role */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              Hapus Template Role?
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 pt-2 leading-relaxed">
            Apakah Anda yakin ingin menghapus template role{" "}
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              &quot;{selectedRole?.name}&quot;
            </span>
            ? Template role ini akan dihapus secara permanen dari sistem dan tidak dapat dipulihkan.
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteConfirmed}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? "Menghapus..." : "Hapus Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Simpan Perubahan Role */}
      <ConfirmChangesDialog
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title={`Simpan Perubahan Role "${name}"?`}
        diffs={roleDiffs}
        onConfirm={handleUpdateRole}
        isLoading={saving}
      />

      {/* Modal Tambah Template */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <form onSubmit={handleCreateRole} className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-4">
            <DialogHeader className="shrink-0 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Tambah template
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
              {/* Alert Error Box Di Dalam Modal */}
              {createModalError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <span className="font-medium">{createModalError}</span>
                </div>
              )}

              {/* Nama role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nama role
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (createErrors?.name) setCreateErrors((prev) => ({ ...prev, name: undefined }));
                    if (createModalError) setCreateModalError(null);
                  }}
                  placeholder="Contoh: Auditor Internal"
                  className={cn(
                    "text-xs h-9.5",
                    createErrors?.name && "border-rose-500 focus-visible:ring-rose-500 ring-rose-500/20",
                  )}
                />
                {createErrors?.name && (
                  <p className="text-[10px] text-rose-500 font-medium">
                    {createErrors.name}
                  </p>
                )}
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Deskripsi
                </Label>
                <Input
                  value={newDesc}
                  onChange={(e) => {
                    setNewDesc(e.target.value);
                    if (createErrors?.description) setCreateErrors((prev) => ({ ...prev, description: undefined }));
                    if (createModalError) setCreateModalError(null);
                  }}
                  placeholder="Siapa yang memakai role ini"
                  className={cn(
                    "text-xs h-9.5",
                    createErrors?.description && "border-rose-500 focus-visible:ring-rose-500 ring-rose-500/20",
                  )}
                />
                {createErrors?.description && (
                  <p className="text-[10px] text-rose-500 font-medium">
                    {createErrors.description}
                  </p>
                )}
              </div>

              {/* Kategori Wewenang (Fleet Role) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Kategori Wewenang
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={newFleetRole === "management"}
                    onClick={() => setNewFleetRole("management")}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs font-semibold text-left cursor-pointer transition-all ${
                      newFleetRole === "management"
                        ? "border-blue-500 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-2xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <CustomRadio checked={newFleetRole === "management"} className="mt-0.5" />
                    <div className="min-w-0">
                      <div>Eksekutif &amp; Bisnis</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Overview, SLA, dan analitik</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={newFleetRole === "internal"}
                    onClick={() => setNewFleetRole("internal")}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs font-semibold text-left cursor-pointer transition-all ${
                      newFleetRole === "internal"
                        ? "border-blue-500 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-2xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <CustomRadio checked={newFleetRole === "internal"} className="mt-0.5" />
                    <div className="min-w-0">
                      <div>Operasional IT</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Akses penuh menu teknis &amp; FSD</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tipe data scope (3 cards) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tipe data scope bawaan
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(["All sites", "Region", "Site"] as const).map((mode) => {
                    const isSelected = newScopeType === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setNewScopeType(mode)}
                        className={`flex items-center gap-2.5 h-10 px-3.5 rounded-lg border text-xs font-semibold text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 dark:border-blue-600 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 shadow-2xs"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <CustomRadio checked={isSelected} />
                        <span className="truncate">{mode}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-400">
                  {newScopeType === "All sites"
                    ? "Semua 7 region & 40 site"
                    : newScopeType === "Region"
                      ? "Sesuai region penempatan"
                      : "Sesuai cabang penempatan"}
                </p>
              </div>

              {/* Dashboard & menu */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Dashboard &amp; menu
                  </Label>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    {newActiveDashCount} dashboard · {newActiveMenuCount} menu aktif
                  </span>
                </div>

                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 p-1 bg-white dark:bg-zinc-950/40">
                  {PERMISSION_CATALOG.map((dash) => {
                    const isDashOpen = !!newExpanded[dash.id];
                    const isDashActive = dash.permission
                      ? newPermissions.has(dash.permission)
                      : false;
                    const activeChildCount = dash.menus.filter((m) =>
                      newPermissions.has(m.permission),
                    ).length;

                    return (
                      <div key={dash.id} className="p-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setNewExpanded((prev) => ({
                                ...prev,
                                [dash.id]: !prev[dash.id],
                              }))
                            }
                            className="flex items-center gap-2 text-left cursor-pointer"
                          >
                            <ChevronRight
                              className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
                                isDashOpen ? "rotate-90 text-zinc-600 dark:text-zinc-300" : ""
                              }`}
                            />
                            <div>
                              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                {dash.name}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                {isDashActive
                                  ? `${activeChildCount} dari ${dash.menus.length} menu aktif`
                                  : "Tidak aktif"}
                              </div>
                            </div>
                          </button>

                          {dash.permission && (
                            <Switch
                              checked={isDashActive}
                              onCheckedChange={(checked) =>
                                handleToggleNewPermission(dash.permission!, checked)
                              }
                            />
                          )}
                        </div>

                        {/* Expanded child menus */}
                        {isDashOpen && isDashActive && dash.menus.length > 0 && (
                          <div className="pl-6 pt-1 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/60 mt-1.5">
                            {dash.menus.map((m) => {
                              const isOverview = m.key === "overview" || m.permission.endsWith(".overview.view");
                              const isMChecked = isOverview ? isDashActive : (isDashActive && newPermissions.has(m.permission));
                              return (
                                <div
                                  key={m.key}
                                  className="flex items-center justify-between py-1"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                      {m.name}
                                    </span>
                                    {isOverview && (
                                      <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                                        Wajib
                                      </span>
                                    )}
                                  </div>
                                  <Switch
                                    checked={isMChecked}
                                    disabled={isOverview || !isDashActive}
                                    onCheckedChange={(c) => {
                                      if (isOverview) return;
                                      handleToggleNewPermission(m.permission, c);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || !newName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? "Membuat..." : "Buat template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
