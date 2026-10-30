"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function useQuarterFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const quarter = searchParams?.get("quarter") || "ALL";

  const setQuarter = (q: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    const upperQ = q.toUpperCase();
    if (upperQ === "ALL") {
      params.delete("quarter");
    } else {
      params.set("quarter", upperQ);
      params.set("month", "ALL");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return {
    quarter,
    setQuarter,
  };
}
