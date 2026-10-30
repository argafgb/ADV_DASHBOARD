"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AccessStatusPill, CustomBadge } from "./AccessStatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import type { EnrolledUserItem, RoleListItem } from "../types/access.types";
import { Search, UserX, ChevronLeft, ChevronRight } from "lucide-react";

export type UserSegment = "all" | "custom" | "suspended";

interface UserListProps {
  users: EnrolledUserItem[];
  counts: { all: number; custom: number; suspended: number };
  roles: RoleListItem[];
  selectedNik: string | null;
  onSelectUser: (nik: string) => void;
  activeSegment: UserSegment;
  onSegmentChange: (seg: UserSegment) => void;
  selectedRoleKey: string;
  onRoleChange: (roleKey: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function UserList({
  users,
  counts,
  roles,
  selectedNik,
  onSelectUser,
  activeSegment,
  onSegmentChange,
  selectedRoleKey,
  onRoleChange,
  searchQuery,
  onSearchChange,
  page = 1,
  pageSize = 50,
  total = 0,
  onPageChange,
}: UserListProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <Card className="flex flex-col h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 space-y-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center justify-between">
            <span>Daftar Pengguna</span>
            <span className="text-xs font-normal text-zinc-500">
              {total > 0 ? `${total} pengguna` : `${users.length} pengguna`}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Pilih pengguna untuk meninjau atau mengatur hak akses.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari nama atau NIK..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>

        {/* Segment Tabs & Role Filter */}
        <div className="flex flex-col gap-2">
          {/* Segments */}
          <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => onSegmentChange("all")}
              className={`flex-1 py-1 rounded-md transition-all text-center ${
                activeSegment === "all"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Semua ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => onSegmentChange("custom")}
              className={`flex-1 py-1 rounded-md transition-all text-center ${
                activeSegment === "custom"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Custom ({counts.custom})
            </button>
            <button
              type="button"
              onClick={() => onSegmentChange("suspended")}
              className={`flex-1 py-1 rounded-md transition-all text-center ${
                activeSegment === "suspended"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Suspended ({counts.suspended})
            </button>
          </div>

          {/* Role Filter */}
          <Select
            value={selectedRoleKey || "ALL"}
            onValueChange={(val) => onRoleChange(val === "ALL" || !val ? "" : val)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Semua Role">
                {selectedRoleKey
                  ? roles.find((r) => r.key === selectedRoleKey)?.name ?? selectedRoleKey
                  : "Semua Role"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Role</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1.5">
        {users.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <EmptyState
              icon={UserX}
              title="Pengguna Tidak Ditemukan"
              description={
                searchQuery.length >= 2
                  ? `Tidak ada data karyawan yang cocok dengan "${searchQuery}".`
                  : "Tidak ada pengguna pada filter ini."
              }
            />
          </div>
        ) : (
          users.map((user) => {
            const isSelected = selectedNik === user.nik;
            return (
              <button
                key={user.nik}
                type="button"
                onClick={() => onSelectUser(user.nik)}
                className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-blue-50/80 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.hasOverrides && <CustomBadge />}
                    <AccessStatusPill status={user.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="tabular-nums">{user.nik}</span>
                  <span className="truncate max-w-36 text-right">
                    {user.role?.name ?? "Staff"}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                  {user.scopeSummary}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-500">
          <span className="text-[11px]">
            Hlm {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-7 px-2 text-xs"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
