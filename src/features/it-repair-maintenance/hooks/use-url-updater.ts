"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type UrlPatch = Record<string, string | number | null | undefined>;

function applyPatch(current: URLSearchParams, patch: UrlPatch): URLSearchParams {
  const params = new URLSearchParams(current.toString());
  for (const [k, v] of Object.entries(patch)) {
    // null / kosong / "Semua" berarti "lepas filter ini", bukan mencari nilai itu.
    if (v == null || v === "" || v === "Semua") params.delete(k);
    else params.set(k, String(v));
  }
  return params;
}

/**
 * Seluruh state halaman (filter tabel, pencarian, halaman, modal) hidup di
 * URL supaya bisa di-share dan dihitung di server. Hook ini memberi dua alat:
 * `href(patch)` untuk tautan (KPI, tab) dan `update(patch)` untuk aksi klik.
 */
export function useUrlUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const href = (patch: UrlPatch): string => {
    const query = applyPatch(searchParams, patch).toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const update = (patch: UrlPatch, mode: "push" | "replace" = "push") => {
    const next = href(patch);
    if (mode === "replace") router.replace(next, { scroll: false });
    else router.push(next, { scroll: false });
  };

  return { href, update, searchParams };
}
