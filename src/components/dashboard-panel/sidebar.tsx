"use client";

import Image from "next/image";
import { LayoutGrid, ChevronRight } from "lucide-react";
import { Menu } from "@/components/dashboard-panel/menu";
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
  const hydrated = useSidebarHydrated();
  const isOpen = useSidebar((s) => s.isOpen);
  const isHover = useSidebar((s) => s.isHover);
  const settings = useSidebar((s) => s.settings);
  const setIsHover = useSidebar((s) => s.setIsHover);
  const isSidebarOpen = isOpen || (settings.isHoverOpen && isHover);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 h-dvh translate-x-0 bg-white dark:bg-zinc-950 ease-in-out",
        hydrated && "transition-[width] duration-300",
        !isSidebarOpen ? "w-[72px]" : "w-[248px]",
        settings.disabled && "hidden",
      )}
    >

      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden border-r border-zinc-200 shadow-xs transition-all duration-300 dark:border-zinc-800",
          !isSidebarOpen ? "px-0 py-3 items-center" : "px-3 py-4",
        )}
      >
        {/* Brand Header */}
        <Button
          className={cn(
            "transition-all duration-300 mb-2 flex items-center hover:bg-transparent",
            !isSidebarOpen ? "justify-center w-11 h-11 p-0" : "justify-start px-2 h-12 w-full",
          )}
          variant="ghost"
          asChild
        >
          <a
            href={DASHBOARD_CONFIG.hubUrl}
            title={`${DASHBOARD_CONFIG.brandName} · IT Dashboard Hub`}
            aria-label="Buka IT Dashboard Hub"
            className="flex items-center justify-center"
          >
            {isSidebarOpen ? (
              <Image
                src="/adv-full-banner.png"
                unoptimized
                alt={DASHBOARD_CONFIG.brandName}
                width={140}
                height={30}
                className="h-7 w-auto max-w-full shrink-0 object-contain"
                priority
              />
            ) : (
              <Image
                src="/adv-mark.png"
                unoptimized
                alt={DASHBOARD_CONFIG.brandName}
                width={34}
                height={34}
                className="h-8 w-8 shrink-0 object-contain transition-all duration-300"
                priority
              />
            )}
          </a>
        </Button>

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
                className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800"
              >
                <span className="inline-flex text-zinc-500">
                  <LayoutGrid size={18} strokeWidth={1.8} />
                </span>

                <span className="min-w-0 flex-1 font-sans text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
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
            <div className="mt-4 flex w-full flex-col items-center gap-3.5 pt-2">
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onOpenDashModal}
                      aria-label="Browse Dashboards"
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 focus:outline-none focus:ring-0"
                    >
                      <LayoutGrid size={18} strokeWidth={1.8} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Browse Dashboards</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="my-1 w-8 border-t border-zinc-200 dark:border-zinc-800/60" />
              <UserNav isOpen={false} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
