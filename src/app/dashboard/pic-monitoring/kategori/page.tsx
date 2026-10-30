export const instant = false;
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import KategoriClient from "@/features/pic-monitoring/components/KategoriClient";

export default async function KategoriPage() {
  await connection();
  await requirePagePermission("menu.pic-monitoring.kategori-divisi.view");

  return <KategoriClient />;
}
