import "server-only";
import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/access/session";
import { handleApiError } from "@/lib/access/api-response";
import { AuditQuerySchema } from "@/lib/access/schemas";
import { listAuditRaw } from "@/features/access-management/services/accessAuditService";

export async function GET(req: Request) {
  try {
    await requireApiPermission(req, "access.audit.view");

    const url = new URL(req.url);
    const rawQuery = {
      q: url.searchParams.get("q") || undefined,
      action: url.searchParams.get("action") || undefined,
      category: url.searchParams.get("category") || undefined,
      objectType: url.searchParams.get("objectType") || undefined,
      targetNik: url.searchParams.get("targetNik") || undefined,
      actorNik: url.searchParams.get("actorNik") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      page: url.searchParams.get("page") || 1,
      pageSize: url.searchParams.get("pageSize") || 50,
    };

    const validated = AuditQuerySchema.parse(rawQuery);
    const result = await listAuditRaw(validated);

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
