import { connection, NextResponse } from "next/server";
import { getDashboardSyncLogs } from "@/features/pic-monitoring/services/dashboard-database";

export async function GET() {
  await connection();

  try {
    return NextResponse.json(await getDashboardSyncLogs());
  } catch (error: unknown) {
    console.error("PostgreSQL sync snapshot query failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membaca status sinkronisasi data.",
      },
      { status: 500 },
    );
  }
}
