"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { IconChevronDown, IconGrid, IconTick } from "./icons";

export interface DropdownOption {
  value: string;
  label: string;
}

interface TriggerProps {
  open: boolean;
  toggle: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

/**
 * Popover pilihan tunggal design system (`.dd-dd`): pemicu digambar oleh
 * pemanggil (`renderTrigger`), menu berisi opsi dengan tanda centang, bisa
 * dinavigasi keyboard, menutup saat klik di luar atau Escape.
 */
export function Dropdown({
  options,
  value,
  onChange,
  renderTrigger,
  label,
  align = "left",
}: {
  options: (DropdownOption | string)[];
  value: string;
  onChange: (value: string) => void;
  renderTrigger: (p: TriggerProps) => ReactNode;
  label?: string;
  align?: "left" | "right";
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (v: string) => {
    setOpen(false);
    if (v !== value) onChange(v);
  };
  const toggle = () => {
    setCursor(opts.findIndex((o) => o.value === value));
    setOpen((o) => !o);
  };
  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setCursor(opts.findIndex((o) => o.value === value));
      setOpen(true);
    }
  };
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, opts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && opts[cursor]) {
      e.preventDefault();
      pick(opts[cursor].value);
    }
  };

  return (
    <div className="dd-dd" ref={ref}>
      {renderTrigger({ open, toggle, onKeyDown: onTriggerKey })}
      {open && (
        <div
          className={`dd-dd__menu${align === "right" ? " dd-dd__menu--right" : ""}`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onMenuKey}
        >
          {label && <div className="dd-dd__label">{label}</div>}
          <div className="dd-dd__opts">
            {opts.map((o, i) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={[
                  "dd-dd__opt",
                  o.value === value ? "dd-dd__opt--active" : "",
                  i === cursor ? "dd-dd__opt--cursor" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => pick(o.value)}
                onMouseEnter={() => setCursor(i)}
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

/** Pil filter global "Label: Nilai" (`.dd-filter`), seperti chip Tahun/Bulan di header desain. */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  align = "left",
  size = "sm",
}: {
  label: string;
  value: string;
  options: (DropdownOption | string)[];
  onChange: (value: string) => void;
  align?: "left" | "right";
  size?: "sm" | "lg";
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value);
  return (
    <Dropdown
      options={opts}
      value={value}
      onChange={onChange}
      label={label}
      align={align}
      renderTrigger={({ open, toggle, onKeyDown }) => (
        <button
          type="button"
          className={["dd-filter", size === "lg" ? "dd-filter--lg" : "", open ? "dd-filter--open" : ""].filter(Boolean).join(" ")}
          onClick={toggle}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="dd-filter__label">{label}:</span>
          <span className="dd-filter__value">{current ? current.label : value}</span>
          <IconChevronDown className="dd-filter__chev" />
        </button>
      )}
    />
  );
}

/**
 * Filter toolbar tabel (`.dd-tfilter`): ikon → nama filter → nilai → chevron.
 * Nilai tanpa filter selalu "Semua", bukan kosong.
 */
export function TableFilter({
  label,
  value = "Semua",
  options,
  onChange,
  icon,
  align = "left",
  allLabel = "Semua",
  size = "md",
}: {
  label: string;
  value?: string;
  options: (DropdownOption | string)[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  align?: "left" | "right";
  allLabel?: string;
  size?: "md" | "lg";
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value);
  const shown = current ? current.label : value || allLabel;
  const active = shown !== allLabel;
  return (
    <Dropdown
      options={opts}
      value={value}
      onChange={onChange}
      label={label}
      align={align}
      renderTrigger={({ open, toggle, onKeyDown }) => (
        <button
          type="button"
          className={[
            "dd-tfilter",
            size === "lg" ? "dd-tfilter--lg" : "",
            open ? "dd-tfilter--open" : "",
            active ? "dd-tfilter--active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={toggle}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="dd-tfilter__icon">{icon ?? <IconGrid />}</span>
          <span className="dd-tfilter__label">{label}</span>
          <span className="dd-tfilter__value">{shown}</span>
          <IconChevronDown className="dd-tfilter__chev" />
        </button>
      )}
    />
  );
}
