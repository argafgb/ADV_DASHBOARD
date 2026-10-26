import { jwtVerify, SignJWT } from "jose";
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

const DEFAULT_JWT_SECRET = "wisecon_unified_dashboard_secret_key_2026_secured";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(
  user: AuthUser,
  opts?: { expiresAt?: number | string },
): Promise<string> {
  const secretKey = getSecretKey();

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
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt();

  if (opts?.expiresAt) {
    builder.setExpirationTime(opts.expiresAt);
  } else {
    builder.setExpirationTime("8h");
  }

  return builder.sign(secretKey);
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthUser | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
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
