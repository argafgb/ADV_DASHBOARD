import { connection, type NextRequest, NextResponse } from "next/server";
import { getDashboardProjects } from "@/features/pic-monitoring/services/dashboard-database";

export async function GET(request: NextRequest) {
  await connection();

  try {
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    return NextResponse.json(await getDashboardProjects(forceRefresh));
  } catch (error: unknown) {
    console.error("PostgreSQL project query failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal membaca data project.",
      },
      { status: 500 },
    );
  }
}
