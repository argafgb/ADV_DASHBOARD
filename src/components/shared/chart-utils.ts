import { C } from "@/lib/utils";

/** Ordered palette used for donut/pie slices and multi-series bars. */
export const DONUT_COLORS = [
  C.accent,
  C.green,
  C.amber,
  C.red,
  C.blue2,
  C.muted,
] as const;

/** Shared Recharts tooltip style matching the template's card tokens. */
export const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: "8px",
  maxWidth: "min(18rem, calc(100vw - 2rem))",
  overflowWrap: "anywhere",
  fontSize: "12px",
  lineHeight: 1.4,
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
  zIndex: 20,
} as const;
