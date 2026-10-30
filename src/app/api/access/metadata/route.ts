import "server-only";
import { NextResponse } from "next/server";

import { requireApiPermission } from "@/lib/access/session";
import { handleApiError } from "@/lib/access/api-response";
import { PERMISSION_CATALOG } from "@/lib/access/catalog";
import { DEPARTMENTS } from "@/lib/access/data-scope";
import {
  getBranchOptionsData,
  getRegionsRaw,
} from "@/features/access-management/services/accessMetadataService";

export async function GET(req: Request) {
  try {
    await requireApiPermission(req, {
      anyOf: ["access.users.manage", "access.roles.manage"],
    });

    const [branches, regions] = await Promise.all([
      getBranchOptionsData(),
      getRegionsRaw(),
    ]);

    return NextResponse.json({
      catalog: PERMISSION_CATALOG,
      departments: DEPARTMENTS,
      branches,
      regions,
      fleetRoles: [
        { value: "internal", deniedDashboards: [] },
        { value: "management", deniedDashboards: ["bug-tracker"] },
      ],
    });
  } catch (err) {
    return handleApiError(err);
  }
}
