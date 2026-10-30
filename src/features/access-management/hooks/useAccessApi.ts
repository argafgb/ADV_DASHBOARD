"use client";

import { useCallback } from "react";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export function useAccessApi() {
  const request = useCallback(
    async <T>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers);
      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
        ...options,
        headers,
      });

      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.location.assign("/login");
        }
        throw new ApiClientError("Sesi Anda telah berakhir.", 401, "UNAUTHENTICATED");
      }

      let data: Record<string, unknown> | null = null;
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        // non-json response
      }

      if (!res.ok) {
        const message =
          (typeof data?.message === "string" && data.message) ||
          `Permintaan gagal dengan status ${res.status}`;
        const code = typeof data?.code === "string" ? data.code : undefined;
        throw new ApiClientError(message, res.status, code);
      }

      return data as T;
    },
    [],
  );

  return { request };
}
