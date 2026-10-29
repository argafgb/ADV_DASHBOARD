"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AccessStatusPill, CustomBadge } from "./AccessStatusPill";
import { PermissionTree } from "./PermissionTree";
import { ScopeEditor, type ScopeEditorValue } from "./ScopeEditor";
import { ConfirmChangesDialog } from "./ConfirmChangesDialog";
import { diffUserAccess, type AuditRowDraft } from "@/lib/access/access-diff";
import { togglePermissionWithRules } from "../utils/toggle-rules";
import type {
  UserDetailResponse,
  RoleListItem,
  RegionMetadata,
} from "../types/access.types";
import { PERMISSION_KEYS, type PermissionKey } from "@/lib/access/catalog";
import { requiresBranchScope } from "@/lib/access/data-scope";
import { branchNameAliases } from "@/lib/access/branch-options";
import { expandRoleDashboardMenus, resolveEffectiveAccess } from "@/lib/access/effective-access";
import {
  Shield,
  AlertTriangle,
  Lock,
  Building,
  Briefcase,
} from "lucide-react";

interface UserAccessEditorProps {
  detail: UserDetailResponse;
  roles: RoleListItem[];
  availableBranches: string[];
  availableRegions: RegionMetadata[];
  onSave: (desired: {
    status: "active" | "suspended";
    roleKey: string | null;
    overrides: { permission: PermissionKey; effect: "grant" | "revoke" }[];
    scope: ScopeEditorValue;
    expectedVersion?: number | null;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserAccessEditor({
  detail,
  roles,
  availableBranches,
  availableRegions,
  onSave,
  onCancel,
  isLoading = false,
}: UserAccessEditorProps) {
  const { employee, access, canEdit } = detail;

  const effectiveInitialRole = access.roleKey || "staff";
  const isInitialStaff = requiresBranchScope(effectiveInitialRole);
  const initialScopeAll = isInitialStaff ? false : (access.scope?.all ?? false);
  const homeBranch = employee?.branch?.trim().toUpperCase() ?? "";
  const mappedHomeRegions = availableRegions
    .filter((region) => region.isActive && region.branches.some((branch) => branchNameAliases(homeBranch).includes(branch.toUpperCase())))
    .map((region) => region.code);
  const initialBranches = homeBranch && (effectiveInitialRole === "staff" || effectiveInitialRole === "branch-manager")
    ? [homeBranch] : access.scope?.branches ?? [];
  const initialRegions = homeBranch && effectiveInitialRole === "regional-head" && mappedHomeRegions.length > 0
    ? mappedHomeRegions : access.scope?.regions ?? [];

  // Local draft state
  const [status, setStatus] = React.useState<"active" | "suspended">(
    access.status ?? "active",
  );
  const [roleKey, setRoleKey] = React.useState<string | null>(effectiveInitialRole);
  const [overrides, setOverrides] = React.useState<
    { permission: PermissionKey; effect: "grant" | "revoke" }[]
  >(access.overrides ?? []);
  const [scope, setScope] = React.useState<ScopeEditorValue>({
    all: initialScopeAll,
    departments: access.scope?.departments ?? [],
    branches: initialBranches,
    regions: initialRegions,
  });

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // Sync draft when user detail changes (React recommended pattern: state adjustment during render)
  const [prevAccess, setPrevAccess] = React.useState(access);
  if (access !== prevAccess) {
    setPrevAccess(access);
    const nextRole = access.roleKey || "staff";
    const nextIsStaff = requiresBranchScope(nextRole);
    setStatus(access.status ?? "active");
    setRoleKey(nextRole);
    setOverrides(access.overrides ?? []);
    setScope({
      all: nextIsStaff ? false : (access.scope?.all ?? false),
      departments: access.scope?.departments ?? [],
      branches: homeBranch && (nextRole === "staff" || nextRole === "branch-manager") ? [homeBranch] : access.scope?.branches ?? [],
      regions: homeBranch && nextRole === "regional-head" && mappedHomeRegions.length > 0 ? mappedHomeRegions : access.scope?.regions ?? [],
    });
  }

  const selectedRole = React.useMemo(() => {
    return roles.find((r) => r.key === roleKey) ?? null;
  }, [roles, roleKey]);

  // Role default permissions set
  const roleDefaultPerms = React.useMemo(() => {
    return expandRoleDashboardMenus(selectedRole?.permissions ?? []);
  }, [selectedRole]);

  // Compute effective permissions for draft
  const effectivePerms = React.useMemo(() => {
    return resolveEffectiveAccess({
      status,
      role: selectedRole ? { key: selectedRole.key, isActive: selectedRole.isActive, permissions: roleDefaultPerms } : null,
      overrides: overrides.map((o) => ({ permissionKey: o.permission, effect: o.effect })),
    });
  }, [status, selectedRole, roleDefaultPerms, overrides]);

  const handleTogglePermission = (perm: PermissionKey, enabled: boolean) => {
    if (roleKey === "it-admin" && perm.startsWith("access.")) return;
    const nextOverrides = togglePermissionWithRules(
      effectivePerms,
      roleDefaultPerms,
      perm,
      enabled,
    );
    setOverrides(nextOverrides);
  };

  const handleRoleChange = (newKey: string) => {
    const chosenRole = newKey || "staff";
    setRoleKey(chosenRole);
    // Overrides dinolkan kembali saat role diganti agar mengikuti bawaan role baru
    setOverrides([]);
    const r = roles.find((item) => item.key === chosenRole);
    if (r) {
      if (r.key === "regional-head") {
        setScope((prev) => ({
          ...prev,
          all: false,
          branches: [],
          regions: mappedHomeRegions.length > 0 ? mappedHomeRegions : prev.regions,
        }));
      } else if (r.key === "branch-manager" || r.key === "staff") {
        setScope((prev) => ({
          ...prev,
          all: false,
          regions: [],
          branches: homeBranch ? [homeBranch] : prev.branches,
        }));
      } else if (r.defaultScopeAll) {
        setScope((prev) => ({ ...prev, all: true, branches: [], regions: [] }));
      } else {
        setScope((prev) => ({
          ...prev,
          all: false,
          regions: [],
          branches: prev.branches,
        }));
      }
    }
  };

  // Hitung perbedaan perubahan untuk modal konfirmasi
  const diffs = React.useMemo<AuditRowDraft[]>(() => {
    const before = access.enrolled
      ? {
          status: access.status,
          roleKey: access.roleKey,
          overrides: access.overrides,
          scope: access.scope,
        }
      : null;

    return diffUserAccess(before, {
      status,
      roleKey,
      overrides,
      scope,
    });
  }, [access, status, roleKey, overrides, scope]);

  const isSelfOrLocked = !canEdit.ok;

  const handleSaveConfirmed = async () => {
    await onSave({
      status,
      roleKey,
      overrides,
      scope,
      expectedVersion: access.enrolled ? access.version : null,
    });
    setConfirmOpen(false);
  };

  const isHrInactive = Boolean(employee && !employee.employeeActive);

  return (
    <>
      <Card className="flex flex-col border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        {/* Top Identity Card */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          {/* Lock notice */}
          {isSelfOrLocked && (
            <div className="mb-4 flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800 text-xs font-medium">
              <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{canEdit.reason ?? "Anda tidak dapat mengubah data ini."}</span>
            </div>
          )}

          {/* HR Inactive Warning */}
          {isHrInactive && (
            <div className="mb-4 flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800 text-xs font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>
                Karyawan ini berstatus NONAKTIF di sistem HRD. Akun tidak dapat
                diaktifkan kembali sebelum status HR aktif.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50 uppercase">
                  {employee?.name ?? access.updatedBy ?? "Pengguna"}
                </h1>
                <AccessStatusPill status={access.enrolled ? status : "pending"} />
                {overrides.length > 0 && <CustomBadge />}
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap pt-0.5">
                <span className="tabular-nums bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  NIK: {employee?.nik ?? "Tidak diketahui"}
                </span>
                {employee?.codeDivision && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-zinc-400" />
                    Divisi: {employee.codeDivision}
                  </span>
                )}
                {employee?.codeDepartment && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                    Dept: {employee.codeDepartment}
                  </span>
                )}
              </div>
            </div>

            {/* Status toggle action */}
            {!isSelfOrLocked && (
              <div>
                {status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatus("suspended")}
                    disabled={isLoading}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:hover:bg-red-950/30 text-xs"
                  >
                    Suspend Akses
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatus("active")}
                    disabled={isLoading || isHrInactive}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/60 dark:hover:bg-emerald-950/30 text-xs"
                  >
                    Aktifkan Akses
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Body */}
        <div className="p-5 space-y-6">
          {/* Role Selection Section */}
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Label
              htmlFor="user-role-select"
              className="text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Peran Pengguna (Role)
            </Label>
            <Select
              value={roleKey ?? "NONE"}
              onValueChange={(val) => handleRoleChange(val === "NONE" || !val ? "" : val)}
              disabled={isSelfOrLocked || isLoading}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="-- Pilih Peran Pengguna --">
                  {selectedRole ? selectedRole.name : "-- Pilih Peran Pengguna --"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">-- Belum Menetapkan Peran --</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!roleKey && status === "active" && (
              <div className="flex items-center gap-1.5 p-2 rounded-md bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Pilih peran (role) untuk pengguna sebelum menyimpan agar izin akses dapat diberikan.</span>
              </div>
            )}
          </div>

          {/* Scope Editor */}
          <ScopeEditor
            key={roleKey}
            allowAllSites={!requiresBranchScope(roleKey)}
            initialMode={roleKey === "regional-head" ? "Region" : "Site"}
            lockedLocation={Boolean(homeBranch && requiresBranchScope(roleKey) && roleKey !== "regional-head")}
            value={scope}
            onChange={setScope}
            availableBranches={availableBranches}
            availableRegions={availableRegions}
            disabled={isSelfOrLocked || isLoading}
          />

          {/* Permissions Tree */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Hak Akses Dashboard &amp; Menu
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Saklar izin yang diubah dari role bawaan akan ditandai dengan badge{" "}
                  <span className="font-bold">Custom</span>.
                </p>
              </div>
              {overrides.length > 0 && !isSelfOrLocked && (
                <button
                  type="button"
                  onClick={() => setOverrides([])}
                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                >
                  Kembalikan ke default role
                </button>
              )}
            </div>

            <PermissionTree
              blockedPermissions={roleKey === "it-admin"
                ? new Set(PERMISSION_KEYS.filter((permission) => permission.startsWith("access.")))
                : undefined}
              effectivePermissions={effectivePerms}
              roleDefaultPermissions={roleDefaultPerms}
              onChangePermission={handleTogglePermission}
              disabled={isSelfOrLocked || isLoading || status === "suspended"}
              isItDivision={
                employee?.codeDivision?.toUpperCase() === "DIV-WSS" ||
                employee?.codeDivision?.toUpperCase() === "DIV-IT" ||
                roleKey === "it-product" ||
                roleKey === "it-admin"
              }
            />
          </div>
        </div>

        {/* Sticky Bottom Actions Bar */}
        {!isSelfOrLocked && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between">
            <div className="text-xs text-zinc-500">
              {diffs.length > 0 ? (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Ada {diffs.length} perubahan belum disimpan
                </span>
              ) : (
                <span>Tidak ada perubahan</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={isLoading || diffs.length === 0 || (status === "active" && !roleKey) || (!scope.all && scope.branches.length === 0 && scope.regions.length === 0)}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                title={status === "active" && !roleKey ? "Pilih peran pengguna terlebih dahulu" : undefined}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmChangesDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        diffs={diffs}
        onConfirm={handleSaveConfirmed}
        isLoading={isLoading}
      />
    </>
  );
}
