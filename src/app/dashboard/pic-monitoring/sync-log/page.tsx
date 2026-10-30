export const instant = false;
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { SyncLogsViewer } from "@/features/pic-monitoring/components/SyncLogsViewer";
import { TabSyncLogsView } from "@/features/pic-monitoring/components/TabSyncLogsView";

export default async function SyncLogPage() {
  await connection();
  await requirePagePermission("dashboard.pic-monitoring.view");

  return (
    <div className="space-y-6">
      <TabSyncLogsView />
      <SyncLogsViewer />
    </div>
  );
}
