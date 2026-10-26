import { importPKCS8, importSPKI, jwtVerify, SignJWT } from "jose";
import { isAuthRole, type AuthRole } from "@/lib/auth/dashboard-access";
import { parseDataScope, type DataScope } from "@/lib/auth/data-scope";
export type { AuthRole } from "@/lib/auth/dashboard-access";

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

type JwtPayload = {
  id: string;
  nik: string;
  username: string;
  name: string;
  role: AuthRole;
  avatarUrl?: string;
  codeDivision?: string;
  allowedDashboards?: string[];
  permissions?: string[];
  dataScope?: DataScope;
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

function getPrivateKeyPem(): string {
  const key = process.env.JWT_PRIVATE_KEY?.trim();
  if (!key) {
    throw new Error("JWT_PRIVATE_KEY wajib diisi di .env");
  }
  return key.replace(/\\n/g, "\n");
}

export async function signAuthToken(
  user: AuthUser,
  opts?: { expiresAt?: number | string },
): Promise<string> {
  const privateKey = await importPKCS8(getPrivateKeyPem(), "RS256");

  const builder = new SignJWT({
    id: user.id,
    nik: user.nik,
    username: user.username,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    codeDivision: user.codeDivision,
    dataScope: user.dataScope,
    ...(user.allowedDashboards
      ? { allowedDashboards: user.allowedDashboards }
      : {}),
    ...(user.permissions ? { permissions: user.permissions } : {}),
  } satisfies JwtPayload)
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(user.id)
    .setIssuedAt();

  if (opts?.expiresAt) {
    builder.setExpirationTime(opts.expiresAt);
  } else {
    builder.setExpirationTime("8h");
  }

  return builder.sign(privateKey);
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthUser | null> {
  try {
    const publicKey = await importSPKI(getPublicKeyPem(), "RS256");
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
    });

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
          typeof value === "string" && value.length > 0,
      ),
      codeDivision:
        typeof payload.codeDivision === "string"
          ? payload.codeDivision
          : undefined,
      allowedDashboards: Array.isArray(payload.allowedDashboards)
        ? (payload.allowedDashboards as string[])
        : undefined,
      permissions: Array.isArray(payload.permissions)
        ? (payload.permissions as string[])
        : undefined,
    };
  } catch {
    return null;
  }
}
