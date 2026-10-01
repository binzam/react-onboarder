import { useEffect } from "react";
import { useOnboarding } from "./context";
import { useEvent } from "./hooks";
import type { Tour } from "./types";

export interface AutoStartTourOptions {
  /** Set false to hold the tour back, e.g. until data has loaded. Default true. */
  enabled?: boolean;
  /** Milliseconds to wait after mount so the page can settle. Default 500. */
  delay?: number;
}

/**
 * Starts a tour the first time a user reaches a view, unless they've already
 * seen it or another tour is running. Call it once in the component the tour
 * belongs to.
 */
export function useAutoStartTour<TTarget extends string>(
  tour: Tour<TTarget>,
  { enabled = true, delay = 500 }: AutoStartTourOptions = {},
): void {
  const { startTour, hasSeenTour, isRunning } = useOnboarding<TTarget>();

  // Read the latest values when the timer fires, not when it was scheduled.
  const start = useEvent(() => {
    if (!isRunning && !hasSeenTour(tour.id)) startTour(tour);
  });

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(start, delay);
    return () => window.clearTimeout(timer);
  }, [enabled, delay, tour.id, start]);
}
