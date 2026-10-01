import { createContext, useContext } from "react";
import type { OnboardingApi } from "./types";

export const OnboardingContext = createContext<OnboardingApi | null>(null);

/**
 * Controls for the running tour. Pass your target-id union to get typed
 * `startTour`: `useOnboarding<"orders-table" | "nav-orders">()`.
 */
export function useOnboarding<
  TTarget extends string = string,
>(): OnboardingApi<TTarget> {
  const api = useContext(OnboardingContext);
  if (!api) {
    throw new Error(
      "useOnboarding must be used within an <OnboardingProvider>",
    );
  }
  return api;
}
