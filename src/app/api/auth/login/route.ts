import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/auth-cookie";
import { signAuthToken } from "@/lib/auth/jwt";
import {
  checkRateLimit,
  clientKeyFor,
  resetRateLimit,
} from "@/lib/auth/rate-limit";
import { authenticateUser } from "@/lib/auth/user-provider";

const IDENTIFIER_PATTERN = /^[A-Za-z0-9@.+_%-]+$/;

const LoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "NIK / Email / No. HP wajib diisi")
    .max(128, "NIK / Email / No. HP tidak valid")
    .regex(IDENTIFIER_PATTERN, "NIK / Email / No. HP tidak valid"),
  password: z
    .string()
    .min(1, "Password wajib diisi")
    .max(256, "Password terlalu panjang"),
});

const MAX_BODY_BYTES = 4096;

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);

    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { message: "Payload login tidak valid" },
        { status: 413 },
      );
    }

    const rawBody = await req.text();

    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { message: "Payload login tidak valid" },
        { status: 413 },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { message: "Payload login tidak valid" },
        { status: 400 },
      );
    }

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Payload login tidak valid" },
        { status: 400 },
      );
    }

    const { identifier, password } = parsed.data;

    const rateKey = clientKeyFor(req, identifier);
    const limit = checkRateLimit(rateKey);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          message: `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const result = await authenticateUser(identifier, password);

    if (!result.ok) {
      if (result.reason === "access_denied") {
        return NextResponse.json(
          {
            message:
              "Akun Anda belum memiliki atau sedang dinonaktifkan aksesnya ke dashboard. Hubungi administrator.",
          },
          { status: 403 },
        );
      }

      if (result.reason === "backend_unavailable") {
        return NextResponse.json(
          {
            message:
              "Layanan autentikasi sedang tidak tersedia. Coba beberapa saat lagi.",
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { message: "NIK / Email / No. HP atau password salah" },
        { status: 401 },
      );
    }

    resetRateLimit(rateKey);

    const token = await signAuthToken(result.user);

    const response = NextResponse.json({
      message: "Login berhasil",
      user: {
        nik: result.user.nik,
        name: result.user.name,
        role: result.user.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);

    return response;
  } catch (error) {
    console.error("[AUTH_LOGIN_FATAL]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan internal. Coba lagi." },
      { status: 500 },
    );
  }
}
