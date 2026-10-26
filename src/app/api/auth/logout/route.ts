import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";
import { safeReturnTo } from "@/lib/auth/return-to";

function clearCookie(response: NextResponse) {
  const isSecure = process.env.USE_SECURE_COOKIE === "true";

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(req: Request) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");

  const proto =
    req.headers.get("x-forwarded-proto") ||
    "http";

  let targetOrigin: string;

  if (host) {
    targetOrigin = `${proto}://${host}`;
  } else {
    targetOrigin = new URL(req.url).origin;
  }

  const loginUrl = new URL("/login", targetOrigin);
  const requestUrl = new URL(req.url);
  const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"));
  if (returnTo) {
    loginUrl.searchParams.set("returnTo", returnTo);
  }

  const response = NextResponse.redirect(loginUrl, 303);
  clearCookie(response);
  return response;
}

export async function POST() {
  const response = NextResponse.json({
    message: "Logout berhasil",
  });
  clearCookie(response);
  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
    },
  });
}
