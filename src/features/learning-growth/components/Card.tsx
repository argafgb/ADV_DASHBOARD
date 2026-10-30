import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

/** Reference card: white surface, 1px border, 14px radius, soft shadow. */
export function Card({ title, subtitle, className, children }: CardProps) {
  return (
    <section
      className={cn(
        "dh-card-3d relative min-w-0 overflow-hidden rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5",
        className,
      )}
    >
      {(title || subtitle) && (
        <header className="mb-3 flex items-start justify-between gap-3 sm:mb-[14px]">
          <div>
            {title && (
              <h2 className="text-base leading-[1.25] font-bold tracking-[-0.01em] text-zinc-900 dark:text-zinc-50 sm:text-[18px]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs leading-[1.4] text-zinc-500 dark:text-zinc-400 sm:text-[14px]">
                {subtitle}
              </p>
            )}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
