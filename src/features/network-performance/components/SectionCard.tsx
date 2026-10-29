"use client";

import React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  /** Bar aksen 3px di tepi atas card (dipakai card "SLA performance"). */
  accent?: boolean;
  style?: React.CSSProperties;
}

/** Card standar sumber: bg putih, border, radius 14px, padding 20px, shadow. */
export default function SectionCard({
  children,
  accent,
  style,
}: SectionCardProps) {
  return (
    <div
      className="network-section-card"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-card)",
        padding: "var(--ws-card-pad)",
        boxShadow: "var(--shadow-card)",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        isolation: "isolate",
        ...(accent ? { position: "relative" as const } : {}),
        ...style,
      }}
    >
      {accent && (
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "var(--accent)",
            borderRadius: "var(--radius-card) var(--radius-card) 0 0",
          }}
        />
      )}
      {children}
    </div>
  );
}

/** Judul card + subtitle — pola berulang di semua card sumber. */
export function CardTitle({
  title,
  subtitle,
  subtitleMarginBottom,
}: {
  title: string;
  subtitle?: React.ReactNode;
  subtitleMarginBottom?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--fs-xl)",
          fontWeight: "var(--fw-bold)" as React.CSSProperties["fontWeight"],
          color: "var(--text-primary)",
          letterSpacing: "var(--ls-heading)",
        }}
      >
        {title}
      </div>
      {subtitle != null && (
        <div
          style={{
            fontSize: "var(--fs-md-plus)",
            color: "var(--text-placeholder)",
            marginTop: "4px",
            ...(subtitleMarginBottom
              ? { marginBottom: subtitleMarginBottom }
              : {}),
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
