export const instant = false;
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import PipelinesClient from "@/features/pic-monitoring/components/PipelinesClient";

export default async function PipelinesPage() {
  await connection();
  await requirePagePermission("menu.pic-monitoring.pipelines.view");

  return <PipelinesClient />;
}
