"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Dropdown } from "./dropdown";

/**
 * Filter global "Project dari" (Semua / Bizdev / PIC) dari header desain.
 *
 * Header shell fleet hanya punya chip Tahun dan Bulan, jadi chip ini
 * ditempatkan pada baris judul halaman dan nilainya disimpan di URL (`from`)
 * supaya ikut terbawa ke semua halaman lewat `dashboard-navigation.ts`.
 */
export function SourceFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("from") === "Bizdev" || searchParams.get("from") === "PIC"
    ? (searchParams.get("from") as string)
    : "Semua";

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "Semua") params.delete("from");
    else params.set("from", next);
    // Halaman daftar kembali ke halaman 1 saat sumber berubah.
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Dropdown
      variant="filter"
      align="right"
      label="Project dari"
      value={value}
      options={["Semua", "Bizdev", "PIC"]}
      onChange={onChange}
    />
  );
}
