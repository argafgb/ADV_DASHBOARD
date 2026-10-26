"use client";

import { useEffect, useState } from "react";

import type { AuthRole } from "@/lib/auth/dashboard-access";
import { isAuthRole } from "@/lib/auth/dashboard-access";

export type AuthRoleState = {
  role: AuthRole | null;
  /** Selama true, pemanggil sebaiknya belum menggambar apa pun yang bergantung role. */
  loading: boolean;
};

/**
 * Membaca role sesi dari `/api/auth/me`.
 *
 * Sengaja mengembalikan `loading` supaya penyaring katalog bisa menahan render
 * sampai role diketahui. Tanpa itu, entri yang seharusnya tersembunyi sempat
 * terlihat sekejap sebelum jawaban datang.
 */
export function useAuthRole(): AuthRoleState {
  const [state, setState] = useState<AuthRoleState>({
    role: null,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const role = data?.user?.role;
        setState({ role: isAuthRole(role) ? role : null, loading: false });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ role: null, loading: false });
      });

    return () => controller.abort();
  }, []);

  return state;
}
