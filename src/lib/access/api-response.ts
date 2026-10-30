import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AccessDeniedError,
  AccessUnavailableError,
  UnauthenticatedError,
  VersionConflictError,
} from "./errors";

export function jsonError(
  status: number,
  message: string,
  code?: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      message,
      ...(code ? { code } : {}),
      ...(extra ?? {}),
    },
    { status },
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof UnauthenticatedError) {
    return jsonError(401, err.message, "UNAUTHENTICATED");
  }

  if (err instanceof AccessDeniedError) {
    return jsonError(err.status, err.message, err.code);
  }

  if (err instanceof VersionConflictError) {
    return jsonError(err.status, err.message, err.code);
  }

  if (err instanceof AccessUnavailableError) {
    return jsonError(err.status, err.message, "SERVICE_UNAVAILABLE");
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue?.message ?? "Format data tidak valid";
    return jsonError(400, message, "VALIDATION_ERROR", {
      issues: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }

  console.error("[API_UNHANDLED_ERROR]", err);

  // Detail teknis hanya disertakan bila ACCESS_DEBUG_ERRORS=true (mis. di
  // server development) supaya penyebab 500 terlihat dari Network tab tanpa
  // akses ke log container. Jangan aktifkan di production.
  const debug =
    process.env.ACCESS_DEBUG_ERRORS === "true" && err instanceof Error
      ? {
          debug: {
            name: err.name,
            message: err.message,
            pgCode: (err as { code?: unknown }).code ?? null,
          },
        }
      : undefined;

  return jsonError(
    500,
    "Terjadi kesalahan internal server.",
    "INTERNAL_ERROR",
    debug,
  );
}
