export const instant = false;

import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import TrainingView from "@/features/learning-growth/components/views/TrainingView";

export default async function TrainingPage() {
  await connection();
  await requirePagePermission("menu.learning-growth.training.view");

  return <TrainingView />;
}
