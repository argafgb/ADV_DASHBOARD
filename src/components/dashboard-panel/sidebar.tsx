"use client";

import Image from "next/image";
import { LayoutGrid, ChevronRight } from "lucide-react";
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
            "transition-all duration-300 mb-2 flex items-center w-full",
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
            {isSidebarOpen ? (
              <Image
                src="/adv-banner.webp"
                unoptimized
                alt={DASHBOARD_CONFIG.brandName}
                width={92}
                height={28}
                className="h-auto max-h-7 w-23 max-w-full shrink-0 object-contain transition-all duration-300"
                priority
              />
            ) : (
              <Image
                src="/adv-icon.webp"
                unoptimized
                alt={DASHBOARD_CONFIG.brandName}
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 object-contain transition-all duration-300"
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
            <div className="mt-4 flex w-full flex-col items-center gap-2 pt-2">
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onOpenDashModal}
                      aria-label="Browse Dashboards"
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
                    >
                      <LayoutGrid size={18} />
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
