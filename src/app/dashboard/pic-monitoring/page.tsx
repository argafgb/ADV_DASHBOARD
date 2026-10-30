export const instant = false;
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import OverviewClient from "@/features/pic-monitoring/components/OverviewClient";

export default async function OverviewPage() {
  await connection();
  await requirePagePermission("menu.pic-monitoring.overview.view");

  return <OverviewClient />;
}
