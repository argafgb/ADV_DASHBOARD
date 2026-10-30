'use client';

import { useEffect, useRef, useState } from 'react';
import { useFilters } from '../context/ProcessRiskFilterContext';

const DURATION_MS = 680;

export function useCountUp(target: number): number {
  const { years, month } = useFilters();
  const [value, setValue] = useState(target);
  const displayedRef = useRef(target);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = displayedRef.current;
    const delta = target - from;
    const start = performance.now();

    if (reduced || delta === 0) {
      displayedRef.current = target;
      setValue(target);
      return;
    }

    let frame: number;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + delta * eased);
      displayedRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, years, month]);

  return value;
}
