export const instant = false;

import { connection } from "next/server";
import { redirect } from "next/navigation";

export default async function AccessManagementAliasPage() {
  await connection();
  redirect("/dashboard/access/users");
}
