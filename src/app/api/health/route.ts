import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "adv_dashboard",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
