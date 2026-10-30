"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/** Shell modal: overlay gelap + panel putih + Escape untuk menutup (rendered via Portal ke document.body). */
export default function ModalShell({
  width,
  maxHeight = 640,
  onClose,
  children,
}: {
  width: number;
  maxHeight?: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="network-modal-overlay network-performance-scope"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,17,32,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 9999,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: width + "px",
          maxWidth: "100%",
          maxHeight: "min(" + maxHeight + "px, calc(100dvh - 32px))",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-card)",
          boxShadow: "0 24px 80px rgba(0,0,0,.35)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Tombol X kanan-atas modal — persis markup sumber. */
export function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Tutup dialog"
      onClick={onClose}
      style={{
        width: "32px",
        height: "32px",
        flexShrink: 0,
        borderRadius: "var(--radius-base)",
        border: "1px solid var(--border-default)",
        background: "var(--bg-card)",
        cursor: "pointer",
        color: "var(--text-muted)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
