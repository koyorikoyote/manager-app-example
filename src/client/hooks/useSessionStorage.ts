import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing session storage with type safety and SSR compatibility
 * @param key - The session storage key
 * @param initialValue - The initial value if no stored value exists
 * @returns [value, setValue] tuple similar to useState
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with initial value (SSR safe)
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Load value from session storage after hydration
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key]);

  // Update session storage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        // Save to session storage if available
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
