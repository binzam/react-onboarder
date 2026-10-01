import type { Placement } from "@floating-ui/react";
import type { ReactNode } from "react";

/** Returns the element to highlight. Use for elements you can't tag with a target id. */
export type TargetResolver = () => HTMLElement | null;

export interface TourStep<TTarget extends string = string> {
  /**
   * Target id (see `onboardTarget`) or a function returning the element.
   * Omit it for a centered step with no spotlight, e.g. a welcome screen.
   */
  readonly target?: TTarget | TargetResolver;
  readonly title: ReactNode;
  readonly content?: ReactNode;
  /** Preferred side for the card. It flips and shifts automatically when there's no room. */
  readonly placement?: Placement;
  /** Space (px) between the target and the spotlight edge. Falls back to the provider's `padding`. */
  readonly padding?: number;
  /** Corner radius (px) of the spotlight cutout. Falls back to the provider's `radius`. */
  readonly radius?: number;
  /**
   * Runs before the target is looked up, e.g. to navigate or switch a tab so
   * the target exists. May be async; the tour waits for it.
   */
  readonly onBeforeShow?: () => void | Promise<void>;
  /** Skip the automatic scroll-into-view for this step. */
  readonly disableScroll?: boolean;
  /** How long (ms) to wait for the target to appear before skipping the step. Default 3000. */
  readonly timeout?: number;
}

export interface Tour<TTarget extends string = string> {
  readonly id: string;
  readonly steps: readonly TourStep<TTarget>[];
}

export interface OnboardingApi<TTarget extends string = string> {
  readonly activeTourId: string | null;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly isRunning: boolean;
  startTour: (tour: Tour<TTarget>) => void;
  /** Dismiss the running tour. It is marked as seen. */
  stopTour: () => void;
  /** Go to the next step, or finish the tour on the last one. */
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  hasSeenTour: (tourId: string) => boolean;
  resetTour: (tourId: string) => void;
}

export interface OnboardingLabels {
  next: string;
  back: string;
  finish: string;
  /** Accessible name of the close button. */
  skip: string;
  goToStep: (step: number) => string;
  stepCounter: (current: number, total: number) => string;
}

export type OnboardingSlot =
  | "root"
  | "backdrop"
  | "ring"
  | "positioner"
  | "arrow"
  | "card"
  | "header"
  | "stepCount"
  | "close"
  | "body"
  | "title"
  | "content"
  | "footer"
  | "dots"
  | "dot"
  | "dotActive"
  | "actions"
  | "backButton"
  | "nextButton";

/** Tailwind classes merged over the defaults (conflicts resolve in your favor). */
export type OnboardingClassNames = Partial<Record<OnboardingSlot, string>>;

export interface OnboardingStorage {
  isSeen: (tourId: string) => boolean;
  markSeen: (tourId: string) => void;
  reset?: (tourId: string) => void;
}

/** Everything a custom card needs. The library still positions and animates it. */
export interface OnboardingCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  /** Put on your heading so the dialog is labelled correctly. */
  titleId: string;
  /** Put on your body text so the dialog is described correctly. */
  contentId: string;
  labels: OnboardingLabels;
  next: () => void;
  prev: () => void;
  skip: () => void;
  goTo: (index: number) => void;
}

export interface OnboardingProviderProps {
  children: ReactNode;
  /** Where "seen" state lives. Defaults to localStorage under `react-onboarder:seen:`. */
  storage?: OnboardingStorage;
  /** Override any label, e.g. to translate the UI. */
  labels?: Partial<OnboardingLabels>;
  /** Tailwind classes per part of the UI. */
  classNames?: OnboardingClassNames;
  /** Drop the default look (layout-critical classes stay) and style everything via `classNames`. */
  unstyled?: boolean;
  /** Stacking order of the whole overlay. Default 2147483000. */
  zIndex?: number;
  /** Portal target. Defaults to `document.body`. */
  container?: HTMLElement | null;
  /** Replace the default card. */
  renderCard?: (props: OnboardingCardProps) => ReactNode;
  /** Show the arrow pointing at the target. Default true. */
  showArrow?: boolean;
  /** Dismiss the tour when the dimmed backdrop is clicked. Default false. */
  closeOnOverlayClick?: boolean;
  /** Let clicks reach the highlighted element. Default true. */
  allowTargetInteraction?: boolean;
  /** Escape closes the tour; left/right arrows move between steps. Default true. */
  keyboard?: boolean;
  /** Default spotlight padding in px. Default 8. */
  padding?: number;
  /** Default spotlight corner radius in px. Default 12. */
  radius?: number;
  onStart?: (tourId: string) => void;
  onStepChange?: (tourId: string, stepIndex: number) => void;
  onComplete?: (tourId: string) => void;
  onSkip?: (tourId: string, stepIndex: number) => void;
}
