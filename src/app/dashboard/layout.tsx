import React from "react";
import { connection } from "next/server";
import DashboardClientWrapper from "./DashboardClientWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return <DashboardClientWrapper>{children}</DashboardClientWrapper>;
}
