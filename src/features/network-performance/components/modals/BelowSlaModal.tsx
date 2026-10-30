"use client";

import React from "react";
import ModalShell, { ModalCloseButton } from "./ModalShell";
import { useNetworkData } from "../../context/NetworkDataContext";
import { MONTHS_FULL } from "../../data/constants";

export interface BelowBranchIncident {
  id: number;
  problem: string;
  downtimeStart: string | null;
  uptimeEnd: string | null;
  durationMinutes: number;
  durasi: string;
}

export interface BelowBranchRow {
  name: string;
  sla: string;
  region: string;
  reason?: string;
  totalDurationMinutes?: number;
  totalDurasi?: string;
  incidents?: BelowBranchIncident[];
}

export interface BelowMonthGroup {
  monthIndex: number;
  monthName: string;
  rows: BelowBranchRow[];
}

function fmtStamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dateStr = d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${dateStr}, ${hours}:${minutes}`;
}

/** Modal "Branches below SLA target" — rincian cabang di bawah target per bulan beserta insiden & durasi. */
export default function BelowSlaModal({
  groups,
  rows,
  uniqueBranchCount,
  periodLabel,
  onClose,
}: {
  groups?: BelowMonthGroup[];
  rows?: BelowBranchRow[];
  uniqueBranchCount?: number;
  periodLabel: string;
  onClose: () => void;
}) {
  const { sla } = useNetworkData();
  const effectiveGroups =
    groups ?? (rows ? [{ monthIndex: 0, monthName: periodLabel, rows }] : []);
  const totalUnique =
    uniqueBranchCount ??
    (rows
      ? rows.length
      : new Set(effectiveGroups.flatMap((g) => g.rows.map((r) => r.name))).size);

  return (
    <ModalShell width={560} maxHeight={640} onClose={onClose}>
      <div
        style={{
          padding: "20px 22px 16px",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-xl)",
              fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
              color: "var(--text-primary)",
            }}
          >
            Branches below SLA target
          </div>
          <div
            style={{
              fontSize: "var(--fs-md)",
              color: "var(--text-muted)",
              marginTop: "3px",
            }}
          >
            {totalUnique} cabang · {periodLabel} · target{" "}
            {sla.TARGET.toFixed(1)}%
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      <div
        className="nl-scroll"
        style={{ overflowY: "auto", padding: "10px 22px 20px" }}
      >
        {effectiveGroups.length === 0 ? (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "var(--fs-md-plus)",
                fontWeight: 700,
                color: "var(--status-green-fg)",
              }}
            >
              Semua cabang memenuhi target {sla.TARGET.toFixed(1)}%
            </span>
            <span
              style={{
                fontSize: "var(--fs-sm)",
                color: "var(--text-muted)",
              }}
            >
              Tidak ada cabang yang berada di bawah target SLA pada {periodLabel}.
            </span>
          </div>
        ) : (
          effectiveGroups.map((g) => {
            const displayMonth = MONTHS_FULL[g.monthIndex] ?? g.monthName;
            return (
              <div key={g.monthIndex} style={{ marginBottom: "22px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    marginTop: "16px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {displayMonth}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--status-red-fg)",
                    }}
                  >
                    {g.rows.length} Cabang
                  </span>
                </div>

                {g.rows.map((b) => {
                  const list = b.incidents ?? [];
                  return (
                    <div
                      key={b.name}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        padding: "14px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--status-red-fg)",
                          marginTop: "7px",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "10px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "var(--fs-md-plus)",
                                fontWeight:
                                  "var(--fw-bold)" as React.CSSProperties["fontWeight"],
                                color: "var(--text-primary)",
                              }}
                            >
                              {b.name}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "var(--fs-md-plus)",
                                fontWeight:
                                  "var(--fw-black)" as React.CSSProperties["fontWeight"],
                                color: "var(--status-red-fg)",
                              }}
                            >
                              {b.sla}
                            </span>
                            <span
                              style={{
                                fontSize: "var(--fs-sm-plus)",
                                color: "var(--text-placeholder)",
                              }}
                            >
                              {b.region}
                            </span>
                          </div>

                          {list.length > 1 && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: "var(--status-red-bg)",
                                color: "var(--status-red-fg)",
                              }}
                            >
                              {list.length} insiden · Total {b.totalDurasi}
                            </span>
                          )}
                        </div>

                        {list.length === 0 ? (
                          <div
                            style={{
                              fontSize: "var(--fs-sm)",
                              color: "var(--text-placeholder)",
                              fontStyle: "italic",
                              marginTop: "6px",
                            }}
                          >
                            Data insiden tidak terinci di tiket (rekap bulanan)
                          </div>
                        ) : list.length === 1 ? (
                          <div style={{ marginTop: "6px" }}>
                            <div
                              style={{
                                fontSize: "var(--fs-md)",
                                color: "var(--text-muted)",
                                lineHeight: 1.4,
                              }}
                            >
                              {list[0].problem}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: "10px",
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                                marginTop: "6px",
                              }}
                            >
                              <span>
                                <strong
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  Mulai:
                                </strong>{" "}
                                {fmtStamp(list[0].downtimeStart)}
                              </span>
                              <span style={{ color: "var(--text-placeholder)" }}>•</span>
                              <span>
                                <strong
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  Selesai:
                                </strong>{" "}
                                {fmtStamp(list[0].uptimeEnd)}
                              </span>
                              <span style={{ color: "var(--text-placeholder)" }}>•</span>
                              <span>
                                <strong
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  Durasi:
                                </strong>{" "}
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: "var(--status-red-fg)",
                                  }}
                                >
                                  {list[0].durasi}
                                </span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              marginTop: "10px",
                            }}
                          >
                            {list.map((inc, idx) => (
                              <div
                                key={inc.id ?? idx}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: "6px",
                                  background: "var(--bg-row-item)",
                                  border: "1px solid var(--border-subtle)",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    Insiden #{idx + 1}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "var(--status-red-fg)",
                                    }}
                                  >
                                    {inc.durasi}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "var(--text-muted)",
                                    lineHeight: 1.4,
                                    marginBottom: "6px",
                                  }}
                                >
                                  {inc.problem}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "11px",
                                    color: "var(--text-placeholder)",
                                  }}
                                >
                                  <span>
                                    <strong>Mulai:</strong> {fmtStamp(inc.downtimeStart)}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    <strong>Selesai:</strong> {fmtStamp(inc.uptimeEnd)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </ModalShell>
  );
}
