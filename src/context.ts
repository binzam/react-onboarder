import { createContext, useContext } from "react";
import type { OnboardingApi } from "./types";

export const OnboardingContext = createContext<OnboardingApi | null>(null);

/**
 * Controls for the running tour.
 *
 * Prefer the `useOnboarding` returned by `createOnboarding<Target>()` (import it
 * from your own onboarding file): it is bound to your target ids. This
 * package-level hook is for generic code; pass your union explicitly to type it:
 * `useOnboarding<"orders-table" | "nav-orders">()`.
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
