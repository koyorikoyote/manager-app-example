/**
 * useDebounce Hook - Debounces a value to improve performance
 *
 * This hook delays updating the debounced value until after the specified
 * delay has passed since the last time the input value changed.
 */
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay is complete
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback Hook - Debounces a callback function
 *
 * This hook returns a debounced version of the callback that will only
 * execute after the specified delay has passed since the last call.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedFn = ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T;

    setDebouncedCallback(() => debouncedFn);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [callback, delay]);

  return debouncedCallback || callback;
}

/**
 * useThrottledCallback Hook - Throttles a callback function
 *
 * This hook returns a throttled version of the callback that will only
 * execute at most once per the specified interval.
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  interval: number
): T {
  const [lastCallTime, setLastCallTime] = useState<number>(0);

  const throttledCallback = ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallTime >= interval) {
      setLastCallTime(now);
      callback(...args);
    }
  }) as T;

  return throttledCallback;
}
