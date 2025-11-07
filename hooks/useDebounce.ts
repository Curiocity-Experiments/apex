/**
 * useDebounce Hook
 *
 * Delays updating a value until after a specified delay.
 * Used for auto-save functionality to avoid excessive API calls.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default 1000ms)
 * @returns Debounced value
 */

'use client';

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 1000): T {
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
