"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomBadge } from "./AccessStatusPill";
import { PERMISSION_CATALOG, type PermissionKey } from "@/lib/access/catalog";
import {
  Shield,
  ChevronRight,
  Headset,
  Wrench,
  ClipboardList,
  Bug,
  BookOpen,
  Activity,
  Globe,
  ShieldAlert,
  Clock,
  UserCog,
  type LucideIcon,
} from "lucide-react";

interface PermissionTreeProps {
  effectivePermissions: Set<string>;
  roleDefaultPermissions?: Set<string>;
  onChangePermission?: (key: PermissionKey, enabled: boolean) => void;
  disabled?: boolean;
    isItDivision?: boolean;
    blockedPermissions?: ReadonlySet<string>;
}

function getDashboardIcon(id: string): LucideIcon {
  switch (id) {
    case "helpdesk":
      return Headset;
    case "asset-pm":
      return Wrench;
    case "pic-monitoring":
      return ClipboardList;
    case "bug-tracker":
      return Bug;
    case "learning-growth":
      return BookOpen;
    case "server-performance":
      return Activity;
    case "network-performance":
      return Globe;
    case "process-risk":
      return ShieldAlert;
    case "overtime":
      return Clock;
    case "access-management":
      return UserCog;
    default:
      return Shield;
  }
}

export function PermissionTree({
  effectivePermissions,
  roleDefaultPermissions,
  onChangePermission,
  disabled = false,
  isItDivision = true,
  blockedPermissions = new Set(),
}: PermissionTreeProps) {
  // By default, all dashboard groups are collapsed (closed)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? true),
    }));
  };

  return (
    <div className="space-y-2.5">
      {PERMISSION_CATALOG.map((group) => {
        // True by default so accordions start closed
        const isCollapsed = collapsedGroups[group.id] ?? true;
        const Icon = getDashboardIcon(group.id);
        const isDashboardActive = group.permission
          ? effectivePermissions.has(group.permission)
          : true;

        const isDashCustom =
          group.permission &&
          roleDefaultPermissions &&
          isDashboardActive !== roleDefaultPermissions.has(group.permission);

        const activeChildCount = group.menus.filter(
          (m) => isDashboardActive && effectivePermissions.has(m.permission)
        ).length;

        return (
          <div
            key={group.id}
            className="rounded-lg border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/50 shadow-2xs transition-colors"
          >
            {/* Group Header */}
            <div
              className={`flex items-center justify-between px-3.5 py-2.5 bg-zinc-50/80 dark:bg-zinc-800/40 ${
                isCollapsed
                  ? ""
                  : "border-b border-zinc-200/80 dark:border-zinc-800"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-2.5 text-left cursor-pointer select-none min-w-0 pr-2 flex-1"
              >
                <ChevronRight
                  className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                    !isCollapsed ? "rotate-90 text-zinc-600 dark:text-zinc-300" : ""
                  }`}
                />
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isDashboardActive
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {group.name}
                    </span>
                    {group.hasSiteFilter && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                        Filter Site
                      </span>
                    )}
                    {group.id === "bug-tracker" && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800">
                        Khusus IT (DIV-WSS, DIV-IT)
                      </span>
                    )}
                    {group.category && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {group.category}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {isDashboardActive
                      ? `${activeChildCount} dari ${group.menus.length} menu aktif`
                      : "Tidak aktif"}
                  </div>
                </div>
              </button>

              {/* Master Dashboard Switch */}
              {group.permission && (
                <div className="flex items-center gap-2.5 shrink-0 pl-2">
                  {isDashCustom && <CustomBadge />}
                  <Switch
                    checked={isDashboardActive}
                     disabled={disabled || blockedPermissions.has(group.permission!) || (group.id === "bug-tracker" && !isItDivision)}
                    onCheckedChange={(checked) =>
                      onChangePermission?.(group.permission!, checked)
                    }
                    aria-label={`Aktifkan ${group.name}`}
                  />
                </div>
              )}
            </div>

            {/* Group Menus (2-column layout matching standalone) */}
            {!isCollapsed && group.menus.length > 0 && (
              <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {group.menus.map((menu) => {
                    const isOverview =
                      menu.key === "overview" ||
                      menu.permission.endsWith(".overview.view");
                    const isMenuEnabled = isOverview
                      ? isDashboardActive
                      : isDashboardActive && effectivePermissions.has(menu.permission);
                    const isCustom =
                      !isOverview &&
                      roleDefaultPermissions &&
                      effectivePermissions.has(menu.permission) !==
                        roleDefaultPermissions.has(menu.permission);

                    return (
                      <div
                        key={menu.key}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-white dark:hover:bg-zinc-800/40 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                      >
                        <div className="space-y-0.5 pr-3 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`perm-${menu.permission}`}
                              className={`text-xs font-semibold ${
                                !isDashboardActive
                                  ? "text-zinc-400 dark:text-zinc-500 cursor-default"
                                  : isMenuEnabled
                                    ? "text-zinc-800 dark:text-zinc-200 cursor-pointer"
                                    : "text-zinc-500 dark:text-zinc-400 cursor-pointer"
                              }`}
                            >
                              {menu.name}
                            </Label>
                            {isOverview && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                                Wajib Aktif
                              </span>
                            )}
                            {isCustom && <CustomBadge />}
                          </div>
                          {menu.description && (
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1">
                              {menu.description}
                            </p>
                          )}
                        </div>

                        <Switch
                          id={`perm-${menu.permission}`}
                          checked={isMenuEnabled}
                          disabled={
                            disabled ||
                            isOverview ||
                            blockedPermissions.has(menu.permission) ||
                            !isDashboardActive ||
                            (group.id === "bug-tracker" && !isItDivision)
                          }
                          onCheckedChange={(checked) => {
                            if (isOverview) return;
                            onChangePermission?.(menu.permission, checked);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
