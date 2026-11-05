import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { dashboardHref } from "@/lib/global-filters";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/dashboard-panel/collapse-menu-button";

import type { AuthRole } from "@/types/auth.types";

interface MenuProps {
  isOpen: boolean | undefined;
  role?: AuthRole;
  onOpenDashModal?: () => void;
}

export function Menu({
  isOpen,
  role: defaultRole = "management",
  onNavigate,
}: MenuProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<AuthRole>(defaultRole);
  const [permissions, setPermissions] = useState<string[] | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore) {
          if (data?.user?.role) setRole(data.user.role);
          if (Array.isArray(data?.user?.allowedDashboards)) {
            setPermissions(Array.isArray(data?.access?.permissions) ? data.access.permissions : []);
          } else if (!data?.user) {
            setPermissions([]);
          }
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!ignore) {
          setPermissions([]);
          setLoaded(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const menus = loaded ? getMenuList(pathname, role, permissions) : [];

  return (
    <ScrollArea className="[&>div>div[style]]:block! flex-1 w-full">
      <nav className="mt-3 h-full w-full">
        <ul
          className={cn(
            "flex flex-col w-full",
            isOpen === false
              ? "items-center px-0 gap-y-2"
              : "items-start px-2 gap-y-1.5",
          )}
        >
          {menus.map(({ href, label, icon: Icon, active, submenus }, index) => {
            const isRootCauseMenu = label === "Ticketing & Root Cause";
            const isActive = !!(
              (active === undefined &&
                (pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href)))) ||
              active
            );

            return (
              <li
                className={cn(
                  "w-full",
                  isOpen === false && "flex items-center justify-center",
                )}
                key={`${href}-${index}`}
              >
                {!submenus || submenus.length === 0 ? (
                  <Button
                    variant="ghost"
                    className={cn(
                      "cursor-pointer m-0 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 focus:border-0 active:border-0 transition-colors",
                      isOpen === false
                        ? "h-11 w-11 min-w-11 max-w-11 min-h-11 max-h-11 p-0 rounded-[10px] flex items-center justify-center shadow-none border-0 shrink-0"
                        : "h-11 min-h-[44px] py-0 px-3 w-full justify-start rounded-[10px]",
                      isActive
                        ? "font-semibold text-[#2563EB] dark:text-blue-400 bg-[#EFF4FE] dark:bg-blue-950/40 hover:bg-[#EFF4FE] dark:hover:bg-blue-950/50 active:bg-[#EFF4FE] focus:bg-[#EFF4FE]"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-[#F5F7FB] dark:hover:bg-zinc-800/80 hover:text-slate-900 active:bg-[#F5F7FB]",
                    )}
                    asChild
                  >
                    <Link
                      href={dashboardHref(href, searchParams)}
                      aria-current={isActive ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center",
                        isOpen === false ? "justify-center" : "w-full",
                      )}
                    >
                      <span
                        className={cn(
                          isOpen === false ? "" : "mr-3",
                          isActive
                            ? "text-[#2563EB] dark:text-blue-400"
                            : "text-slate-400 dark:text-zinc-400 group-hover:text-slate-600",
                        )}
                      >
                        <Icon size={20} strokeWidth={1.8} />
                      </span>

                      <p
                        className={cn(
                          isRootCauseMenu ? "whitespace-nowrap text-[13px] transition-all text-left" : "max-w-50 truncate text-[13px] transition-all text-left",
                          isActive && "font-semibold",
                          isOpen === false
                            ? "hidden opacity-0"
                            : "block translate-x-0 opacity-100",
                        )}
                      >
                        {label}
                      </p>
                    </Link>
                  </Button>
                ) : (
                  <CollapseMenuButton
                    icon={Icon}
                    label={label}
                    active={isActive}
                    submenus={submenus}
                    isOpen={isOpen}
                    onNavigate={onNavigate}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </ScrollArea>
  );
}
