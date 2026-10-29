import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/jwt-verifier";
import { getIssuerAccess } from "@/lib/auth/issuer-access";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";

  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.split("=")[1];

  const isSkipAuth =
    (process.env.SKIP_AUTH === "true" ||
      process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ||
      process.env.DISABLE_AUTH === "true") &&
    process.env.NODE_ENV !== "production";

  if (isSkipAuth && !token) {
    return NextResponse.json({
      user: {
        id: "dev-local",
        nik: "DEV-LOCAL",
        username: "dev",
        name: "Developer (Auth Skipped)",
        role: "management",
        dataScope: { all: true },
      },
      access: {
        status: "active",
        roleKey: "super_admin",
        roleName: "Super Admin",
        permissions: ["*"],
      },
    });
  }
  if (!token) {
    return NextResponse.json(
      {
        user: null,
      },
      {
        status: 401,
      },
    );
  }

  const user = await verifyAuthToken(token);

  if (!user) {
    return NextResponse.json(
      {
        user: null,
      },
      {
        status: 401,
      },
    );
  }

  const issuer = await getIssuerAccess(token);
  if (issuer && issuer.user.nik === user.nik) {
    return NextResponse.json(
      { user: issuer.user, access: issuer.access },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Older, unregistered sessions have no fleet access profile.
  if (Array.isArray(user.allowedDashboards)) {
    return NextResponse.json(
      { user: null, message: "Akses menu belum dapat diverifikasi" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
