import "server-only";
import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/access/session";
import { handleApiError } from "@/lib/access/api-response";
import { CreateRoleSchema } from "@/lib/access/schemas";
import {
  createRole,
  listRolesWithCountsRaw,
} from "@/features/access-management/services/accessRoleService";
import { revalidateAccessChanges } from "@/lib/access/revalidate";

export async function GET(req: Request) {
  try {
    await requireApiPermission(req, {
      anyOf: ["access.roles.manage", "access.users.manage"],
    });

    const items = await listRolesWithCountsRaw();
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const access = await requireApiPermission(req, "access.roles.manage");
    const body = await req.json();
    const validated = CreateRoleSchema.parse(body);

    const actor = {
      nik: access.user.nik,
      permissions: access.permissions,
    };

    const role = await createRole(actor, validated);
    revalidateAccessChanges();
    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
