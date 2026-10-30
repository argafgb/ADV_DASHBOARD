export const instant = false;
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import SlaClient from "@/features/pic-monitoring/components/SlaClient";

export default async function SlaPage() {
  await connection();
  await requirePagePermission("menu.pic-monitoring.milestone-sla.view");

  return <SlaClient />;
}
