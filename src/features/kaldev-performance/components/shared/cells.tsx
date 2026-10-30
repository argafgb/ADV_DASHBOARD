import type { CSSProperties, ReactNode } from "react";

/**
 * Sel tabel standar dari desain (`idCell`, `nameCell`, `numCell`, `softCell`,
 * `barCell`). Ukuran font ditulis persis seperti artefak desain.
 */

export function IdCell({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        font: "700 12px/1.4 var(--dd-font-sans)",
        fontVariantNumeric: "tabular-nums",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </span>
  );
}

export function NameCell({
  children,
  clamp = 2,
  nowrap = false,
  title,
}: {
  children: ReactNode;
  clamp?: number;
  nowrap?: boolean;
  title?: string;
}) {
  const style: CSSProperties = nowrap
    ? {
        font: "700 12.5px/1.45 var(--dd-font-sans)",
        color: "var(--text-primary)",
        whiteSpace: "nowrap",
      }
    : {
        font: "700 12.5px/1.45 var(--dd-font-sans)",
        color: "var(--text-primary)",
        display: "-webkit-box",
        WebkitLineClamp: clamp,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };
  return (
    <div title={title} style={style}>
      {children}
    </div>
  );
}

export function NumCell({
  children,
  align = "left",
  tone = "secondary",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  tone?: "secondary" | "primary" | "placeholder";
}) {
  const color =
    tone === "primary"
      ? "var(--text-primary)"
      : tone === "placeholder"
        ? "var(--text-placeholder)"
        : "var(--text-secondary)";
  return (
    <span
      style={{
        font: "600 12.5px/1.4 var(--dd-font-sans)",
        fontVariantNumeric: "tabular-nums",
        color,
        display: "block",
        textAlign: align,
      }}
    >
      {children}
    </span>
  );
}

export function SoftCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <span
      style={{
        font: "400 12px/1.4 var(--dd-font-sans)",
        color: "var(--text-placeholder)",
        display: "block",
        textAlign: align,
      }}
    >
      {children}
    </span>
  );
}

/** Angka + batang proporsi (kolom "Total aktif"). */
export function BarCell({
  value,
  max,
  color = "var(--chart-blue-primary)",
  height = 6,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
}) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span
        style={{
          font: "600 12.5px/1 var(--dd-font-sans)",
          fontVariantNumeric: "tabular-nums",
          color: "var(--text-primary)",
          minWidth: 24,
          textAlign: "right",
        }}
      >
        {value}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          height,
          borderRadius: 999,
          background: "var(--chart-gray-track)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${w}%`,
            minWidth: 4,
            borderRadius: 999,
            background: color,
          }}
        />
      </span>
    </div>
  );
}

/** Label kecil kapital pada kartu detail ("PROGRAMMER", "ALASAN DITAHAN"). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        font: "700 10px/1 var(--dd-font-sans)",
        letterSpacing: ".06em",
        textTransform: "uppercase",
        color: "var(--text-placeholder)",
      }}
    >
      {children}
    </div>
  );
}
