"use client";

import { useCountUp } from "../../hooks/useCountUp";

export function AnimatedValue({ value, suffix = "" }: { value: number; suffix?: string }) {
  const displayed = useCountUp(value);
  return (
    <>
      {displayed}
      {suffix}
    </>
  );
}

export function AnimatedBar({
  value,
  width,
  color,
  className = "h-full rounded-full",
}: {
  value: number;
  width: number;
  color: string;
  className?: string;
}) {
  const displayed = useCountUp(value);
  // Ensure subtle minimum visibility for zero values
  const animatedWidth = value > 0 ? Math.max(width * (displayed / value), 2) : 0;
  return (
    <span
      className={`${className} block transition-[width] duration-500 ease-out`}
      style={{ width: `${animatedWidth}%`, background: color }}
    />
  );
}
