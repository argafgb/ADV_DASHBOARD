"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutGrid, MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu } from "@/components/dashboard-panel/menu";
import { UserNav } from "@/components/dashboard-panel/user-nav";
import { DASHBOARD_CONFIG } from "@/lib/dashboard-config";

import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

interface SheetMenuProps {
  onOpenDashModal?: () => void;
}

/**
 * Navigasi mobile. Di bawah breakpoint lg sidebar disembunyikan, jadi sheet
 * ini harus memuat semua yang ada di sidebar termasuk Browse Dashboards dan
 * menu profil — tanpa itu user mobile tidak punya jalan untuk logout.
 */
export function SheetMenu({ onOpenDashModal }: SheetMenuProps) {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const isOpen = openPathname === pathname;

  const openDashboardModal = () => {
    setOpenPathname(null);
    onOpenDashModal?.();
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => setOpenPathname(open ? pathname : null)}
    >
      <SheetTrigger className="lg:hidden" asChild>
        <Button
          className="h-8"
          variant="outline"
          size="icon"
          aria-label="Buka menu"
        >
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader className="items-start pr-8 text-left">
          <Button
            className="flex w-full items-center justify-start pb-2 pt-1 text-left"
            variant="link"
            asChild
          >
            <a
              href={DASHBOARD_CONFIG.hubUrl}
              onClick={() => setOpenPathname(null)}
              title={`${DASHBOARD_CONFIG.brandName} · IT Dashboard Hub`}
              aria-label="Buka IT Dashboard Hub"
              className="flex min-w-0 items-center"
            >
              <Image
                src="/adv-banner.webp"
                unoptimized
                alt={DASHBOARD_CONFIG.brandName}
                width={925}
                height={286}
                className="h-7 w-auto max-w-full shrink-0 object-contain"
                priority
              />

              <SheetTitle className="sr-only">
                {DASHBOARD_CONFIG.brandName}
              </SheetTitle>
            </a>
          </Button>
        </SheetHeader>

        <div className="min-h-0 flex-1">
          <Menu isOpen onNavigate={() => setOpenPathname(null)} />
        </div>

        <div className="mt-auto w-full border-t border-zinc-200 pt-3 dark:border-zinc-800/60">
          <button
            type="button"
            onClick={openDashboardModal}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          >
            <LayoutGrid size={18} className="text-zinc-500" />

            <span className="min-w-0 flex-1 font-sans text-[13px] font-medium text-zinc-750 dark:text-zinc-350">
              Browse Dashboards
            </span>

            <ChevronRight size={14} className="text-zinc-400" />
          </button>

          <div className="mt-2 px-1">
            <UserNav isOpen />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
