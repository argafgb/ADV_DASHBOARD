"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

export interface TooltipBindProps {
  onMouseEnter: (e: MouseEvent<Element>) => void;
  onMouseMove: (e: MouseEvent<Element>) => void;
  onMouseLeave: () => void;
}

interface TooltipContextValue {
  bind: (title: string, lines: string[]) => TooltipBindProps;
  showAt: (title: string, lines: string[], clientX: number, clientY: number) => void;
  hide: () => void;
  tooltipRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  title: string;
  lines: string[];
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function TooltipLayer() {
  const { tooltipRef, open, title, lines } = useTooltip();
  return (
    <div
      ref={tooltipRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-70 w-max max-w-[calc(100%-1.5rem)] transition-opacity duration-150"
      style={{ opacity: open ? 1 : 0 }}
    >
      <div className="min-w-0 rounded-[10px] border border-[#f1f3f7] bg-white px-3 py-2 text-[#111827] shadow-[0_8px_24px_rgba(17,24,39,0.12)] sm:min-w-45 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="wrap-break-word text-[11.5px] leading-snug font-semibold text-gray-700 dark:text-zinc-300">
          {title}
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            className="mt-1 wrap-break-word text-[11px] leading-snug font-medium text-gray-900 dark:text-zinc-200"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TooltipProvider({
  children,
}: {
  children: ReactNode;
}) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState<string[]>([]);

  const positionAt = useCallback(
    (clientX: number, clientY: number) => {
      const tip = tooltipRef.current;
      if (!tip) return;

      const cursorX = clientX;
      const cursorY = clientY;
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      const tipWidth = tip.offsetWidth;
      const tipHeight = tip.offsetHeight;
      const viewportPadding = 12;
      const headerBottom =
        document.querySelector<HTMLElement>("[data-dashboard-header]")?.getBoundingClientRect()
          .bottom ?? 0;
      const contentTop = Math.max(viewportPadding, headerBottom + viewportPadding);
      const cursorGap = 14;

      const centeredLeft = cursorX - tipWidth / 2;
      const left = Math.min(
        Math.max(centeredLeft, viewportPadding),
        Math.max(viewportPadding, viewportWidth - tipWidth - viewportPadding),
      );
      const preferredTop = cursorY - tipHeight - cursorGap;
      const top =
        preferredTop >= contentTop
          ? preferredTop
          : Math.min(
              Math.max(cursorY + cursorGap, contentTop),
              viewportHeight - tipHeight - viewportPadding,
            );

      tip.style.left = `${left}px`;
      tip.style.top = `${Math.max(contentTop, top)}px`;
    },
    [],
  );

  const position = useCallback(
    (e: MouseEvent<Element>) => positionAt(e.clientX, e.clientY),
    [positionAt],
  );

  const bind = useCallback(
    (tipTitle: string, tipLines: string[]): TooltipBindProps => ({
      onMouseEnter: (e) => {
        const { clientX, clientY } = e;
        setTitle(tipTitle);
        setLines(tipLines);
        setOpen(true);
        requestAnimationFrame(() => positionAt(clientX, clientY));
      },
      onMouseMove: position,
      onMouseLeave: () => setOpen(false),
    }),
    [position, positionAt],
  );

  const showAt = useCallback(
    (tipTitle: string, tipLines: string[], clientX: number, clientY: number) => {
      setTitle(tipTitle);
      setLines(tipLines);
      setOpen(true);
      requestAnimationFrame(() => positionAt(clientX, clientY));
    },
    [positionAt],
  );

  const hide = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ bind, showAt, hide, tooltipRef, open, title, lines }),
    [bind, showAt, hide, open, title, lines],
  );

  return (
    <TooltipContext.Provider value={value}>
      {children}
      <TooltipLayer />
    </TooltipContext.Provider>
  );
}

export function useTooltip(): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error("useTooltip must be used inside TooltipProvider");
  return ctx;
}
