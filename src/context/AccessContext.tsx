"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/types/auth.types";
import type { DataScope } from "@/lib/access/data-scope";

export interface CurrentAccessDto {
  source: "db" | "legacy";
  status: "active" | "suspended";
  role: {
    key: string;
    name: string;
  } | null;
  fleetRole: "management" | "internal";
  permissions: string[];
  scope: DataScope;
  homePath: string;
}

export interface AccessContextValue {
  loading: boolean;
  user: AuthUser | null;
  access: CurrentAccessDto | null;
  permissions: ReadonlySet<string>;
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
}

const AccessContext = React.createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [access, setAccess] = React.useState<CurrentAccessDto | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const generation = React.useRef({ id: 0 });
  const snapshot = React.useRef<string | undefined>(undefined);

  const refresh = React.useCallback(async () => {
    const requestId = ++generation.current.id;
    try {
      const res = await fetch("/api/access/me", { credentials: "include", cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      if (requestId !== generation.current.id) return;
      const nextAccess = data?.access ?? null;
      const nextSnapshot = JSON.stringify(nextAccess);
      const changed = snapshot.current !== undefined && snapshot.current !== nextSnapshot;
      snapshot.current = nextSnapshot;
      setUser(data?.user ?? null);
      setAccess(nextAccess);
      if (changed) router.refresh();
    } catch (err) {
      if (requestId !== generation.current.id) return;
      console.error("[ACCESS_REFRESH_ERROR]", err);
      setUser(null);
      setAccess(null);
    } finally {
      if (requestId === generation.current.id) setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    const requests = generation.current;
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const onFocus = () => { void refresh(); };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);
    window.addEventListener("focus", onFocus);
    return () => {
      ++requests.id;
      window.clearTimeout(initial);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, pathname]);

  const permissions = React.useMemo(() => {
    return new Set(access?.permissions ?? []);
  }, [access?.permissions]);

  const can = React.useCallback(
    (permission: string) => {
      return permissions.has(permission);
    },
    [permissions],
  );

  const value = React.useMemo(
    () => ({
      loading,
      user,
      access,
      permissions,
      can,
      refresh,
    }),
    [loading, user, access, permissions, can, refresh],
  );

  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  );
}

const EMPTY_ACCESS_CONTEXT: AccessContextValue = {
  loading: false,
  user: null,
  access: null,
  permissions: new Set(),
  can: () => false,
  refresh: async () => {},
};

export function useAccess(): AccessContextValue {
  const context = React.useContext(AccessContext);
  return context ?? EMPTY_ACCESS_CONTEXT;
}
