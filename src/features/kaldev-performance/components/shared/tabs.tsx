"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export interface TabItem {
  value: string;
  label: ReactNode;
  /** Bila diisi, tab menjadi tautan (state di URL). */
  href?: string;
}

/** `Tabs` design system: tab bergaris bawah (`.dd-tabs`). */
export function Tabs({
  items,
  value,
  onChange,
  style,
  scrollable = true,
}: {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  style?: CSSProperties;
  scrollable?: boolean;
}) {
  const list = (
    <div className="dd-tabs" role="tablist" style={style}>
      {items.map((item) => {
        const active = item.value === value;
        const className = `dd-tab${active ? " dd-tab--active" : ""}`;
        if (item.href) {
          return (
            <Link
              key={item.value}
              href={item.href}
              role="tab"
              aria-selected={active}
              className={className}
              scroll={false}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={className}
            onClick={() => onChange?.(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
  if (!scrollable) return list;
  return <div style={{ minWidth: 0, overflowX: "auto", display: "flex" }}>{list}</div>;
}
