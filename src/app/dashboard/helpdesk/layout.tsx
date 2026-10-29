import React from "react";
import { connection } from "next/server";
import { sql } from "@/lib/db";
import { HelpdeskFilterProvider } from "@/context/HelpdeskFilterContext";
import { HelpdeskTopbarFilters } from "@/features/helpdesk/components/HelpdeskTopbarFilters";

async function getHelpdeskSyncedAt(): Promise<string | null> {
  try {
    const rows = await sql<{ synced_at: Date | string | null }[]>`
      SELECT MAX(created_at) AS synced_at FROM helpdesk.helpdesk_trx
    `;
    const syncedAt = rows[0]?.synced_at;
    return syncedAt ? new Date(syncedAt).toISOString() : null;
  } catch {
    return null;
  }
}

export default async function HelpdeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const syncedAt = await getHelpdeskSyncedAt();

  return (
    <HelpdeskFilterProvider syncedAt={syncedAt}>
      <HelpdeskTopbarFilters />
      {children}
    </HelpdeskFilterProvider>
  );
}
