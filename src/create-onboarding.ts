import { useOnboarding } from "./context";
import { OnboardingProvider } from "./provider";
import { onboardTarget, type TargetProps } from "./target";
import type { OnboardingApi, Tour, TourStep } from "./types";

/** Define a tour. Steps are checked against `TTarget` when you provide it. */
export function defineTour<TTarget extends string = string>(
  id: string,
  steps: readonly TourStep<TTarget>[],
): Tour<TTarget> {
  return { id, steps };
}

export interface Onboarding<TTarget extends string> {
  OnboardingProvider: typeof OnboardingProvider;
  useOnboarding: () => OnboardingApi<TTarget>;
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
    defineTour: (id, steps) => defineTour<TTarget>(id, steps),
    target: (id) => onboardTarget(id),
  };
}
