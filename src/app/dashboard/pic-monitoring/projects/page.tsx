export const instant = false;
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import ProjectsClient from "@/features/pic-monitoring/components/ProjectsClient";

export default async function ProjectsPage() {
  await connection();
  await requirePagePermission("menu.pic-monitoring.project-list.view");

  return <ProjectsClient />;
}
