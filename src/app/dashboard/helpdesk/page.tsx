import { Headset, TicketCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { connection } from "next/server";

export const instant = false;

export default async function HelpdeskOverviewPage() {
  await connection();
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            Modul: Helpdesk
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Helpdesk & Ticketing Management
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Pusat monitoring tiket helpdesk, eskalasi, dan performa SLA operasional.
        </p>
      </header>

      {/* KPI Cards Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Tiket Bulan Ini</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">1,248</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">+12% dari bulan lalu</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600">
              <Headset size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Tiket Open / In-Progress</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">42</p>
              <p className="text-xs text-zinc-500 mt-1 font-medium">Dalam penanganan teknisi</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600">
              <Clock size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Selesai (Resolved)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">1,194</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Resolution rate 95.6%</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Over SLA Limit</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">12</p>
              <p className="text-xs text-rose-600 mt-1 font-medium">Perlu eskalasi segera</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-600">
              <AlertTriangle size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Architecture PoC Info Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base text-blue-900 dark:text-blue-300 flex items-center gap-2">
            <TicketCheck size={20} className="text-blue-600" />
            Proof of Concept: Modular Monolith 1 Repo
          </CardTitle>
          <CardDescription className="text-xs text-blue-700/80 dark:text-blue-400">
            Halaman ini mendemonstrasikan routing terintegrasi dalam 1 aplikasi Next.js:
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
          <p>
            • URL <code>/dashboard/asset-maintenance/*</code> melayani modul Asset IT & Preventive Maintenance (data live PostgreSQL).
          </p>
          <p>
            • URL <code>/dashboard/helpdesk/*</code> melayani modul Helpdesk & Ticketing.
          </p>
          <p>
            • Keduanya berbagi 1 shell layout (Sidebar, Header, FilterContext, Autentikasi SSO), sehingga tidak memerlukan multi-repo atau port terpisah.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
