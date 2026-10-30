"use client";

import React from "react";

export interface KpiDelta {
  arrow: string;
  text: string;
  bg: string;
  fg: string;
}

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconFg: string;
  delta: KpiDelta;
  label: React.ReactNode;
  value: React.ReactNode;
  footer: React.ReactNode;
  /** Brand-blue, high-contrast treatment for the single primary KPI. */
  primary?: boolean;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

/** KPI card Overview — persis markup sumber (app_markup.html 1167-1195). */
export default function KpiCard({
  icon,
  iconBg,
  iconFg,
  delta,
  label,
  value,
  footer,
  primary = false,
  onClick,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}: KpiCardProps) {
  const base: React.CSSProperties = primary
    ? {
        position: "relative",
        background: "var(--gradient-kpi-highlight)",
        border: "1px solid transparent",
        borderRadius: "var(--radius-card)",
        padding: "17px 19px",
        boxShadow: "var(--shadow-card)",
      }
    : {
        textAlign: "left",
        position: "relative",
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-card)",
        padding: "17px 19px",
        boxShadow: "var(--shadow-card)",
        cursor: onClick ? "pointer" : undefined,
      };

  const body = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            width: "38px",
            height: "38px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-base)",
            background: iconBg,
            color: iconFg,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-sm-plus)",
            fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
            padding: "2px 8px",
            borderRadius: "var(--radius-pill)",
            background: delta.bg,
            color: delta.fg,
          }}
        >
          {delta.arrow} {delta.text}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-lg-minus)",
          fontWeight: "var(--fw-semibold)" as React.CSSProperties["fontWeight"],
          color: primary ? "rgba(255,255,255,.85)" : "var(--text-muted)",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--fs-4xl)",
          fontWeight: "var(--fw-black)" as React.CSSProperties["fontWeight"],
          lineHeight: 1,
          color: primary ? "#fff" : "var(--text-primary)",
        }}
      >
        {value}
      </div>
      {footer}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={base}
      >
        {body}
      </button>
    );
  }
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={base}
    >
      {body}
    </div>
  );
}
