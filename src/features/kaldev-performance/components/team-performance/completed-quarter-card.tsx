import Link from "next/link";

import { Card } from "../shared/card";
import type { QuarterKey, TeamPerformanceData } from "../../types/kaldev.types";

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];
const COLORS = ["var(--chart-blue-primary)", "var(--chart-blue-light)", "var(--chart-neutral)"];

/**
 * "Project yang sudah selesai" — jumlah proyek selesai per developer pada
 * tiga bulan kuartal terpilih (chip Q1–Q4 di URL `quarter`).
 */
export function CompletedQuarterCard({
  quarter,
  quarterHrefs,
}: {
  quarter: TeamPerformanceData["quarter"];
  quarterHrefs: Record<QuarterKey, string>;
}) {
  return (
    <Card
      title="Project yang sudah selesai"
      subtitle="Jumlah proyek selesai per developer pada kuartal terpilih"
      headStyle={{ flexWrap: "wrap", gap: "10px 14px" }}
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div className="dd-chart__legend">
            {quarter.labels.map((label, i) => (
              <span key={`${label}-${i}`} className="dd-chart__legenditem">
                <span className="dd-chart__dot" style={{ background: COLORS[i] }} />
                {label}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {QUARTERS.map((q) => (
              <Link
                key={q}
                href={quarterHrefs[q]}
                scroll={false}
                className={`dd-btn dd-btn--sm ${q === quarter.key ? "dd-btn--soft" : "dd-btn--secondary"}`}
                style={{ minWidth: 42 }}
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      }
    >
      {quarter.rows.length === 0 ? (
        <div className="dd-empty">
          <div className="dd-empty__title">Belum ada data pada kuartal ini</div>
          <div className="dd-empty__msg">Pilih kuartal lain untuk melihat proyek yang sudah selesai.</div>
        </div>
      ) : (
        <>
          <div
            className="dd-card__scroll"
            style={{ maxHeight: 430, minHeight: 0, overflow: "auto", display: "grid", gap: 2, alignContent: "start" }}
          >
            {quarter.rows.map((r) => (
              <div
                key={r.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "132px minmax(0,1fr)",
                  gap: 14,
                  alignItems: "center",
                  padding: "10px 4px",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  title={r.name}
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    font: "600 11.5px/1.35 var(--dd-font-sans)",
                    color: "var(--text-primary)",
                  }}
                >
                  {r.name}
                </span>
                <span style={{ minWidth: 0, display: "grid", gap: 4 }}>
                  {[r.m1, r.m2, r.m3].map((v, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ flex: 1, minWidth: 0, height: 8, borderRadius: 999, background: "var(--chart-gray-track)", overflow: "hidden" }}>
                        <span
                          style={{
                            display: "block",
                            height: "100%",
                            width: `${((v / quarter.max) * 100).toFixed(1)}%`,
                            minWidth: 4,
                            borderRadius: 999,
                            background: COLORS[i],
                          }}
                        />
                      </span>
                      <span
                        style={{
                          flex: "0 0 auto",
                          minWidth: 22,
                          textAlign: "right",
                          font: "600 11.5px/1 var(--dd-font-sans)",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {v}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          {quarter.note && (
            <div className="dd-chart__note" style={{ marginTop: 10 }}>
              {quarter.note}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
