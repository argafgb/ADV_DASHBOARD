import "server-only";
import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/access/session";
import { handleApiError } from "@/lib/access/api-response";
import { EmployeeSearchQuerySchema } from "@/lib/access/schemas";
import { searchEmployees } from "@/features/access-management/services/employeeDirectoryService";
import { getAccessStatusByNiksRaw } from "@/features/access-management/services/accessUserService";

export async function GET(req: Request) {
  try {
    await requireApiPermission(req, "access.users.manage");

    const url = new URL(req.url);
    const params = {
      q: url.searchParams.get("q") ?? "",
      limit: url.searchParams.get("limit") ?? 20,
    };

    const validated = EmployeeSearchQuerySchema.parse(params);

    const rawEmployees = await searchEmployees(validated.q, validated.limit);
    const employees = rawEmployees.filter((e) => e.is_active && !e.nik.includes("-"));
    const niks = employees.map((e) => e.nik);
    const accessMap = await getAccessStatusByNiksRaw(niks);

    const items = employees.map((emp) => {
      const accessInfo = accessMap.get(emp.nik);
      return {
        nik: emp.nik,
        name: emp.name,
        codeDivision: emp.code_division,
        codeDepartment: emp.code_department,
        branch: emp.branch ?? null,
        employeeActive: emp.is_active,
        access: accessInfo
          ? {
              enrolled: true,
              status: accessInfo.status,
              role:
                accessInfo.roleKey && accessInfo.roleName
                  ? { key: accessInfo.roleKey, name: accessInfo.roleName }
                  : null,
              hasOverrides: accessInfo.hasOverrides ?? false,
            }
          : {
              enrolled: false,
            },
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
