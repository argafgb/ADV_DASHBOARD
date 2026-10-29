import "server-only";
import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/access/session";
import { handleApiError } from "@/lib/access/api-response";
import { UpdateRoleSchema } from "@/lib/access/schemas";
import {
  getRoleRaw,
  updateRole,
  deleteRole,
} from "@/features/access-management/services/accessRoleService";
import { revalidateAccessChanges } from "@/lib/access/revalidate";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    await requireApiPermission(req, {
      anyOf: ["access.roles.manage", "access.users.manage"],
    });

    const { id } = await context.params;
    const roleId = Number.parseInt(id, 10);
    if (Number.isNaN(roleId)) {
      return NextResponse.json({ message: "ID role tidak valid" }, { status: 400 });
    }

    const role = await getRoleRaw(roleId);
    if (!role) {
      return NextResponse.json({ message: "Role tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const access = await requireApiPermission(req, "access.roles.manage");
    const { id } = await context.params;
    const roleId = Number.parseInt(id, 10);
    if (Number.isNaN(roleId)) {
      return NextResponse.json({ message: "ID role tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const validated = UpdateRoleSchema.parse(body);

    const actor = {
      nik: access.user.nik,
      permissions: access.permissions,
    };

    const role = await updateRole(actor, roleId, validated);
    revalidateAccessChanges();
    return NextResponse.json({ role });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const access = await requireApiPermission(req, "access.roles.manage");
    const { id } = await context.params;
    const roleId = Number.parseInt(id, 10);
    if (Number.isNaN(roleId)) {
      return NextResponse.json({ message: "ID role tidak valid" }, { status: 400 });
    }

    const actor = {
      nik: access.user.nik,
      permissions: access.permissions,
    };

    const result = await deleteRole(actor, roleId);
    revalidateAccessChanges();
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

