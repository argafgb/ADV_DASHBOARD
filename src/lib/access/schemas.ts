import { z } from "zod";
import { PERMISSION_KEYS, type PermissionKey } from "./catalog";
import { DEPARTMENTS, type Department } from "./data-scope";
import { isSelectableBranch } from "./branch-options";

export const NIK_REGEX = /^[A-Za-z0-9 .,'-]+$/;

export const NikSchema = z
  .string()
  .trim()
  .min(1, "NIK tidak boleh kosong")
  .max(40, "NIK maksimal 40 karakter")
  .regex(NIK_REGEX, "Format NIK tidak valid");

export const PermissionKeySchema = z.enum(
  PERMISSION_KEYS as unknown as [PermissionKey, ...PermissionKey[]],
);

export const DepartmentSchema = z.enum(
  DEPARTMENTS as unknown as [Department, ...Department[]],
);

export const UserOverrideSchema = z.object({
  permission: PermissionKeySchema,
  effect: z.enum(["grant", "revoke"]),
});

export const ScopeInputSchema = z.object({
  all: z.boolean(),
  departments: z.array(DepartmentSchema).optional().default([]),
  branches: z
    .array(
      z
        .string()
        .trim()
        .max(100)
        .refine(isSelectableBranch, "Site tidak valid atau tidak memiliki data"),
    )
    .max(100, "Maksimal 100 cabang")
    .optional()
    .default([]),
  regions: z
    .array(z.string().trim().max(50))
    .max(20, "Maksimal 20 region")
    .optional()
    .default([]),
});

export const UpdateUserAccessSchema = z
  .object({
    expectedVersion: z.number().int().positive().nullable().optional(),
    status: z.enum(["active", "suspended"]),
    roleKey: z.string().trim().min(2).max(40).nullable().optional(),
    overrides: z.array(UserOverrideSchema).optional().default([]),
    scope: ScopeInputSchema,
  })
  .strict();

export const CreateRoleSchema = z
  .object({
    key: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9-]{2,40}$/,
        "Key role hanya boleh huruf kecil, angka, dan strip (2-40 karakter)",
      ),
    name: z.string().trim().min(2, "Nama role minimal 2 karakter").max(100),
    description: z.string().trim().max(500).optional().nullable(),
    fleetRole: z.enum(["management", "internal"]),
    defaultScopeAll: z.boolean().default(false),
    permissions: z.array(PermissionKeySchema).default([]),
  })
  .strict();

export const UpdateRoleSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    name: z.string().trim().min(2, "Nama role minimal 2 karakter").max(100),
    description: z.string().trim().max(500).optional().nullable(),
    fleetRole: z.enum(["management", "internal"]),
    defaultScopeAll: z.boolean().default(false),
    isActive: z.boolean(),
    permissions: z.array(PermissionKeySchema).default([]),
  })
  .strict();

export const EmployeeSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Kata kunci minimal 2 karakter")
    .max(100, "Kata kunci maksimal 100 karakter")
    .regex(NIK_REGEX, "Karakter pencarian tidak valid"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const UserListQuerySchema = z.object({
  status: z.enum(["active", "suspended"]).optional(),
  roleKey: z.string().optional(),
  custom: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const AuditQuerySchema = z
  .object({
    q: z.string().optional(),
    action: z.string().optional(),
    category: z.enum(["Add", "Update", "Remove", "ALL"]).optional(),
    objectType: z
      .enum(["Role", "Dashboard", "Menu", "Data scope", "Cakupan Data", "Status", "ALL"])
      .optional(),
    targetNik: z.string().optional(),
    actorNik: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const d1 = new Date(data.from);
        const d2 = new Date(data.to);
        if (!Number.isNaN(d1.getTime()) && !Number.isNaN(d2.getTime())) {
          return d1.getTime() <= d2.getTime();
        }
      }
      return true;
    },
    {
      message: "Tanggal awal tidak boleh lebih besar dari tanggal akhir (backdate tidak diizinkan)",
      path: ["from"],
    },
  );

// Server actions hardened schemas
export const TicketNoItemSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9/._-]{1,40}$/, "Format nomor tiket tidak valid");

export const OverSlaDetailTicketsSchema = z
  .array(TicketNoItemSchema)
  .min(1, "Minimal 1 nomor tiket")
  .max(500, "Maksimal 500 tiket sekaligus");

export const RatingRootCauseFilterSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2050),
  month: z.string().max(20).optional(),
  dept: z.string().max(50).optional(),
  quarter: z.string().max(10).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  type_temuan: z.string().max(100).optional(),
  group_problem: z.string().max(100).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});
