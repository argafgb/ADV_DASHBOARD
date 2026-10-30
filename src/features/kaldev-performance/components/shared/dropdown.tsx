"use client";

import { useEffect, useRef, useState } from "react";

import { IconChevronDown, IconGrid, IconTick } from "./icons";

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * Dropdown pilihan tunggal dari design system (`.dd-dd`):
 * - `variant="filter"`  → chip "Label: Nilai" seperti di header desain.
 * - `variant="tfilter"` → filter tabel berikon ("Kategori  Semua").
 */
export function Dropdown({
  label,
  value,
  options,
  onChange,
  variant = "tfilter",
  align = "left",
  ariaLabel,
}: {
  label: string;
  value: string;
  options: (DropdownOption | string)[];
  onChange: (value: string) => void;
  variant?: "filter" | "tfilter";
  align?: "left" | "right";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value) ?? opts[0];
  const active = value !== "Semua" && value !== "ALL";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trigger =
    variant === "filter" ? (
      <button
        type="button"
        className={`dd-filter${open ? " dd-filter--open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dd-filter__label">{label}:</span>
        <span className="dd-filter__value">{current?.label}</span>
        <IconChevronDown className="dd-filter__chev" />
      </button>
    ) : (
      <button
        type="button"
        className={`dd-tfilter${open ? " dd-tfilter--open" : ""}${active ? " dd-tfilter--active" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dd-tfilter__icon">
          <IconGrid />
        </span>
        <span className="dd-tfilter__label">{label}</span>
        <span className="dd-tfilter__value">{current?.label}</span>
        <IconChevronDown className="dd-tfilter__chev" />
      </button>
    );

  return (
    <div className="dd-dd" ref={rootRef}>
      {trigger}
      {open && (
        <div className={`dd-dd__menu${align === "right" ? " dd-dd__menu--right" : ""}`} role="listbox">
          <div className="dd-dd__opts">
            {opts.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`dd-dd__opt${o.value === value ? " dd-dd__opt--active" : ""}`}
                onClick={() => {
                  setOpen(false);
                  if (o.value !== value) onChange(o.value);
                }}
              >
                <span className="dd-dd__opttext">{o.label}</span>
                <IconTick className="dd-dd__tick" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
