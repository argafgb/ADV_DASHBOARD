export const instant = false;

import { connection } from "next/server";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import { AccessUsersClient } from "@/features/access-management/components/AccessUsersClient";
import { AccessUsersSkeleton } from "@/features/access-management/components/AccessSkeletons";

export default async function AccessUsersPage() {
  await connection();
  await requirePagePermission("access.users.manage");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          User Access Management
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Kelola penugasan role, hak akses menu spesifik, dan batasan cakupan data organisasi per pengguna.
        </p>
      </header>

      <Suspense fallback={<AccessUsersSkeleton />}>
        <AccessUsersClient />
      </Suspense>
    </div>
  );
}
