import "server-only";

import { AUTH_COOKIE_NAME } from "./jwt-verifier";

const DEFAULT_LOGIN_URL = "http://103.76.204.104:5703/login";

export type IssuerAccess = {
  user: {
    nik: string;
    role: string;
    allowedDashboards?: string[];
    [key: string]: unknown;
  };
  access: {
    status: "active";
    permissions: string[];
    [key: string]: unknown;
  };
};

/** Read current Access Management permissions, since the JWT has no fleet menu claim. */
export async function getIssuerAccess(token: string): Promise<IssuerAccess | null> {
  try {
    const base = process.env.AUTH_ISSUER_URL || process.env.NEXT_PUBLIC_LOGIN_URL || DEFAULT_LOGIN_URL;
    const endpoint = new URL("/api/auth/me", base);
    const response = await fetch(endpoint, {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return null;
    const data = body as Record<string, unknown>;
    if (!data.user || typeof data.user !== "object") return null;
    if (!data.access || typeof data.access !== "object") return null;
    const user = data.user as Record<string, unknown>;
    const access = data.access as Record<string, unknown>;
    if (typeof user.nik !== "string" || typeof user.role !== "string" || access.status !== "active") return null;
    if (!Array.isArray(access.permissions) || !access.permissions.every((item) => typeof item === "string")) return null;
    if (user.allowedDashboards !== undefined &&
      (!Array.isArray(user.allowedDashboards) || !user.allowedDashboards.every((item) => typeof item === "string"))) return null;
    return data as IssuerAccess;
  } catch {
    return null;
  }
}
