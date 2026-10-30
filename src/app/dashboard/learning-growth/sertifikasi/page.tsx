export const instant = false;

import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import CertificationsView from "@/features/learning-growth/components/views/CertificationsView";

export default async function CertificationsPage() {
  await connection();
  await requirePagePermission("menu.learning-growth.certifications.view");

  return <CertificationsView />;
}
