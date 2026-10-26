export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "wisecon_dashboard_session";

const isSecure = process.env.USE_SECURE_COOKIE === "true";

export const authCookieOptions = {
  httpOnly: true,
  secure: isSecure,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8, // 8 jam (28800 detik)
};
