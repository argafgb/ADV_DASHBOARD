"use client";

import { useState, Fragment } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CentranIncident,
  IncidentSeverity,
} from "../types/centranPerformanceTypes";

interface CentranIncidentTableProps {
  incidents: CentranIncident[];
  year: number;
}

function getSeverityBadge(sev: IncidentSeverity) {
  switch (sev) {
    case "critical":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-500 border border-rose-500/20 capitalize">
          Critical
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-orange-500 border border-orange-500/20 capitalize">
          High
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500 border border-amber-500/20 capitalize">
          Medium
        </span>
      );
    case "low":
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-500 border border-blue-500/20 capitalize">
          Low
        </span>
      );
  }
}

export function CentranIncidentTable({
  incidents,
  year,
}: CentranIncidentTableProps) {
  const [openRowIds, setOpenRowIds] = useState<number[]>(
    incidents[0] ? [incidents[0].no] : [],
  );

  const toggleRow = (no: number) => {
    setOpenRowIds((prev) =>
      prev.includes(no) ? prev.filter((id) => id !== no) : [...prev, no],
    );
  };

  return (
    <Card className="bg-card border-border/60 shadow-xs backdrop-blur-xs transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-rose-500" />
            Incident Outage Log & Root Cause Analysis ({year})
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Catatan insiden detail, durasi kendala, analisis akar masalah,
            tindakan yang diambil, dan penyelesaian
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0 border-t border-border/60">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Tidak ada log incident untuk Server Centran pada tahun {year}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">No</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">End Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Verified</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {incidents.map((inc) => {
                  const isOpen = openRowIds.includes(inc.no);

                  return (
                    <Fragment key={inc.no}>
                      {/* Main Incident Row */}
                      <tr
                        onClick={() => toggleRow(inc.no)}
                        className={`cursor-pointer transition-colors ${
                          isOpen
                            ? "bg-muted/40 font-medium"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="py-3 px-4 tabular-nums font-medium">
                          {inc.no}
                        </td>
                        <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                          {inc.down}
                        </td>
                        <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                          {inc.up}
                        </td>
                        <td className="py-3 px-4 font-semibold text-rose-500 whitespace-nowrap">
                          {inc.durasi}
                        </td>
                        <td className="py-3 px-4 font-medium max-w-xs truncate">
                          {inc.kendala}
                        </td>
                        <td className="py-3 px-4">
                          {getSeverityBadge(inc.sev)}
                        </td>
                        <td className="py-3 px-4">
                          {inc.verify ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                              <AlertCircle className="h-3.5 w-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(inc.no);
                            }}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                              isOpen
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span>
                              {isOpen ? "Tutup Detail" : "Buka Detail"}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Inline Accordion Row Drilldown */}
                      {isOpen && (
                        <tr className="bg-muted/20">
                          <td
                            colSpan={8}
                            className="p-4 border-b border-border/40"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 shadow-xs">
                                <span className="font-semibold text-rose-500 uppercase tracking-wider text-[10px] block mb-1.5">
                                  Identified Cause (Penyebab)
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                  {inc.penyebab}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 shadow-xs">
                                <span className="font-semibold text-blue-500 uppercase tracking-wider text-[10px] block mb-1.5">
                                  Action Taken (Tindakan)
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                  {inc.action}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border/50 bg-card/60 p-3.5 shadow-xs">
                                <span className="font-semibold text-emerald-500 uppercase tracking-wider text-[10px] block mb-1.5">
                                  Resolution (Solusi)
                                </span>
                                <p className="text-muted-foreground leading-relaxed">
                                  {inc.solusi}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
