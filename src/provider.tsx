import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { OnboardingContext } from "./context";
import { DEFAULT_PADDING, DEFAULT_RADIUS, DEFAULT_Z_INDEX } from "./constants";
import { useEvent } from "./hooks";
import { TourOverlay } from "./overlay";
import { createWebStorage } from "./storage";
import { createSlotResolver } from "./styles";
import type {
  OnboardingApi,
  OnboardingLabels,
  OnboardingProviderProps,
  Tour,
} from "./types";

export const defaultLabels: OnboardingLabels = {
  next: "Next",
  back: "Back",
  finish: "Finish",
  skip: "Skip tour",
  goToStep: (step) => `Go to step ${step}`,
  stepCounter: (current, total) => `Step ${current} of ${total}`,
};

interface Session {
  tour: Tour;
  stepIndex: number;
}

export function OnboardingProvider({
  children,
  storage,
  labels,
  classNames,
  unstyled = false,
  zIndex = DEFAULT_Z_INDEX,
  container,
  renderCard,
  showArrow = true,
  closeOnOverlayClick = false,
  allowTargetInteraction = true,
  keyboard = true,
  padding = DEFAULT_PADDING,
  radius = DEFAULT_RADIUS,
  onStart,
  onStepChange,
  onComplete,
  onSkip,
}: OnboardingProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const resolvedStorage = useMemo(
    () => storage ?? createWebStorage(),
    [storage],
  );
  const resolvedLabels = useMemo(
    () => ({ ...defaultLabels, ...labels }),
    [labels],
  );
  const part = useMemo(
    () => createSlotResolver({ unstyled, classNames }),
    [unstyled, classNames],
  );

  // useEvent keeps every handler's identity stable while it always reads the
  // latest session and props, so none of this leaks into effect dependencies.
  const startTour = useEvent((tour: Tour) => {
    if (tour.steps.length === 0) return;
    setSession({ tour, stepIndex: 0 });
    onStart?.(tour.id);
  });

  const goTo = useEvent((index: number) => {
    if (!session) return;
    const last = session.tour.steps.length - 1;
    const stepIndex = Math.min(Math.max(index, 0), last);
    if (stepIndex === session.stepIndex) return;
    setSession({ tour: session.tour, stepIndex });
    onStepChange?.(session.tour.id, stepIndex);
  });

  const finish = useEvent(() => {
    if (!session) return;
    resolvedStorage.markSeen(session.tour.id);
    setSession(null);
    onComplete?.(session.tour.id);
  });

  const next = useEvent(() => {
    if (!session) return;
    if (session.stepIndex >= session.tour.steps.length - 1) finish();
    else goTo(session.stepIndex + 1);
  });

  const prev = useEvent(() => {
    if (session) goTo(session.stepIndex - 1);
  });

  const stopTour = useEvent(() => {
    if (!session) return;
    resolvedStorage.markSeen(session.tour.id);
    setSession(null);
    onSkip?.(session.tour.id, session.stepIndex);
  });

  const hasSeenTour = useEvent((tourId: string) =>
    resolvedStorage.isSeen(tourId),
  );
  const resetTour = useEvent((tourId: string) => {
    resolvedStorage.reset?.(tourId);
  });

  const api = useMemo<OnboardingApi>(
    () => ({
      activeTourId: session?.tour.id ?? null,
      stepIndex: session?.stepIndex ?? 0,
      totalSteps: session?.tour.steps.length ?? 0,
      isRunning: session !== null,
      startTour,
      stopTour,
      next,
      prev,
      goTo,
      hasSeenTour,
      resetTour,
    }),
    [session, startTour, stopTour, next, prev, goTo, hasSeenTour, resetTour],
  );

  const step = session?.tour.steps[session.stepIndex];

  return (
    <OnboardingContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {session && step ? (
          <TourOverlay
            key={session.tour.id}
            step={step}
            stepIndex={session.stepIndex}
            totalSteps={session.tour.steps.length}
            labels={resolvedLabels}
            part={part}
            zIndex={zIndex}
            container={container}
            padding={padding}
            radius={radius}
            showArrow={showArrow}
            keyboard={keyboard}
            closeOnOverlayClick={closeOnOverlayClick}
            allowTargetInteraction={allowTargetInteraction}
            renderCard={renderCard}
            onNext={next}
            onPrev={prev}
            onSkip={stopTour}
            onGoTo={goTo}
          />
        ) : null}
      </AnimatePresence>
    </OnboardingContext.Provider>
  );
}
