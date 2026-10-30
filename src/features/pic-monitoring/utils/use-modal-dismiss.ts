"use client";

import { useEffect } from "react";

/**
 * Menyeragamkan cara menutup modal di seluruh dashboard: tombol Escape menutup
 * dialog dan halaman di belakangnya dikunci supaya tidak ikut ter-scroll.
 *
 * Klik pada area gelap ditangani terpisah lewat `backdropDismissProps` karena
 * setiap modal memiliki struktur elemen yang berbeda.
 */
export function useModalDismiss(isOpen: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onDismiss]);
}

/**
 * Props untuk elemen backdrop. Memakai `onMouseDown` supaya seleksi teks yang
 * berakhir di luar panel tidak ikut menutup modal, dan hanya menutup ketika
 * penekanan benar-benar terjadi pada backdrop itu sendiri.
 */
export function backdropDismissProps(onDismiss: () => void) {
  return {
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) onDismiss();
    },
  };
}
