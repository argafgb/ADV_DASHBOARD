"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface TipRow {
  color?: string;
  label: string;
  value: ReactNode;
}

/**
 * Isi tooltip: judul lalu baris `● label : nilai`. Sengaja tanpa kalimat
 * penjelas; pengguna cukup membaca angkanya, sama seperti tooltip Overtime.
 */
export interface TipContent {
  title?: ReactNode;
  rows?: TipRow[];
}

/** Titik jangkar dalam piksel viewport; `top`/`bottom` = tepi elemen atau kursor. */
export interface TipAnchor {
  x: number;
  top: number;
  bottom: number;
}

/** Jarak kotak ke jangkar, sama dengan tooltip chart dashboard Overtime. */
const TIP_GAP = 12;
/** Tinggi kira-kira kursor, supaya tooltip yang pindah ke bawah tidak menutupinya. */
const CURSOR_HEIGHT = 18;
const VIEWPORT_MARGIN = 8;

function cursorAnchor(event: { clientX: number; clientY: number }): TipAnchor {
  return {
    x: event.clientX,
    top: event.clientY,
    bottom: event.clientY + CURSOR_HEIGHT,
  };
}

function elementAnchor(element: Element): TipAnchor {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom };
}

/** Tooltip yang posisinya tetap harus hilang saat halaman digulir. */
function useHideOnScroll(active: boolean, hide: () => void) {
  useEffect(() => {
    if (!active) return;
    window.addEventListener("scroll", hide, true);
    return () => window.removeEventListener("scroll", hide, true);
  }, [active, hide]);
}

function TipBody({ title, rows = [] }: TipContent) {
  return (
    <>
      {title && (
        <div className="mb-1 font-semibold leading-snug text-gray-700 dark:text-zinc-300">
          {title}
        </div>
      )}
      {rows.length > 0 && (
        <div className="space-y-0.5">
          {rows.map((row, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 whitespace-nowrap tabular-nums"
            >
              {row.color && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: row.color }}
                />
              )}
              <span className="font-semibold">{row.label}</span>
              <span className="opacity-60">:</span>
              <span className="ml-auto pl-1.5 font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Tooltip standar seluruh dashboard, meniru `.dd-ctip` Overtime.
 *
 * Muncul seketika, tidak seperti atribut `title` bawaan browser yang menunggu
 * sekitar satu detik dan tampil polos. Dirender lewat portal supaya tidak
 * terpotong card dan tetap di atas modal (z-2000). Kotak diletakkan di atas
 * jangkar, digeser agar tidak keluar layar, dan pindah ke bawah bila ruang di
 * atas tidak cukup.
 */
export function FloatingTip({
  anchor,
  content,
}: {
  anchor: TipAnchor;
  content: TipContent | string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Ukuran kotak baru diketahui setelah dirender; posisinya dihitung sebelum
  // paint sehingga tidak ada kedipan di posisi awal.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const { offsetWidth: width, offsetHeight: height } = element;
    const left = Math.min(
      Math.max(anchor.x - width / 2, VIEWPORT_MARGIN),
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    const above = anchor.top - TIP_GAP - height;
    const top = above >= VIEWPORT_MARGIN ? above : anchor.bottom + TIP_GAP;

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.visibility = "visible";
  });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      style={{ left: 0, top: 0, visibility: "hidden" }}
      className="pointer-events-none fixed z-3000 max-w-65 rounded-[10px] border border-gray-100 bg-white px-2.75 py-2 font-sans text-[11.5px] leading-[1.45] font-medium text-gray-900 shadow-[0_8px_24px_rgba(17,24,39,0.12)] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {typeof content === "string" ? content : <TipBody {...content} />}
    </div>,
    document.body,
  );
}

/**
 * Pembungkus chart. Setiap elemen ber-`data-tip` di dalamnya mendapat tooltip
 * yang mengikuti kursor, dan elemen lain yang kuncinya berbeda diredupkan lewat
 * atribut `data-tip-dim` (aturannya di globals.css). Elemen yang berbagi kunci,
 * seperti potongan pie dan baris legendanya, menyala bersama.
 *
 * Hover dikelola di sini lewat event delegation, jadi komponen tab yang besar
 * tidak ikut render ulang setiap kali kursor bergerak.
 */
export function TipScope({
  getTip,
  className,
  children,
}: {
  /** Isi tooltip untuk nilai `data-tip` yang disorot; null = tanpa tooltip. */
  getTip: (key: string) => TipContent | null;
  className?: string;
  children: ReactNode;
}) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ key: string; anchor: TipAnchor } | null>(
    null,
  );

  const highlight = (key: string | null) => {
    scopeRef.current?.querySelectorAll("[data-tip]").forEach((element) => {
      element.toggleAttribute(
        "data-tip-dim",
        key !== null && element.getAttribute("data-tip") !== key,
      );
    });
  };

  const findTarget = (target: EventTarget, scope: Element) => {
    const element = (target as Element).closest?.("[data-tip]");
    const key = element?.getAttribute("data-tip");
    return element && key && scope.contains(element) ? { element, key } : null;
  };

  const clear = () => {
    highlight(null);
    setTip(null);
  };
  useHideOnScroll(tip !== null, clear);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const hit = findTarget(event.target, event.currentTarget);
    highlight(hit?.key ?? null);
    setTip(hit ? { key: hit.key, anchor: cursorAnchor(event) } : null);
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const hit = findTarget(event.target, event.currentTarget);
    if (!hit) return;
    highlight(hit.key);
    setTip({ key: hit.key, anchor: elementAnchor(hit.element) });
  };

  const content = tip ? getTip(tip.key) : null;

  return (
    <div
      ref={scopeRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={clear}
      onFocus={handleFocus}
      onBlur={clear}
    >
      {children}
      {tip && content && <FloatingTip anchor={tip.anchor} content={content} />}
    </div>
  );
}

/**
 * Tooltip untuk elemen statis (badge, tombol ikon, kartu) sebagai pengganti
 * atribut `title`. Sebarkan `triggerProps` ke elemen pemicu, lalu render `tip`
 * di mana saja di dalam komponen yang sama.
 */
export function useHoverTip(content: TipContent | string | null | undefined) {
  const [anchor, setAnchor] = useState<TipAnchor | null>(null);
  const show = (event: { currentTarget: Element }) =>
    setAnchor(elementAnchor(event.currentTarget));
  const hide = () => setAnchor(null);
  useHideOnScroll(anchor !== null, hide);

  return {
    triggerProps: content
      ? { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide }
      : {},
    tip:
      anchor && content ? (
        <FloatingTip anchor={anchor} content={content} />
      ) : null,
  };
}

/** `useHoverTip` dalam bentuk elemen `span`, untuk dipakai di dalam `map`. */
export function HoverTip({
  content,
  className,
  children,
}: {
  content: TipContent | string;
  className?: string;
  children: ReactNode;
}) {
  const { triggerProps, tip } = useHoverTip(content);
  return (
    <span className={className} {...triggerProps}>
      {children}
      {tip}
    </span>
  );
}
