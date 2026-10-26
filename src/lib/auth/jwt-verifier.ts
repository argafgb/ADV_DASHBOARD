import { importSPKI, jwtVerify } from "jose";

import { isAuthRole, type AuthRole } from "@/lib/auth/dashboard-access";
import { parseDataScope, type DataScope } from "@/lib/auth/data-scope";

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "wisecon_dashboard_session";

export type AuthUser = {
  id: string;
  nik: string;
  username: string;
  name: string;
  role: AuthRole;
  avatarUrl?: string;
  codeDivision?: string;
  allowedDashboards?: string[];
  permissions?: string[];
  dataScope: DataScope;
};

const DEFAULT_JWT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt+O2OWr46+TwvAlAHstw
oLCtj/RyuwN5nmL7cXzz7JbgT1cqy/AnVigQcHuKQKDp5HeTvh7FOn0Nek1e/OQu
OzFjU9WMLllSErQObqWOVa+xSyEAhMlXo/Ws5NssH0iOUSZTlMBVWzF8B84Uxogd
TRwCjW1CJ+D3Mc/06x4qzrLw8Wq2dTXDEEY+inkDVpSU8SUVQsn0WQYQhrqMhuQe
X7RKHXRvrLtk2vNcg3lCrv+iBFfl6jHycU8Rn7HTxVcPYOsxe/fJF02LUyOEaHZg
00eXXn7jFFSnvBiYOR2ITYgnT5xxKOMcssfINTAQA6Edrgf6h+mm+szctyOuSQvS
BQIDAQAB
-----END PUBLIC KEY-----`;

function getPublicKeyPem(): string {
  const key = process.env.JWT_PUBLIC_KEY?.trim() || DEFAULT_JWT_PUBLIC_KEY;
  return key.replace(/\\n/g, "\n");
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const publicKey = await importSPKI(getPublicKeyPem(), "RS256");
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
    });

    // Role ikut divalidasi: token tanpa role yang dikenal ditolak, bukan
    // diturunkan ke role default. Memberi nilai bawaan di sini akan membuat
    // token yang claim role-nya dibuang justru mendapat akses paling luas.
    if (
      typeof payload.id !== "string" ||
      typeof payload.nik !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string" ||
      !isAuthRole(payload.role)
    ) {
      return null;
    }

    return {
      id: payload.id as string,
      nik: payload.nik as string,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role,
      dataScope: parseDataScope(payload.dataScope),
      avatarUrl: [
        payload.picture,
        payload.avatar_url,
        payload.avatarUrl,
        payload.image,
      ].find(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
      ...(typeof payload.codeDivision === "string" && payload.codeDivision
        ? { codeDivision: payload.codeDivision }
        : {}),
      ...(Array.isArray(payload.allowedDashboards)
        ? {
            allowedDashboards: payload.allowedDashboards.filter(
              (d): d is string => typeof d === "string",
            ),
          }
        : {}),
      ...(Array.isArray(payload.permissions)
        ? {
            permissions: payload.permissions.filter(
              (p): p is string => typeof p === "string",
            ),
          }
        : {}),
    };
  } catch (err) {
    console.error("[JWT_VERIFY_ERROR]", err);
    return null;
  }
}
