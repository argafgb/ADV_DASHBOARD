"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lebar elemen terukur, dipakai chart SVG yang menggambar sendiri sumbunya.
 *
 * Mockup menghitung lebar chart dari DOM lalu menggambar viewBox seukuran itu,
 * bukan memakai `preserveAspectRatio`, supaya tinggi teks sumbu tidak ikut
 * meregang saat kartu melebar.
 */
export function useMeasuredWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Jumlah kolom yang benar-benar dipakai oleh grid `auto-fill`/`auto-fit`.
 *
 * Grid yang responsif memutuskan sendiri berapa kolom yang muat, jadi ukuran
 * halaman tidak boleh dipatok angka tetap: 6 kartu pada grid 4 kolom berarti
 * satu baris penuh lalu dua slot menganggur, sementara sisanya terdorong ke
 * halaman berikutnya tanpa alasan yang terlihat pengguna. Dengan mengukur
 * kolomnya, pemanggil bisa membulatkan ukuran halaman ke baris penuh.
 */
export function useGridColumns<T extends HTMLElement>(fallback = 1) {
  const ref = useRef<T | null>(null);
  const [columns, setColumns] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const template = getComputedStyle(node).gridTemplateColumns;
      // `grid-template-columns` terhitung berupa daftar lebar piksel, satu per
      // kolom - jumlah entrinya itulah jumlah kolom yang sedang dipakai.
      const next = template.split(" ").filter(Boolean).length;
      if (next > 0) setColumns(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, columns] as const;
}

/**
 * Langkah sumbu "bulat" ala mockup: nilai maksimum dibagi empat, lalu
 * dibulatkan ke atas ke 1/1,5/2/2,5/3/4/5/7,5/10 × pangkat sepuluh terdekat.
 * Sumbu selalu berakhir di `step * 4` sehingga jumlah garis grid tetap lima.
 */
export function niceAxis(max: number, steps: readonly number[] = FINE_STEPS) {
  const raw = Math.max(max, 1) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / magnitude;
  const step = (steps.find((s) => norm <= s) ?? 10) * magnitude;
  return { step, top: step * 4 };
}

const FINE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5] as const;

/** Varian langkah yang lebih kasar, dipakai bar chart rasio pada mockup. */
export const COARSE_STEPS = [1, 2, 2.5, 5] as const;

/** Angka format Indonesia dengan jumlah desimal tetap. */
export function idNum(value: number, digits = 0) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
