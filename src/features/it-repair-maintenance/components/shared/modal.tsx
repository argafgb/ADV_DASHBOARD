"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconClose } from "./icons";

const subscribeNoop = () => () => {};

/**
 * `Modal` design system: overlay gelap, panel putih maksimum 980px dengan
 * kepala lengket (judul + chip konteks + tombol tutup), badan menggulir,
 * dan footer opsional. Escape atau klik overlay menutup.
 *
 * Dirender lewat portal ke `document.body`, seperti di desain: `main` shell
 * memiliki stacking context sendiri (`isolate z-0`), jadi overlay `fixed`
 * yang dirender di dalamnya akan tertimpa sidebar dan navbar.
 */
export function Modal({
  title,
  context,
  children,
  footer,
  size = "lg",
  onClose,
}: {
  title: ReactNode;
  context?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "lg" | "sm";
  onClose: () => void;
}) {
  // Portal butuh `document`; saat SSR modal belum dirender, muncul setelah hidrasi.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="it-repair-scope dd-overlay fixed inset-0 z-[100] backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className={["dd-modal", size === "sm" ? "dd-modal--sm" : ""].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dd-modal__head">
          <div className="dd-modal__title">{title}</div>
          {context}
          <div style={{ marginLeft: "auto" }}>
            <button type="button" className="dd-iconbtn" aria-label="Tutup" onClick={onClose}>
              <IconClose />
            </button>
          </div>
        </div>
        <div className="dd-modal__body">{children}</div>
        {footer && <div className="dd-modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
