"use client";

import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SheetMenu } from "@/components/dashboard-panel/sheet-menu";
import { getDashboardTitle } from "@/lib/dashboard-registry";
import { useSidebar } from "@/hooks/useSidebar";

interface NavbarProps {
  onOpenDashModal?: () => void;
}

export function Navbar({ onOpenDashModal }: NavbarProps = {}) {
  const pathname = usePathname();
  const pageTitle = getDashboardTitle(pathname);
  const isOpen = useSidebar((s) => s.isOpen);
  const toggleOpen = useSidebar((s) => s.toggleOpen);

  const isPicMonitoring = pathname.startsWith("/dashboard/pic-monitoring");

  return (
    <header className="sticky top-0 z-40 isolate w-full shrink-0 overflow-visible border-b border-zinc-200 dark:border-zinc-800 bg-[#FBFBFD]/95 dark:bg-zinc-950/95 backdrop-blur supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-zinc-950/60 shadow-sm">
      <div className="mx-3 flex h-14 min-w-0 items-center justify-between gap-2 sm:mx-6 sm:gap-3">
        {/* Left Side: Navigation Sheet & Page Header */}
        <div className="flex min-w-0 items-center space-x-3 shrink-0">
          {isPicMonitoring ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleOpen}
                aria-label="Toggle sidebar"
                className="flex h-8 w-8 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs cursor-pointer transition-colors"
              >
                {isOpen ? <ChevronLeft size={16} strokeWidth={1.8} /> : <ChevronRight size={16} strokeWidth={1.8} />}
              </button>
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-50 tracking-tight">
                PIC Monitoring
              </h2>
            </div>
          ) : (
            <>
              <SheetMenu onOpenDashModal={onOpenDashModal} />
              <h2 className="hidden md:block font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                {pageTitle}
              </h2>
            </>
          )}
        </div>

        {/* Right Side: Global Filters & Metadata */}
        <div
          id="dashboard-topbar-actions"
          className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3"
        />
      </div>
    </header>
  );
}
