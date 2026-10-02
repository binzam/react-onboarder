export { OnboardingProvider, defaultLabels } from "./provider";
export { useOnboarding } from "./context";
export { useAutoStartTour } from "./use-auto-start-tour";
export type { AutoStartTourOptions } from "./use-auto-start-tour";
export { createOnboarding } from "./create-onboarding";
export type { Onboarding } from "./create-onboarding";
export { onboardTarget, TARGET_ATTRIBUTE } from "./target";
export type { TargetProps } from "./target";
export { createWebStorage, createMemoryStorage } from "./storage";
export type { WebStorageOptions } from "./storage";
export type {
  OnboardingApi,
  OnboardingCardProps,
  OnboardingClassNames,
  OnboardingLabels,
  OnboardingProviderProps,
  OnboardingSlot,
  OnboardingStorage,
  TargetResolver,
  Tour,
  TourStep,
} from "./types";
