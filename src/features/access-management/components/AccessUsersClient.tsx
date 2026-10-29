"use client";

import * as React from "react";
import { UserList, type UserSegment } from "./UserList";
import { UserAccessEditor } from "./UserAccessEditor";
import { AccessUsersSkeleton } from "./AccessSkeletons";
import { useAccessApi } from "../hooks/useAccessApi";
import type {
  EnrolledUserItem,
  RoleListItem,
  UserDetailResponse,
  MetadataResponse,
} from "../types/access.types";
import { EmptyState } from "@/components/shared/EmptyState";
import { UserCheck } from "lucide-react";

export function AccessUsersClient() {
  const { request } = useAccessApi();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [users, setUsers] = React.useState<EnrolledUserItem[]>([]);
  const [counts, setCounts] = React.useState({ all: 0, custom: 0, suspended: 0 });
  const [roles, setRoles] = React.useState<RoleListItem[]>([]);
  const [metadata, setMetadata] = React.useState<MetadataResponse | null>(null);

  const [activeSegment, setActiveSegment] = React.useState<UserSegment>("all");
  const [selectedRoleKey, setSelectedRoleKey] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const pageSize = 50;
  const [selectedNik, setSelectedNik] = React.useState<string | null>(null);
  const [userDetail, setUserDetail] = React.useState<UserDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [notification, setNotification] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Clear toast after 4s
  React.useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  React.useEffect(() => {
    let ignore = false;
    Promise.all([
      request<MetadataResponse>("/api/access/metadata"),
      request<{ items: RoleListItem[] }>("/api/access/roles"),
      request<{
        items: EnrolledUserItem[];
        total?: number;
        counts: { all: number; custom: number; suspended: number };
      }>("/api/access/users?page=1&pageSize=50"),
    ])
      .then(([metaRes, rolesRes, usersRes]) => {
        if (!ignore) {
          setMetadata(metaRes);
          setRoles(rolesRes.items ?? []);
          setUsers(usersRes.items ?? []);
          setTotal(usersRes.total ?? usersRes.items?.length ?? 0);
          setCounts(usersRes.counts ?? { all: 0, custom: 0, suspended: 0 });
          if (usersRes.items?.[0]) {
            setSelectedNik(usersRes.items[0].nik);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("[ACCESS_INIT_ERROR]", err);
          setNotification({
            type: "error",
            message: err instanceof Error ? err.message : "Gagal memuat data akses.",
          });
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [request]);

  // Nomor urut permintaan daftar user: hanya respons terbaru yang boleh
  // menulis state, supaya respons lama (ketikan sebelumnya) tidak menimpa.
  const listRequestSeq = React.useRef(0);

  // Debounce search query so typing doesn't fire requests on every keystroke
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchQuery);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users when filter/segment/page changes.
  const fetchUsersList = React.useCallback(async (targetPage = page) => {
    const seq = ++listRequestSeq.current;
    try {
      const params = new URLSearchParams();
      if (activeSegment === "suspended") params.set("status", "suspended");
      if (activeSegment === "custom") params.set("custom", "true");
      if (selectedRoleKey) params.set("roleKey", selectedRoleKey);
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
      params.set("page", String(targetPage));
      params.set("pageSize", String(pageSize));

      const res = await request<{
        items: EnrolledUserItem[];
        total?: number;
        counts: { all: number; custom: number; suspended: number };
      }>(`/api/access/users?${params.toString()}`);

      if (seq !== listRequestSeq.current) return;

      let list = res.items ?? [];
      setTotal(res.total ?? list.length);
      if (res.counts) setCounts(res.counts);

      // If user typed >= 2 characters, search employee directory and merge unenrolled
      if (debouncedSearch.trim().length >= 2) {
        try {
          const empRes = await request<{
            items: {
              nik: string;
              name: string;
              codeDivision: string | null;
              branch?: string | null;
              employeeActive: boolean;
              access: { enrolled: boolean };
            }[];
          }>(`/api/access/employees?q=${encodeURIComponent(debouncedSearch.trim())}`);

          const existingNiks = new Set(list.map((u) => u.nik));
          const unenrolled = (empRes.items ?? [])
            .filter((e) => e.employeeActive !== false && !e.access.enrolled && !existingNiks.has(e.nik))
            .map((e) => ({
              nik: e.nik,
              name: e.name,
              codeDivision: e.codeDivision,
              status: "active" as const,
              role: { key: "staff", name: "Staff" },
              hasOverrides: false,
              scopeSummary: e.branch ? `Cabang: ${e.branch}` : "Sesuai Cabang (Site)",
              updatedAt: new Date().toISOString(),
              updatedBy: null,
            }));

          list = [...list, ...unenrolled];
        } catch {
          // If directory search 503, just display enrolled users
        }
      }

      if (seq !== listRequestSeq.current) return;

      setUsers(list);
      setSelectedNik((current) =>
        list.length > 0 && (!current || !list.some((u) => u.nik === current))
          ? list[0].nik
          : current,
      );
    } catch (err) {
      console.error("[FETCH_USERS_LIST_ERROR]", err);
    }
  }, [activeSegment, selectedRoleKey, debouncedSearch, page, pageSize, request]);

  const handleSegmentChange = (seg: UserSegment) => {
    setActiveSegment(seg);
    setPage(1);
  };

  const handleRoleChange = (roleKey: string) => {
    setSelectedRoleKey(roleKey);
    setPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  // Fetch users when filter/page changes or search debounces
  React.useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      void fetchUsersList();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsersList, loading]);

  // Load selected user detail
  React.useEffect(() => {
    if (!selectedNik) {
      return;
    }

    let ignore = false;
    request<UserDetailResponse>(
      `/api/access/users/${encodeURIComponent(selectedNik)}`,
    )
      .then((res) => {
        if (!ignore) {
          setUserDetail(res);
          setLoadingDetail(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(`[LOAD_USER_DETAIL_ERROR] nik=${selectedNik}:`, err);
          setNotification({
            type: "error",
            message:
              err instanceof Error ? err.message : "Gagal memuat detail pengguna.",
          });
          setLoadingDetail(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedNik, request]);

  const handleSaveUser = async (desired: unknown) => {
    if (!selectedNik) return;
    try {
      setSaving(true);
      await request(`/api/access/users/${encodeURIComponent(selectedNik)}`, {
        method: "PUT",
        body: JSON.stringify(desired),
      });

      setNotification({
        type: "success",
        message: "Perubahan hak akses berhasil disimpan ke database.",
      });

      // Reload detail and list
      const res = await request<UserDetailResponse>(
        `/api/access/users/${encodeURIComponent(selectedNik)}`,
      );
      setUserDetail(res);
      await fetchUsersList();
    } catch (err) {
      console.error("[SAVE_USER_ERROR]", err);
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setNotification({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AccessUsersSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
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

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Pane: User List */}
        <div className="lg:col-span-4">
          <UserList
            users={users}
            counts={counts}
            roles={roles}
            selectedNik={selectedNik}
            onSelectUser={setSelectedNik}
            activeSegment={activeSegment}
            onSegmentChange={handleSegmentChange}
            selectedRoleKey={selectedRoleKey}
            onRoleChange={handleRoleChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </div>

        {/* Right Pane: User Access Editor */}
        <div className="lg:col-span-8">
          {loadingDetail || !userDetail ? (
            <div className="min-h-[500px] flex items-center justify-center border border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
              <EmptyState
                icon={UserCheck}
                title="Pilih Pengguna"
                description="Pilih salah satu pengguna pada daftar sebelah kiri untuk melihat atau mengubah hak akses."
              />
            </div>
          ) : (
            <UserAccessEditor
              detail={userDetail}
              roles={roles}
              availableBranches={metadata?.branches ?? []}
              availableRegions={metadata?.regions ?? []}
              onSave={handleSaveUser}
              onCancel={() => {
                if (selectedNik) {
                  request<UserDetailResponse>(
                    `/api/access/users/${encodeURIComponent(selectedNik)}`,
                  ).then((res) => setUserDetail(res));
                }
              }}
              isLoading={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
