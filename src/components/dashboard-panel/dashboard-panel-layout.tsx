"use client";

import { Sidebar } from "@/components/dashboard-panel/sidebar";
import { Navbar } from "@/components/dashboard-panel/navbar";
import { useSidebar, useSidebarHydrated } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

interface DashboardPanelLayoutProps {
  children: React.ReactNode;
  onOpenDashModal?: () => void;
}

export default function DashboardPanelLayout({
  children,
  onOpenDashModal,
}: DashboardPanelLayoutProps) {
  // Rendered unconditionally: gating this on persisted state used to blank the
  // navbar and the page content until hydration finished.
  const hydrated = useSidebarHydrated();
  const isOpen = useSidebar((s) => s.isOpen);
  const isHover = useSidebar((s) => s.isHover);
  const settings = useSidebar((s) => s.settings);
  const isSidebarOpen = isOpen || (settings.isHoverOpen && isHover);

  return (
    <>
      <Sidebar onOpenDashModal={onOpenDashModal} />
      <div
        className={cn(
          "relative isolate min-h-screen min-w-0 flex flex-col overflow-x-clip ease-in-out bg-zinc-100 dark:bg-zinc-900",
          hydrated && "transition-[margin-left] duration-300",
          !settings.disabled && (!isSidebarOpen ? "lg:ml-22.5" : "lg:ml-64"),
        )}
      >
        <Navbar onOpenDashModal={onOpenDashModal} />
        <main className="relative z-0 min-w-0 max-w-full flex-1 overflow-x-clip p-4 pt-6 sm:p-6">
          {children}
        </main>
      </div>
    </>
  );
}
