import { useOnboarding } from "./context";
import { OnboardingProvider } from "./provider";
import { onboardTarget, type TargetProps } from "./target";
import type { OnboardingApi, Tour, TourStep } from "./types";

export interface Onboarding<TTarget extends string> {
  OnboardingProvider: typeof OnboardingProvider;
  useOnboarding: () => OnboardingApi<TTarget>;
  /** Define a tour. Every step's `target` is checked against `TTarget`. */
  defineTour: (
    id: string,
    steps: readonly TourStep<TTarget>[],
  ) => Tour<TTarget>;
  target: (id: TTarget) => TargetProps<TTarget>;
}

/**
 * Binds the API to your own union of target ids, so a typo in a step's
 * `target` or in `target("...")` is a compile error with autocomplete.
 *
 * Export what it returns from ONE file in your app and import `defineTour`,
 * `useOnboarding` and `target` from that file everywhere. There is deliberately
 * no package-level `defineTour`: it couldn't know your ids and would accept
 * any string.
 *
 * Call it in a file marked "use client" (it returns client components), and in
 * Server Components use `onboardTarget` from `@binii/react-onboarder/target`.
 */
export function createOnboarding<
  TTarget extends string,
>(): Onboarding<TTarget> {
  function useTypedOnboarding(): OnboardingApi<TTarget> {
    return useOnboarding<TTarget>();
  }

  return {
    OnboardingProvider,
    useOnboarding: useTypedOnboarding,
    defineTour: (id, steps) => ({ id, steps }),
    target: (id) => onboardTarget(id),
  };
}
