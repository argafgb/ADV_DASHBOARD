import { useEffect, useState } from "react";

/**
 * Custom hook that returns a debounced version of the provided value.
 * Updates only after `delay` milliseconds have passed without value changes.
 *
 * @param value The value to debounce (string, object, etc.)
 * @param delay Delay in milliseconds (default: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
