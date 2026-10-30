export const instant = false;

import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import OverviewView from "@/features/learning-growth/components/views/OverviewView";

export default async function OverviewPage() {
  await connection();
  await requirePagePermission("menu.learning-growth.overview.view");

  return <OverviewView />;
}
