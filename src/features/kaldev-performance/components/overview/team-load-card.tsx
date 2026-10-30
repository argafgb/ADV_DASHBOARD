import { Card } from "../shared/card";
import type { TeamLoadRow } from "../../types/kaldev.types";

const COLS = "minmax(0,.95fr) 46px 66px minmax(110px,1.45fr)";

/**
 * "Beban kerja tim" — daftar programmer dengan antrean, dikerjakan, dan
 * batang total. Programmer tanpa beban ditandai oranye di baris teratas.
 * Daftar menggulir di dalam kartu supaya tingginya mengikuti kartu di sebelah.
 */
export function TeamLoadCard({ rows, max }: { rows: TeamLoadRow[]; max: number }) {
  return (
    <Card
      title="Beban kerja tim"
      subtitle="Tanpa beban ditandai oranye di atas, sisanya urut terbanyak"
      style={{ minWidth: 0 }}
      bodyStyle={{
        display: "grid",
        gap: 0,
        gridTemplateColumns: "minmax(0,1fr)",
        gridTemplateRows: "minmax(0,1fr)",
        placeContent: "stretch",
        flex: 1,
        minHeight: 0,
      }}
    >
      <div style={{ position: "relative", minHeight: 240 }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", gap: 2, alignContent: "start", overflow: "hidden auto" }}>
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 3,
              background: "var(--bg-card)",
              display: "grid",
              gridTemplateColumns: COLS,
              gap: 10,
              padding: "2px 8px 8px",
              font: "700 10.5px/1.2 var(--dd-font-sans)",
              letterSpacing: ".05em",
              textTransform: "uppercase",
              color: "var(--text-placeholder)",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Programmer</span>
            <span style={{ textAlign: "center" }}>Antrean</span>
            <span style={{ textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Dikerjakan
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Total</span>
          </div>
          {rows.length === 0 && (
            <div className="dd-empty">
              <div className="dd-empty__title">Belum ada beban kerja</div>
              <div className="dd-empty__msg">Tidak ada proyek aktif pada sumber yang dipilih.</div>
            </div>
          )}
          {rows.map((r) => {
            const idle = r.total === 0;
            const w = max ? ((r.total / max) * 100).toFixed(0) : "0";
            const ink = idle ? "var(--status-amber-fg)" : "var(--text-primary)";
            const numInk = idle ? "var(--status-amber-fg)" : "var(--text-secondary)";
            return (
              <div
                key={r.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: COLS,
                  gap: 10,
                  alignItems: "center",
                  padding: "9px 8px",
                  borderTop: `1px solid ${idle ? "var(--bg-card)" : "var(--border-subtle)"}`,
                  background: idle ? "var(--status-amber-bg)" : "transparent",
                  borderRadius: idle ? 8 : 0,
                }}
              >
                <span
                  title={r.name}
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    font: "600 12.5px/1.3 var(--dd-font-sans)",
                    color: ink,
                  }}
                >
                  {r.name}
                </span>
                <span style={{ textAlign: "center", font: "600 12.5px/1 var(--dd-font-sans)", fontVariantNumeric: "tabular-nums", color: numInk }}>
                  {r.q}
                </span>
                <span style={{ textAlign: "center", font: "600 12.5px/1 var(--dd-font-sans)", fontVariantNumeric: "tabular-nums", color: numInk }}>
                  {r.p}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <span
                    style={{
                      font: "600 12.5px/1 var(--dd-font-sans)",
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--text-primary)",
                      minWidth: 18,
                      textAlign: "right",
                    }}
                  >
                    {r.total}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, height: 9, borderRadius: 999, background: "var(--chart-gray-track)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${w}%`, minWidth: 4, borderRadius: 999, background: "var(--chart-blue-primary)" }} />
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
