"use client";

import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmailPerformanceData } from "../types/emailPerformanceTypes";

interface EmailKpiCardsProps {
  data: EmailPerformanceData;
}

export function EmailKpiCards({ data }: EmailKpiCardsProps) {
  const { critical, high, medium, low, total } = data.severityBreakdown;
  const isMet = data.heroSlaStatus === "Met";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* 1. Yearly SLA Card */}
      <Card className="bg-card border-border/60 shadow-xs backdrop-blur-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Yearly SLA ({data.year})
            </span>
            <div
              className={`rounded-lg p-2.5 ${
                isMet
                  ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {data.heroSla}%
            </span>
            <span
              className={`text-xs font-semibold inline-flex items-center gap-1 ${
                isMet ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isMet ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Target min.{" "}
                  {data.target}%
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Di Bawah Target{" "}
                  {data.target}%
                </>
              )}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Pencapaian SLA keseluruhan untuk Server Email
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Downtime Card */}
      <Card className="bg-card border-border/60 shadow-xs backdrop-blur-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Total Downtime ({data.year})
            </span>
            <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-500 dark:bg-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {data.downtime}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              Gangguan YTD
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Akumulasi gangguan layanan pada tahun {data.year}
          </p>
        </CardContent>
      </Card>

      {/* 3. Breakdown Incidents Logged Card */}
      <Card className="bg-card border-border/60 shadow-xs backdrop-blur-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Breakdown Incidents Logged
            </span>
            <div className="rounded-lg bg-rose-500/10 p-2.5 text-rose-500 dark:bg-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {total}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              Insiden pada tahun {data.year}
            </span>
          </div>

          {/* Severity Breakdown Pills */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-500 border border-rose-500/20">
              Critical: {critical}
            </span>
            <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-orange-500 border border-orange-500/20">
              High: {high}
            </span>
            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-500 border border-amber-500/20">
              Medium: {medium}
            </span>
            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-blue-500 border border-blue-500/20">
              Low: {low}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
