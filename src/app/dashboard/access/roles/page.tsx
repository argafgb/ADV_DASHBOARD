export const instant = false;

import { connection } from "next/server";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import { AccessRolesClient } from "@/features/access-management/components/AccessRolesClient";
import { AccessRolesSkeleton } from "@/features/access-management/components/AccessSkeletons";

export default async function AccessRolesPage() {
  await connection();
  await requirePagePermission("access.roles.manage");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Roles &amp; Permissions
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Konfigurasi template role standar untuk menyederhanakan penugasan hak akses pengguna.
        </p>
      </header>

      <Suspense fallback={<AccessRolesSkeleton />}>
        <AccessRolesClient />
      </Suspense>
    </div>
  );
}
