import "server-only";
import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/access/session";
import { handleApiError } from "@/lib/access/api-response";
import { UserListQuerySchema } from "@/lib/access/schemas";
import { listAccessUsersRaw } from "@/features/access-management/services/accessUserService";

export async function GET(req: Request) {
  try {
    await requireApiPermission(req, "access.users.manage");

    const url = new URL(req.url);
    const rawQuery = {
      status: url.searchParams.get("status") || undefined,
      roleKey: url.searchParams.get("roleKey") || undefined,
      custom: url.searchParams.get("custom") || undefined,
      q: url.searchParams.get("q") || undefined,
      page: url.searchParams.get("page") || 1,
      pageSize: url.searchParams.get("pageSize") || 50,
    };

    const validated = UserListQuerySchema.parse(rawQuery);
    const result = await listAccessUsersRaw(validated);

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
