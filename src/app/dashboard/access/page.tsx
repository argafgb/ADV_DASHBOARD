export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentAccess } from "@/lib/access/session";

export default async function AccessIndexPage() {
  await connection();
  const access = await getCurrentAccess();
  if (!access) {
    redirect("/login");
  }

  if (access.status !== "active") {
    redirect("/dashboard/forbidden");
  }

  if (access.permissions.has("access.users.manage")) {
    redirect("/dashboard/access/users");
  }

  if (access.permissions.has("access.roles.manage")) {
    redirect("/dashboard/access/roles");
  }

  if (access.permissions.has("access.audit.view")) {
    redirect("/dashboard/access/audit");
  }

  redirect("/dashboard/forbidden");
}
