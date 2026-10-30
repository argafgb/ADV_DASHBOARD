"use client";

import { useEffect, useRef, useState } from "react";

export function useMeasuredWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const next = Math.round(node.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

export function useGridColumns<T extends HTMLElement>(fallback = 1) {
  const ref = useRef<T | null>(null);
  const [columns, setColumns] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const template = getComputedStyle(node).gridTemplateColumns;
      const next = template.split(" ").filter(Boolean).length;
      if (next > 0) setColumns(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, columns] as const;
}

const FINE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5] as const;
export const COARSE_STEPS = [1, 2, 2.5, 5] as const;

export function niceAxis(max: number, steps: readonly number[] = FINE_STEPS) {
  const raw = Math.max(max, 1) / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / magnitude;
  const step = (steps.find((s) => norm <= s) ?? 10) * magnitude;
  return { step, top: step * 4 };
}

export function idNum(value: number, digits = 0) {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
