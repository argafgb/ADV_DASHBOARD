"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name?: string) {
  if (!name) return "U";

  const words = name.trim().split(" ");

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

type AuthProfile = {
  user: { name: string; nik: string; role: string };
  access?: { roleName?: string; roleKey?: string };
};

const DEFAULT_LOGIN_URL = "/login";

function getLogoutUrl(returnTo: string): string {
  const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL || DEFAULT_LOGIN_URL;
  if (loginUrl.startsWith("/")) {
    return `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
  }
  try {
    const origin = new URL(loginUrl).origin;
    const logoutUrl = new URL("/api/auth/logout", origin);
    logoutUrl.searchParams.set("returnTo", returnTo);
    return logoutUrl.href;
  } catch {
    return `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
  }
}

function LogoutConfirmModal({
  open,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
              Konfirmasi Logout
            </h2>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Apakah kamu yakin ingin keluar dari dashboard?
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-500/70"
          >
            {loading ? "Sedang keluar..." : "Ya, Logout"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function UserNav({ isOpen = true }: { isOpen?: boolean }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.user) setProfile(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpenConfirm(false);
      setIsLoggingOut(false);
      setDropdownOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  function handleLogout() {
    try {
      setIsLoggingOut(true);
      const currentPath = `${window.location.pathname}${window.location.search}`;
      window.location.assign(getLogoutUrl(currentPath));
    } catch {
      setIsLoggingOut(false);
    }
  }

  const user = profile?.user;
  const access = profile?.access;
  const displayName = user?.name ?? "Pengguna";
  const roleLabel =
    access?.roleName ?? access?.roleKey ?? user?.role ?? "Memuat role...";
  const displayInfo = user ? `${roleLabel} · ${user.nik}` : "Memuat profil...";

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                {isOpen ? (
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 bg-transparent text-left outline-none transition-colors"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 text-[11px] font-black border border-blue-100 dark:border-blue-950/40">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-start leading-tight min-w-0 flex-1">
                      <span
                        className="w-full break-words text-xs font-bold leading-snug text-zinc-850 dark:text-zinc-50 line-clamp-2"
                        title={displayName}
                      >
                        {displayName}
                      </span>
                      <span
                        className="w-full truncate text-[10px] font-medium text-zinc-400 dark:text-zinc-550 mt-0.5"
                        title={displayInfo}
                      >
                        {displayInfo}
                      </span>
                    </div>
                  </button>
                ) : (
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 flex justify-center items-center"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 text-[11px] font-black border border-blue-100 dark:border-blue-950/40">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                )}
              </DropdownMenuTrigger>
            </TooltipTrigger>

            <TooltipContent side="right">
              {isOpen ? "Profil" : `${displayName} (${displayInfo})`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          className="w-56"
          align="start"
          side="top"
          forceMount
        >
          <DropdownMenuItem
            className="text-red-600 hover:cursor-pointer focus:text-red-600"
            onClick={(event) => {
              event.preventDefault();
              setDropdownOpen(false);
              setOpenConfirm(true);
            }}
          >
            <LogOut className="mr-3 h-4 w-4 text-red-500" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutConfirmModal
        open={openConfirm}
        loading={isLoggingOut}
        onClose={() => {
          if (!isLoggingOut) {
            setOpenConfirm(false);
          }
        }}
        onConfirm={handleLogout}
      />
    </>
  );
}
