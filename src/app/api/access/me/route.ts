import "server-only";
import { NextResponse } from "next/server";

import { getCurrentAccess } from "@/lib/access/session";
import { firstAllowedPath } from "@/lib/access/effective-access";
import { refreshedSessionUser, sessionClaimsChanged } from "@/lib/access/session-claims";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/auth-cookie";
import { signAuthToken } from "@/lib/auth/jwt";
import { handleApiError } from "@/lib/access/api-response";

export async function GET() {
  try {
    const access = await getCurrentAccess();
    if (!access) {
      return NextResponse.json({ message: "Sesi tidak valid" }, { status: 401 });
    }

    if (access.status !== "active") {
      const res = NextResponse.json(
        { message: "Akses akun Anda sedang dinonaktifkan." },
        { status: 401 },
      );
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    const homePath = firstAllowedPath(access.permissions);
    const updatedUser = refreshedSessionUser(access);
    const isClaimStale = sessionClaimsChanged(access.user, updatedUser);

    const res = NextResponse.json({
      user: updatedUser,
      access: {
        source: access.source,
        status: access.status,
        role: access.roleKey
          ? { key: access.roleKey, name: access.roleName ?? access.roleKey }
          : null,
        fleetRole: access.fleetRole,
        permissions: Array.from(access.permissions).sort(),
        scope: access.scope,
        version: access.version,
        homePath,
      },
    });

    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");

    // Otomatis tandatangani ulang dan perbarui cookie JWT jika role atau izin menu berubah
    const userExp = (access.user as Record<string, unknown>).exp as number | undefined;
    if (isClaimStale && userExp) {
      const freshToken = await signAuthToken(
        {
          id: updatedUser.id,
          nik: updatedUser.nik,
          username: updatedUser.username,
          name: updatedUser.name,
          role: updatedUser.role,
          avatarUrl: updatedUser.avatarUrl,
          codeDivision: updatedUser.codeDivision,
          allowedDashboards: updatedUser.allowedDashboards,
          permissions: updatedUser.permissions,
          dataScope: (updatedUser.dataScope ?? { all: true }) as any,
        },
        {
          expiresAt: userExp,
        },
      );

      res.cookies.set(AUTH_COOKIE_NAME, freshToken, authCookieOptions);
    }

    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
