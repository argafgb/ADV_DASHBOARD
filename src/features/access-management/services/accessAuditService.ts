import "server-only";
import { sql } from "@/lib/db";
import type postgres from "postgres";
import type { AuditRowDraft } from "@/lib/access/access-diff";

export interface AuditLogEntry {
  action: string;
  resource: string | null;
  before: unknown;
  after: unknown;
}

export interface AuditLogItem {
  id: number;
  occurredAt: string;
  requestId: string;
  actor: {
    nik: string;
    name: string | null;
  };
  target: {
    type: "user" | "role";
    nik?: string;
    roleId?: number;
    label: string | null;
  };
  action: string;
  resource: string | null;
  before: unknown;
  after: unknown;
  /** Seluruh perubahan dalam satu aksi simpan (request_id yang sama). */
  entries: AuditLogEntry[];
}

export interface ListAuditQuery {
  q?: string;
  action?: string;
  category?: "Add" | "Update" | "Remove" | "ALL";
  objectType?: "Role" | "Dashboard" | "Menu" | "Data scope" | "Cakupan Data" | "Status" | "ALL";
  targetNik?: string;
  actorNik?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditRaw(
  query: ListAuditQuery = {},
): Promise<{ items: AuditLogItem[]; total: number }> {
  if (query.from && query.to) {
    const dFrom = new Date(query.from);
    const dTo = new Date(query.to);
    if (!Number.isNaN(dFrom.getTime()) && !Number.isNaN(dTo.getTime()) && dFrom.getTime() > dTo.getTime()) {
      throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir (backdate tidak diizinkan).");
    }
  }

  const page = Math.max(1, query.page || 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize || 50));
  const offset = (page - 1) * pageSize;

  const qCondition = query.q?.trim()
    ? sql`AND (
        a.actor_nik ILIKE ${"%" + query.q.trim() + "%"} OR
        a.actor_name ILIKE ${"%" + query.q.trim() + "%"} OR
        a.target_nik ILIKE ${"%" + query.q.trim() + "%"} OR
        a.target_label ILIKE ${"%" + query.q.trim() + "%"} OR
        a.action ILIKE ${"%" + query.q.trim() + "%"}
      )`
    : sql``;

  const actionCondition = query.action?.trim()
    ? sql`AND a.action = ${query.action.trim()}`
    : sql``;

  let categoryCondition = sql``;
  if (query.category === "Add") {
    categoryCondition = sql`AND a.action IN ('user.enrolled', 'user.permission_granted', 'role.created', 'role.permission_granted')`;
  } else if (query.category === "Update") {
    categoryCondition = sql`AND a.action IN ('user.activated', 'user.role_changed', 'user.role_assigned', 'user.scope_changed', 'user.override_cleared', 'role.updated')`;
  } else if (query.category === "Remove") {
    categoryCondition = sql`AND a.action IN ('user.suspended', 'user.permission_revoked', 'role.permission_revoked')`;
  }

  let objectCondition = sql``;
  if (query.objectType === "Role") {
    objectCondition = sql`AND (a.target_type = 'role' OR a.action IN ('user.role_changed', 'user.role_assigned', 'user.enrolled'))`;
  } else if (query.objectType === "Dashboard") {
    objectCondition = sql`AND a.resource ILIKE 'dashboard.%'`;
  } else if (query.objectType === "Menu") {
    objectCondition = sql`AND (a.action IN ('user.override_cleared', 'user.permission_granted', 'user.permission_revoked', 'role.permission_granted', 'role.permission_revoked') AND (a.resource NOT ILIKE 'dashboard.%' OR a.resource IS NULL))`;
  } else if (query.objectType === "Data scope" || query.objectType === "Cakupan Data") {
    objectCondition = sql`AND a.action = 'user.scope_changed'`;
  } else if (query.objectType === "Status") {
    objectCondition = sql`AND a.action IN ('user.activated', 'user.suspended')`;
  }

  const targetNikCondition = query.targetNik?.trim()
    ? sql`AND a.target_nik = ${query.targetNik.trim()}`
    : sql``;

  const actorNikCondition = query.actorNik?.trim()
    ? sql`AND a.actor_nik = ${query.actorNik.trim()}`
    : sql``;

  const fromCondition = query.from?.trim()
    ? sql`AND a.occurred_at >= ${query.from.trim()}::timestamptz`
    : sql``;

  const toCondition = query.to?.trim()
    ? sql`AND a.occurred_at <= ${query.to.trim()}::timestamptz`
    : sql``;

