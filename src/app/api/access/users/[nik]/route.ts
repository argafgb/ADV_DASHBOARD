import "server-only";
import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/access/session";
import { handleApiError } from "@/lib/access/api-response";
import { NikSchema, UpdateUserAccessSchema } from "@/lib/access/schemas";
import {
  getAccessUserDetailRaw,
  saveUserAccess,
} from "@/features/access-management/services/accessUserService";
import { getEmployee } from "@/features/access-management/services/employeeDirectoryService";
import { revalidateAccessChanges } from "@/lib/access/revalidate";

interface RouteContext {
  params: Promise<{ nik: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    await requireApiPermission(req, "access.users.manage");
    const { nik } = await context.params;
    const cleanNik = NikSchema.parse(decodeURIComponent(nik));

    const [emp, userDetail] = await Promise.all([
      getEmployee(cleanNik),
      getAccessUserDetailRaw(cleanNik),
    ]);

    return NextResponse.json({
      employee: emp
        ? {
            nik: emp.nik,
            name: emp.name,
            codeDivision: emp.code_division,
            codeDepartment: emp.code_department,
            branch: emp.branch ?? null,
            employeeActive: emp.is_active,
          }
        : null,
      access: userDetail ?? {
        enrolled: false,
        version: 0,
        status: "active",
        roleKey: "staff",
        overrides: [],
        scope: {
          all: false,
          departments: [],
          branches: emp?.branch ? [emp.branch.toUpperCase().trim()] : [],
          regions: [],
        },
        effectivePermissions: [],
        updatedAt: null,
        updatedBy: null,
      },
      canEdit: {
        ok: true,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const access = await requireApiPermission(req, "access.users.manage");
    const { nik } = await context.params;
    const cleanNik = NikSchema.parse(decodeURIComponent(nik));

    const body = await req.json();
    const validated = UpdateUserAccessSchema.parse(body);

    const actor = {
      nik: access.user.nik,
      permissions: access.permissions,
    };

    const result = await saveUserAccess(
      actor,
      cleanNik,
      {
        status: validated.status,
        roleKey: validated.roleKey ?? null,
        overrides: validated.overrides.map((o) => ({
          permission: o.permission,
          effect: o.effect,
        })),
        scope: validated.scope,
      },
      validated.expectedVersion,
    );

    revalidateAccessChanges();

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
