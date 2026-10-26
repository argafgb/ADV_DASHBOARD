import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { dashboardHref } from "@/lib/global-filters";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/dashboard-panel/collapse-menu-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

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
      <nav className="mt-4 h-full w-full">
        <ul className="flex flex-col items-start space-y-1 w-full px-2">
          {menus.map(({ href, label, icon: Icon, active, submenus }, index) => {
            const isActive = !!(
              (active === undefined &&
                (pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href)))) ||
              active
            );

            return (
              <li className="w-full" key={`${href}-${index}`}>
                {!submenus || submenus.length === 0 ? (
                  <TooltipProvider disableHoverableContent>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "mb-1 h-auto min-h-10 py-2 w-full",
                            isOpen === false
                              ? "justify-center px-0"
                              : "justify-start px-4",
                            isActive
                              ? "font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                              : "text-zinc-755 dark:text-zinc-400",
                          )}
                          asChild
                        >
                          <Link
                            href={dashboardHref(href, searchParams)}
                            aria-current={isActive ? "page" : undefined}
                            onClick={onNavigate}
                            className="flex items-center w-full"
                          >
                            <span
                              className={cn(
                                isOpen === false ? "" : "mr-4",
                                isActive
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-zinc-400 dark:text-zinc-550",
                              )}
                            >
                              <Icon size={18} />
                            </span>

                            <p
                              className={cn(
                                "max-w-50 whitespace-normal wrap-break-word text-left transition-all",
                                isOpen === false
                                  ? "hidden opacity-0"
                                  : "block translate-x-0 opacity-100",
                              )}
                            >
                              {label}
                            </p>
                          </Link>
                        </Button>
                      </TooltipTrigger>

                      {isOpen === false && (
                        <TooltipContent side="right">{label}</TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