  // Satu aksi simpan (satu request_id) bisa menghasilkan banyak baris audit
  // (role, scope, puluhan izin). Log ditampilkan per aksi: filter diterapkan
  // pada baris mentah, lalu seluruh baris dari request yang cocok digabung.
  try {
    const [rows, countRow] = await Promise.all([
      sql<{
        id: number;
        occurred_at: Date;
        request_id: string;
        actor_nik: string;
        actor_name: string | null;
        target_type: "user" | "role";
        target_nik: string | null;
        target_role_id: number | null;
        target_label: string | null;
        entries: AuditLogEntry[];
      }[]>`
        WITH matched AS (
          SELECT a.request_id
          FROM helpdesk.access_audit_log a
          WHERE TRUE
            ${qCondition}
            ${actionCondition}
            ${categoryCondition}
            ${objectCondition}
            ${targetNikCondition}
            ${actorNikCondition}
            ${fromCondition}
            ${toCondition}
          GROUP BY a.request_id
        )
        SELECT
          MIN(l.id)::int AS id,
          MAX(l.occurred_at) AS occurred_at,
          l.request_id::text AS request_id,
          (array_agg(l.actor_nik ORDER BY l.id))[1] AS actor_nik,
          (array_agg(l.actor_name ORDER BY l.id))[1] AS actor_name,
          (array_agg(l.target_type ORDER BY l.id))[1] AS target_type,
          (array_agg(l.target_nik ORDER BY l.id))[1] AS target_nik,
          (array_agg(l.target_role_id ORDER BY l.id))[1] AS target_role_id,
          (array_agg(l.target_label ORDER BY l.id))[1] AS target_label,
          json_agg(
            json_build_object(
              'action', l.action,
              'resource', l.resource,
              'before', l.before_value,
              'after', l.after_value
            ) ORDER BY l.id
          ) AS entries
        FROM helpdesk.access_audit_log l
        JOIN matched m ON m.request_id = l.request_id
        GROUP BY l.request_id
        ORDER BY MAX(l.occurred_at) DESC, MIN(l.id) DESC
        LIMIT ${pageSize} OFFSET ${offset};
      `,
      sql<{ total: number }[]>`
        SELECT COUNT(DISTINCT a.request_id)::int AS total
        FROM helpdesk.access_audit_log a
        WHERE TRUE
          ${qCondition}
          ${actionCondition}
          ${categoryCondition}
          ${objectCondition}
          ${targetNikCondition}
          ${actorNikCondition}
          ${fromCondition}
          ${toCondition};
      `,
    ]);

    const items: AuditLogItem[] = rows.map((r) => {
      const entries = Array.isArray(r.entries) ? r.entries : [];
      const first = entries[0];
      return {
        id: r.id,
        occurredAt: new Date(r.occurred_at).toISOString(),
        requestId: r.request_id,
        actor: {
          nik: r.actor_nik,
          name: r.actor_name,
        },
        target: {
          type: r.target_type,
          nik: r.target_nik ?? undefined,
          roleId: r.target_role_id ?? undefined,
          label: r.target_label,
        },
        action: first?.action ?? "",
        resource: first?.resource ?? null,
        before: first?.before ?? null,
        after: first?.after ?? null,
        entries,
      };
    });

    return { items, total: countRow[0]?.total ?? 0 };
  } catch (err) {
    console.error("[AUDIT_LIST_ERROR]", err);
    return { items: [], total: 0 };
  }
}

export async function insertAuditRows(
  sqlTx: postgres.Sql | postgres.TransactionSql,
  entries: AuditRowDraft[],
  requestId: string,
  actor: { nik: string; name?: string | null },
  target: {
    type: "user" | "role";
    nik?: string;
    roleId?: number;
    label?: string | null;
  },
): Promise<number[]> {
  if (entries.length === 0) return [];

  const insertedIds: number[] = [];
  for (const entry of entries) {
    const rows = await sqlTx<{ id: number }[]>`
      INSERT INTO helpdesk.access_audit_log (
        request_id,
        actor_nik,
        actor_name,
        target_type,
        target_nik,
        target_role_id,
        target_label,
        action,
        resource,
        before_value,
        after_value
      ) VALUES (
        ${requestId}::uuid,
        ${actor.nik},
        ${actor.name ?? null},
        ${target.type},
        ${target.nik ?? null},
        ${target.roleId ?? null},
        ${target.label ?? null},
        ${entry.action},
        ${entry.resource},
        ${entry.before_value ? JSON.stringify(entry.before_value) : null}::jsonb,
        ${entry.after_value ? JSON.stringify(entry.after_value) : null}::jsonb
      )
      RETURNING id;
    `;
    if (rows[0]) {
      insertedIds.push(rows[0].id);
    }
  }

  return insertedIds;
}
