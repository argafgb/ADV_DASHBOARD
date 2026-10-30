"use client";

import { PieChart as PieChartIcon } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Card } from "../ds/card";
import { Donut } from "../ds/donut";
import type { ApprovalStatusData } from "../../types/employee.types";

const SIZE = 152;
const STROKE = 28;

const VARIANT_COLOR: Record<string, string> = {
  good: "var(--chart-green)",
  warn: "var(--chart-amber)",
  risk: "var(--chart-red)",
  default: "var(--chart-blue-primary)",
};

export function ApprovalStatusCard({ data }: { data: ApprovalStatusData }) {
  const total = data.totalSubmissions.toLocaleString("id-ID");

  return (
    <Card
      title="Status approval"
      subtitle={`${total} pengajuan pada periode aktif`}
    >
      <div style={{ display: "grid", gap: 14 }}>
        {data.items.length === 0 ? (
          <EmptyState
            icon={PieChartIcon}
            title="Belum Ada Data Pengajuan"
            description="Data akan muncul setelah sinkronisasi dari HRIS selesai."
            height={220}
          />
        ) : (
          <Donut
            data={data.items.map((item) => ({
              label: item.label,
              value: item.count,
              color:
                item.color ??
                VARIANT_COLOR[item.variant ?? "default"] ??
                VARIANT_COLOR.default,
            }))}
            centerValue={total}
            centerCaption="pengajuan"
            size={SIZE}
            stroke={STROKE}
            legend
            total={data.totalSubmissions}
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
            font: "var(--fw-regular) 12px/1.3 var(--dd-font-sans)",
            color: "var(--text-muted)",
            alignItems: "center",
          }}
        >
          <span>Rata-rata waktu approval</span>
          <strong
            className="dd-num"
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              fontSize: 20,
            }}
          >
            {data.avgApprovalTime}
          </strong>
        </div>
      </div>
    </Card>
  );
}
