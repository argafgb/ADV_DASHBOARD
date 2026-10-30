export const instant = false;

import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import TimelineView from "@/features/learning-growth/components/views/TimelineView";

export default async function TimelinePage() {
  await connection();
  await requirePagePermission("menu.learning-growth.timeline.view");

  return <TimelineView />;
}
