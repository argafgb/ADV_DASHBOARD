"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ChevronRight, Monitor, Headset } from "lucide-react";
import { Menu } from "@/components/dashboard-panel/menu";
import { SidebarToggle } from "@/components/dashboard-panel/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar, useSidebarHydrated } from "@/hooks/useSidebar";

import { cn } from "@/lib/utils";
import { DASHBOARD_CONFIG } from "@/lib/dashboard-config";
import { UserNav } from "@/components/dashboard-panel/user-nav";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface SidebarProps {
  onOpenDashModal?: () => void;
}

export function Sidebar({ onOpenDashModal }: SidebarProps) {
  const pathname = usePathname();
  // Rendered unconditionally so the (fully static) nav list ships in the server
  // HTML instead of popping in once localStorage has been read.
  const hydrated = useSidebarHydrated();
  const isOpen = useSidebar((s) => s.isOpen);
  const isHover = useSidebar((s) => s.isHover);
  const settings = useSidebar((s) => s.settings);
  const toggleOpen = useSidebar((s) => s.toggleOpen);
  const setIsHover = useSidebar((s) => s.setIsHover);
  const isSidebarOpen = isOpen || (settings.isHoverOpen && isHover);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 h-dvh -translate-x-full bg-zinc-50 lg:translate-x-0 dark:bg-zinc-950 ease-in-out",
        hydrated && "transition-[width] duration-300",
        !isSidebarOpen ? "w-22.5" : "w-64",
        settings.disabled && "hidden",
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />

      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative flex h-full min-h-0 flex-col overflow-hidden border-r border-zinc-200 px-3 py-4 shadow-md transition-all duration-300 dark:border-zinc-800 dark:shadow-zinc-800"
      >
        {/* Brand Header */}
        <Button
          className={cn(
            "transition-all duration-300 mb-1 flex items-center w-full",
            !isSidebarOpen ? "justify-center px-0" : "justify-start gap-2",
          )}
          variant="ghost"
          asChild
        >
          <a
            href={DASHBOARD_CONFIG.hubUrl}
            title={`${DASHBOARD_CONFIG.brandName} · IT Dashboard Hub`}
            aria-label="Buka IT Dashboard Hub"
            className="flex items-center"
          >
            <Image
              src="/adv-logo-v2.webp"
              unoptimized
              alt={DASHBOARD_CONFIG.brandName}
              width={92}
              height={28}
              className={cn(
                "h-auto max-h-7 max-w-full shrink-0 object-contain transition-[width] duration-300",
                isSidebarOpen ? "w-23" : "w-10",
              )}
              priority
            />
          </a>
        </Button>

        {/* Module Switcher */}
        {isSidebarOpen ? (
          <div className="my-2 px-1">
            <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1">
              Modul
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-lg text-xs font-medium">
              <Link
                href="/dashboard/asset-maintenance"
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all",
                  pathname.startsWith("/dashboard/asset-maintenance")
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Monitor size={14} />
                Asset IT
              </Link>
              <Link
                href="/dashboard/helpdesk"
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all",
                  pathname.startsWith("/dashboard/helpdesk")
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Headset size={14} />
                Helpdesk
              </Link>
            </div>
          </div>
        ) : (
          <div className="my-2 flex flex-col items-center gap-1">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/asset-maintenance"
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      pathname.startsWith("/dashboard/asset-maintenance")
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                        : "text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                    )}
                  >
                    <Monitor size={18} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Asset IT Maintenance</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/helpdesk"
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      pathname.startsWith("/dashboard/helpdesk")
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                    )}
                  >
                    <Headset size={18} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Helpdesk Tickets</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-hidden flex flex-col w-full">
          <Menu
            isOpen={isSidebarOpen}
            role="management"
            onOpenDashModal={onOpenDashModal}
          />
        </div>

        {/* Sticky Bottom Actions & Profile */}
        <div className="mt-auto w-full">
          {isSidebarOpen ? (
            <div className="mt-4 w-full pt-3 dark:border-zinc-800/60">
              <div className="px-3 pb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-500">
                Other Dashboards
              </div>

              <button
                type="button"
                onClick={onOpenDashModal}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border-2"
              >
                <span className="inline-flex text-zinc-500">
                  <LayoutGrid size={18} />
                </span>

                <span className="min-w-0 flex-1 font-sans text-[13px] font-medium text-zinc-750 dark:text-zinc-350">
                  Browse Dashboards
                </span>

                <span className="inline-flex text-zinc-400">
                  <ChevronRight size={14} />
                </span>
              </button>

              <div className="mb-1 mt-4 border-t border-zinc-200 dark:border-zinc-800/60" />
              <div className="px-1">
                <UserNav isOpen={true} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <TooltipProvider disableHoverableContent>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={onOpenDashModal}
                      variant="outline"
                      className="mt-4 h-10 w-full justify-center text-zinc-700 dark:text-zinc-400"
                    >
                      <LayoutGrid size={18} />
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent side="right">
                    Browse Dashboards
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="my-2.5 w-full border-t border-zinc-200 dark:border-zinc-800/60" />
              <div className="flex justify-center w-full">
                <UserNav isOpen={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
