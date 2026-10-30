"use client";

import { usePathname } from "next/navigation";
import { SheetMenu } from "@/components/dashboard-panel/sheet-menu";
import { getDashboardTitle } from "@/lib/dashboard-registry";

interface NavbarProps {
  onOpenDashModal?: () => void;
}

export function Navbar({ onOpenDashModal }: NavbarProps = {}) {
  const pathname = usePathname();
  const pageTitle = getDashboardTitle(pathname);

  return (
    <header className="sticky top-0 z-40 isolate w-full shrink-0 overflow-visible border-b border-zinc-200 dark:border-zinc-800 bg-[#FBFBFD]/95 dark:bg-zinc-950/95 backdrop-blur supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-zinc-950/60 shadow-sm">
      <div className="mx-3 flex h-14 min-w-0 items-center justify-between gap-2 sm:mx-6 sm:gap-3">
        {/* Left Side: Navigation Sheet & Page Header */}
        <div className="flex min-w-0 items-center space-x-3 shrink-0">
          <SheetMenu onOpenDashModal={onOpenDashModal} />
          <h2 className="hidden md:block font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
            {pageTitle}
          </h2>
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
