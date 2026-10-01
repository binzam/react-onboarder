import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A stable callback that always calls the latest `callback`. Lets effects and
 * memoized values use fresh props and state without listing them as deps.
 */
export function useEvent<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  const ref = useRef(callback);
  useIsomorphicLayoutEffect(() => {
    ref.current = callback;
  });
  return useCallback((...args: TArgs) => ref.current(...args), []);
}
