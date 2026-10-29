"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONFIG } from "@/lib/dashboard-config";
import {
  canAccessDashboard,
  type DashboardId,
} from "@/lib/auth/dashboard-access";
import {
  X,
  Search,
  Check,
  Headset,
  ClipboardList,
  Wrench,
  ShieldAlert,
  BookOpen,
  Activity,
  Globe,
  Clock,
  TrendingUp,
  Trophy,
  AlertTriangle,
  LayoutGrid,
  Bug,
  UserCog,
  Laptop,
  Code,
} from "lucide-react";

/** Mix a hex color toward white by `amt` (0–1) — source `hexTint()`. */
export function hexTint(hex: string, amt: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return (
    "#" +
    [mix(r), mix(g), mix(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function CatalogIcon({ name, size = 18 }: { name: string; size?: number }) {
  switch (name) {
    case "headset":
      return <Headset size={size} />;
    case "clipboardlist":
      return <ClipboardList size={size} />;
    case "trend":
      return <TrendingUp size={size} />;
    case "trophy":
      return <Trophy size={size} />;
    case "alert":
      return <AlertTriangle size={size} />;
    case "wrench":
      return <Wrench size={size} />;
    case "bug":
      return <Bug size={size} />;
    case "bookopen":
      return <BookOpen size={size} />;
    case "activity":
      return <Activity size={size} />;
    case "globe":
      return <Globe size={size} />;
    case "clock":
      return <Clock size={size} />;
    case "shieldalert":
      return <ShieldAlert size={size} />;
    case "usercog":
      return <UserCog size={size} />;
    case "laptop":
      return <Laptop size={size} />;
    case "code":
      return <Code size={size} />;
    default:
      return <LayoutGrid size={size} />;
  }
}

export interface DashboardCatalogItem {
  id: DashboardId | "access-management" | string;
  name: string;
  icon: string;
  color: string;
  status: "active" | "coming_soon";
  href?: string;
}

const DASHBOARD_CATALOG: DashboardCatalogItem[] = [
  {
    id: "helpdesk",
    name: "IT & DCT Helpdesk Dashboard",
    icon: "headset",
    color: "#0284C7",
    status: "active",
    href: "/dashboard/helpdesk",
  },
  {
    id: "asset-pm",
    name: "Asset IT & PM Dashboard",
    icon: "laptop",
    color: "#D97706",
    status: "active",
    href: "/dashboard/asset-maintenance",
  },
  {
    id: "pic-monitoring",
    name: "PIC Monitoring Dashboard",
    icon: "clipboardlist",
    color: "#2563EB",
    status: "active",
    href: "http://103.76.204.104:5705/",
  },
  {
    id: "bug-tracker",
    name: "Bug & List Tracker Dashboard",
    icon: "bug",
    color: "#DC2626",
    status: "active",
    href: "http://103.76.204.104:5710/",
  },
  {
    id: "learning-growth",
    name: "Learning & Growth Dashboard",
    icon: "bookopen",
    color: "#0D9488",
    status: "active",
    href: "http://103.76.204.104:5706/",
  },
  {
    id: "server-performance",
    name: "Server Performance Dashboard",
    icon: "activity",
    color: "#7C3AED",
    status: "active",
    href: "http://103.76.204.104:5707/",
  },
  {
    id: "network-performance",
    name: "Network Performance Dashboard",
    icon: "globe",
    color: "#06B6D4",
    status: "active",
    href: "/dashboard/network-performance",
  },
  {
    id: "process-risk",
    name: "Process & Risk Dashboard",
    icon: "shieldalert",
    color: "#BE185D",
    status: "active",
    href: "http://103.76.204.104:5709/",
  },
  {
    id: "overtime",
    name: "Overtime Dashboard",
    icon: "clock",
    color: "#EA580C",
    status: "active",
    href: "http://103.76.204.104:5711/",
  },
  {
    id: "it-repair-maintenance",
    name: "IT Repair & Maintenance Dashboard",
    icon: "wrench",
    color: "#64748B",
    status: "active",
    href: "http://103.76.204.104:5712/",
  },
  {
    id: "kaldev-performance",
    name: "Kaldev Performance Dashboard",
    icon: "code",
    color: "#10B981",
    status: "active",
    href: "http://103.76.204.104:5713/",
  },
];

export function getIssuerBaseUrl(): string {
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (port === "5703") {
      return "";
    }
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }
    return `${protocol}//${hostname}:5703`;
  }
  return "http://103.76.204.104:5703";
}

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function BrowseDashboardModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const mounted = useMounted();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [authData, setAuthData] = useState<{
    user?: {
      role?: string;
      codeDivision?: string;
      allowedDashboards?: string[];
      nik?: string;
      username?: string;
    } | null;
    access?: {
      roleKey?: string;
      permissions?: string[];
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const issuerBase = getIssuerBaseUrl();
    const url = issuerBase ? `${issuerBase}/api/auth/me` : "/api/auth/me";
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setAuthData(data);
        setLoading(false);
      })
      .catch(() => {
        fetch("/api/auth/me", { credentials: "include" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            setAuthData(data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const user = authData?.user;
  const access = authData?.access;
  const role = user?.role;
  const userDivision = (user?.codeDivision || "").toUpperCase().trim();
  const isItDivision = userDivision === "DIV-WSS" || userDivision === "DIV-IT";

  const permissions = new Set(access?.permissions ?? []);
  const isSuperAdmin =
    permissions.has("*") ||
    access?.roleKey === "super_admin" ||
    access?.roleKey === "super-admin" ||
    access?.roleKey === "it-admin" ||
    access?.roleKey === "it-product";

  // Role staff, branch-manager, regional-head, maupun management standar TIDAK melihat Access Management
  const isRestrictedRole =
    !isSuperAdmin &&
    (access?.roleKey === "staff" ||
      access?.roleKey === "branch-manager" ||
      access?.roleKey === "regional-head" ||
      access?.roleKey === "management");

  const hasAccessManagementPerm =
    isSuperAdmin ||
    permissions.has("access.users.manage") ||
    permissions.has("access.roles.manage") ||
    permissions.has("access.audit.view");

  const canAccessManagement =
    isSuperAdmin ||
    (!isRestrictedRole &&
      (hasAccessManagementPerm ||
        user?.nik === "INT001" ||
        user?.username?.toLowerCase() === "int001" ||
        (role === "internal" && isItDivision)));
  const accessHref = "/dashboard/access/users";

  const dashboardAllowList = Array.isArray(user?.allowedDashboards)
    ? [...user.allowedDashboards, "it-repair-maintenance", "kaldev-performance"]
    : null;

  const catalogWithAccess: DashboardCatalogItem[] = canAccessManagement
    ? [
        {
          id: "access-management",
          name: "Access Management Dashboard",
          icon: "usercog",
          color: "#4F46E5",
          status: "active",
          href: accessHref,
        },
        ...DASHBOARD_CATALOG,
      ]
    : DASHBOARD_CATALOG;

  const allowedItems = loading
    ? []
    : catalogWithAccess.filter((it) => {
        if (isSuperAdmin) return true;
        if (
          it.id === "bug-tracker" &&
          !["it-admin", "it-product"].includes((access?.roleKey ?? "").trim().toLowerCase())
        ) {
          return false;
        }
        if (it.id === "access-management") return canAccessManagement;
        if (dashboardAllowList) {
          return dashboardAllowList.includes(it.id);
        }
        return canAccessDashboard(role, it.id as DashboardId);
      });

  const q = search.trim().toLowerCase();
  const filteredItems = allowedItems.filter(
    (it) => !q || it.name.toLowerCase().includes(q),
  );

  if (!mounted) return null;


  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-160 max-w-[92vw] flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "min(640px, 90vh)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6 sm:py-5">
          <div className="font-sans text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Browse Dashboards
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="shrink-0 px-4 pt-4 pb-2 sm:px-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 inline-flex -translate-y-1/2 text-zinc-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari dashboard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="box-border w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 py-2.5 pl-9 pr-4 font-sans text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 pt-3 sm:px-6 sm:pb-5">
          <div className="flex flex-col gap-1.5">
            {filteredItems.map((it) => {
              const isHelpdeskCurrent =
                it.id === "helpdesk" &&
                (pathname.startsWith("/dashboard/helpdesk") || pathname === "/dashboard");
              const isAssetPmCurrent =
                it.id === "asset-pm" && pathname.startsWith("/dashboard/asset-maintenance");
              const isAccessCurrent =
                it.id === "access-management" &&
                (pathname.startsWith("/dashboard/access") ||
                  pathname.startsWith("/dashboard/access-management"));
              const isNetworkPerformanceCurrent =
                it.id === "network-performance" &&
                pathname.startsWith("/dashboard/network-performance");
              const isCurrent =
                isHelpdeskCurrent ||
                isAssetPmCurrent ||
                isAccessCurrent ||
                isNetworkPerformanceCurrent;
              const isActive = it.status === "active" && !isCurrent;

              return (
                <div
                  key={it.name}
                  onClick={() => {
                    if (isCurrent || !isActive || !it.href) return;
                    window.location.href = it.href;
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 border-b border-zinc-100 px-2 py-3 transition-all rounded-lg dark:border-zinc-900 sm:gap-3 sm:px-3.5",
                    isActive || isCurrent
                      ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      : "cursor-not-allowed opacity-60",
                  )}
                >
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: hexTint(it.color, 0.88),
                      color: it.color,
                    }}
                  >
                    <CatalogIcon name={it.icon} />
                  </span>

                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {it.name}
                  </span>

                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors sm:px-2.5 sm:text-[11px]",
                      isCurrent
                        ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-400"
                        : isActive
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"
                          : "bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500",
                    )}
                  >
                    {(isActive || isCurrent) && (
                      <span className="inline-flex">
                        <Check size={11} />
                      </span>
                    )}
                    <span>
                      {isCurrent
                        ? "Current"
                        : isActive
                          ? "Active"
                          : "Coming soon"}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
