"use client";

import { IconSearch } from "./icons";

/** `SearchInput` design system: kotak cari dengan ikon kaca pembesar. */
export function SearchInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="dd-input-wrap">
      <span className="dd-input-wrap__icon">
        <IconSearch />
      </span>
      <input
        className="dd-input dd-input--with-icon dd-input--search"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
