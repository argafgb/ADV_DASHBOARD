import "server-only";

import { sql } from "@/lib/db";
import { verifyAuthToken } from "./jwt-verifier";

export type IssuerAccess = {
  user: {
    nik: string;
    role: string;
    allowedDashboards?: string[];
    [key: string]: unknown;
  };
  access: {
    status: "active";
    permissions: string[];
    roleKey?: string;
    roleName?: string;
    [key: string]: unknown;
  };
};

/** Read current Access Management permissions from local PostgreSQL helpdesk.access_* tables. */
export async function getIssuerAccess(token: string): Promise<IssuerAccess | null> {
  try {
    let nik = token;
    let allowedDashboards: string[] | undefined;

    if (token.includes(".")) {
      const verified = await verifyAuthToken(token);
      if (!verified) return null;
      nik = verified.nik;
      allowedDashboards = verified.allowedDashboards;
    }

    const rows = await sql<
      {
        nik: string;
        user_status: string;
        role_key: string | null;
        role_name: string | null;
        fleet_role: string | null;
        role_is_active: boolean | null;
        role_permissions: string[] | null;
        user_grants: string[] | null;
        user_revokes: string[] | null;
      }[]
    >`
      SELECT
        u.nik,
        u.status AS user_status,
        r.key AS role_key,
        r.name AS role_name,
        r.fleet_role,
        r.is_active AS role_is_active,
        ARRAY(
          SELECT rp.permission_key
          FROM helpdesk.access_role_permission rp
          WHERE rp.role_id = r.id
        ) AS role_permissions,
        ARRAY(
          SELECT up.permission_key
          FROM helpdesk.access_user_permission up
          WHERE up.nik = u.nik AND up.effect = 'grant'
        ) AS user_grants,
        ARRAY(
          SELECT up.permission_key
          FROM helpdesk.access_user_permission up
          WHERE up.nik = u.nik AND up.effect = 'revoke'
        ) AS user_revokes
      FROM helpdesk.access_user u
      LEFT JOIN helpdesk.access_role r ON r.id = u.role_id
      WHERE u.nik = ${nik}
      LIMIT 1;
    `;

    const row = rows[0];
    if (!row || row.user_status !== "active" || row.role_is_active === false) {
      return null;
    }

    const perms = new Set<string>(row.role_permissions ?? []);
    for (const grant of row.user_grants ?? []) {
      perms.add(grant);
    }
    for (const revoke of row.user_revokes ?? []) {
      perms.delete(revoke);
    }
    const permissions = Array.from(perms);

    const derivedDashboards = permissions.includes("*")
      ? [
          "helpdesk",
          "asset-pm",
          "pic-monitoring",
          "server-performance",
          "overtime",
          "process-risk",
          "learning-growth",
          "network-performance",
          "bug-tracker",
          "it-repair-maintenance",
          "kaldev-performance",
        ]
      : Array.from(
          new Set(
            permissions
              .filter((p) => p.startsWith("dashboard.") && p.endsWith(".view"))
              .map((p) => p.slice("dashboard.".length, -".view".length)),
          ),
        );

    const effectiveAllowedDashboards =
      allowedDashboards && allowedDashboards.length > 0
        ? Array.from(new Set([...allowedDashboards, ...derivedDashboards]))
        : derivedDashboards;

    return {
      user: {
        nik: row.nik,
        role: row.fleet_role || "management",
        allowedDashboards: effectiveAllowedDashboards,
      },
      access: {
        status: "active",
        permissions,
        ...(row.role_key ? { roleKey: row.role_key } : {}),
        ...(row.role_name ? { roleName: row.role_name } : {}),
      },
    };
  } catch {
    return null;
  }
}
