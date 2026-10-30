import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentAccess } from "@/lib/access/session";
import { firstAllowedPath } from "@/lib/access/effective-access";

export const instant = false;

export default async function ForbiddenPage() {
  const access = await getCurrentAccess();
  const targetPath = access ? firstAllowedPath(access.permissions) : "/dashboard";

  return (
    <div className="flex h-[calc(100vh-14rem)] w-full flex-col items-center justify-center p-6 text-center font-sans">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 shadow-xs mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
        Akses Halaman Ditolak (403 Forbidden)
      </h1>

      <p className="mt-2 max-w-md text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Akun Anda tidak memiliki hak akses atau izin yang diperlukan untuk membuka halaman ini.
        Silakan hubungi Administrator IT untuk mengajukan penyesuaian hak akses.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Link href={targetPath}>
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
