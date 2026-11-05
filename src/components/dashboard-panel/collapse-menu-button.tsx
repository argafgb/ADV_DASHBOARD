"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Dot, LucideIcon } from "lucide-react";

import { dashboardHref } from "@/lib/global-filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePathname, useSearchParams } from "next/navigation";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
  onNavigate?: () => void;
}

export function CollapseMenuButton({
  icon: Icon,
  label,
  active,
  submenus,
  isOpen,
  onNavigate,
}: CollapseMenuButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filteredHref = (href: string) => dashboardHref(href, searchParams);
  const isSubmenuActive =
    active ||
    submenus.some((submenu) =>
      submenu.active === undefined ? submenu.href === pathname : submenu.active,
    );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);

  return isOpen ? (
    <Collapsible
      open={isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full"
    >
      <CollapsibleTrigger
        className="[&[data-state=open]>div>div>svg]:rotate-180 mb-1"
        asChild
      >
        <Button
          variant={isSubmenuActive ? "secondary" : "ghost"}
          className="w-full justify-start h-auto min-h-10 py-2"
        >
          <div className="w-full items-center flex justify-between">
            <div className="flex items-center">
              <span className="mr-4">
                <Icon size={18} />
              </span>
              <p
                className={cn(
                  "max-w-37.5 whitespace-normal wrap-break-word text-left",
                  isOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-96 opacity-0",
                )}
              >
                {label}
              </p>
            </div>
            <div
              className={cn(
                "whitespace-nowrap",
                isOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-96 opacity-0",
              )}
            >
              <ChevronDown
                size={18}
                className="transition-transform duration-200"
              />
            </div>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {submenus.map(({ href, label, active }, index) => (
          <Button
            key={index}
            variant={
              (active === undefined && pathname === href) || active
                ? "secondary"
                : "ghost"
            }
            className="w-full justify-start h-auto min-h-10 py-2 mb-1"
            asChild
          >
            <Link
              href={filteredHref(href)}
              aria-current={
                (active === undefined && pathname === href) || active
                  ? "page"
                  : undefined
              }
              onClick={onNavigate}
            >
              <span className="mr-4 ml-2">
                <Dot size={18} />
              </span>
              <p
                className={cn(
                  "max-w-42.5 whitespace-normal wrap-break-word text-left",
                  isOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-96 opacity-0",
                )}
              >
                {label}
              </p>
            </Link>
          </Button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isSubmenuActive ? "secondary" : "ghost"}
          className={cn(
            "cursor-pointer m-0 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 transition-colors",
            isOpen === false
              ? "h-11 w-11 min-w-11 max-w-11 min-h-11 max-h-11 p-0 mx-auto rounded-[10px] flex items-center justify-center shrink-0 shadow-none border-0"
              : "h-11 min-h-[44px] justify-start px-4 rounded-[10px] w-full",
          )}
        >
          <div
            className={cn(
              "items-center flex",
              isOpen === false
                ? "justify-center"
                : "w-full justify-between",
            )}
          >
            <div className="flex items-center">
              <span className={cn(isOpen === false ? "" : "mr-4")}>
                <Icon size={18} />
              </span>
              {isOpen !== false && (
                <p className="max-w-50 truncate">{label}</p>
              )}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" sideOffset={8} align="start">
        <DropdownMenuLabel className="max-w-47.5 truncate">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submenus.map(({ href, label, active }, index) => (
          <DropdownMenuItem key={index} asChild>
            <Link
              className={`cursor-pointer ${
                ((active === undefined && pathname === href) || active) &&
                "bg-secondary"
              }`}
              href={filteredHref(href)}
              aria-current={
                (active === undefined && pathname === href) || active
                  ? "page"
                  : undefined
              }
              onClick={onNavigate}
            >
              <p className="max-w-45 truncate">{label}</p>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuArrow className="fill-border" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
