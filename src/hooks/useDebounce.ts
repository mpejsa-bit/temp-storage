import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Returns a debounced copy of `value` that only updates
 * after `delay` ms of inactivity.
 */
export function useDebounce<T>(value: T, delay = 800): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * Returns a debounced version of `callback`.
 * Calling the returned function resets the timer; the real
 * callback fires `delay` ms after the last invocation.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 800,
): T {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const latestCb = useRef(callback);
  latestCb.current = callback;

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return useCallback(
    ((...args: any[]) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => latestCb.current(...args), delay);
    }) as T,
    [delay],
  );
}
