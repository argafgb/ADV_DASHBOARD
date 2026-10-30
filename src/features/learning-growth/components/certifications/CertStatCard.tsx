"use client";

import { useCountUp } from "../../hooks/useCountUp";
import type { ReactNode } from "react";

interface CertStatCardProps {
  label: string;
  value?: number;
  valueText?: string;
  valueColor?: string;
  sub?: string;
  note: string;
}

function CountUpValue({ value }: { value: number }) {
  const displayed = useCountUp(value);
  return <>{displayed}</>;
}

function StatShell({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="dh-card-3d rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-[19px] py-[15px]">
      <div className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400">{label}</div>
      {children}
      <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{note}</div>
    </div>
  );
}

/** Mini-stat tile of the Sertifikasi page (numeric tiles count up). */
export function CertStatCard({
  label,
  value,
  valueText,
  valueColor,
  sub,
  note,
}: CertStatCardProps) {
  return (
    <StatShell label={label} note={note}>
      <div
        className="my-[2px] text-[24px] font-extrabold text-zinc-900 dark:text-zinc-50"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value !== undefined ? <CountUpValue value={value} /> : valueText}
      </div>
      {sub && <div className="mb-[2px] truncate text-[10.5px] font-semibold text-zinc-700 dark:text-zinc-300">{sub}</div>}
    </StatShell>
  );
}
