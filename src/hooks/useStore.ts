/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
/**
 * This hook fix hydration when use persist to save hook data to localStorage
 */
export const useStore = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
) => {
  const result = store(callback) as F;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? result : undefined;
};
