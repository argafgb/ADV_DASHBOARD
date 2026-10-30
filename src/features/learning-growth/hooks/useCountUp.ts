"use client";

import { useEffect, useRef, useState } from "react";
import { useLearningGrowth } from "../context/LearningGrowthFilterContext";

const DURATION_MS = 680;

/**
 * Animated integer count-up (exact mockup timing: 680ms, cubic ease-out),
 * re-triggered when the target or the global year filter changes. Skipped
 * entirely under prefers-reduced-motion, where the final value renders.
 */
export function useCountUp(target: number): number {
  const { year, month } = useLearningGrowth();
  const [value, setValue] = useState(target);
  const displayedRef = useRef(target);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = displayedRef.current;
    const delta = target - from;
    const start = performance.now();

    if (reduced || delta === 0) {
      displayedRef.current = target;
      setValue(target);
      return;
    }

    let raf: number;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + delta * eased);
      displayedRef.current = next;
      setValue(next);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, year, month]);

  return value;
}
