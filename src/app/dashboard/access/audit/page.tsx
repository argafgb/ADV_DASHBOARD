export const instant = false;

import { connection } from "next/server";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import { AccessAuditClient } from "@/features/access-management/components/AccessAuditClient";
import { AccessAuditSkeleton } from "@/features/access-management/components/AccessSkeletons";

export default async function AccessAuditPage() {
  await connection();
  await requirePagePermission("access.audit.view");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Audit Log Akses
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Riwayat kronologis seluruh mutasi hak akses, penugasan role, dan cakupan data pengguna.
        </p>
      </header>

      <Suspense fallback={<AccessAuditSkeleton />}>
        <AccessAuditClient />
      </Suspense>
    </div>
  );
}
