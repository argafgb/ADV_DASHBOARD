import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { safeReturnTo } from "@/lib/auth/return-to";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  const isSkipAuth =
    (process.env.SKIP_AUTH === "true" ||
      process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ||
      process.env.DISABLE_AUTH === "true") &&
    process.env.NODE_ENV !== "production";

  if (isSkipAuth) {
    if (isLoginPage) {
      return NextResponse.redirect(
        new URL("/dashboard/asset-maintenance", request.url),
      );
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isDashboardPath = pathname.startsWith("/dashboard");

  if (!token) {
    if (isLoginPage) {
      return NextResponse.next();
    }

    if (isDashboardPath) {
      const loginUrl = new URL("/login", request.url);
      const returnTo = safeReturnTo(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      loginUrl.searchParams.set("returnTo", returnTo);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    const response = isLoginPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.USE_SECURE_COOKIE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  }

  if (isLoginPage) {
    const returnToParam = request.nextUrl.searchParams.get("returnTo");
    const targetUrl = returnToParam
      ? safeReturnTo(returnToParam)
      : "/dashboard/asset-maintenance";
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
