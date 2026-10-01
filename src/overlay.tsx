import { MotionConfig, motion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CardPositioner, DefaultCard } from "./card";
import { DEFAULT_TARGET_TIMEOUT } from "./constants";
import type { SlotResolver } from "./styles";
import type { OnboardingCardProps, OnboardingLabels, TourStep } from "./types";
import {
  buildSpotlightPath,
  isEditableTarget,
  rectFromElement,
  rectsEqual,
  resolveTarget,
  scrollTargetIntoView,
  waitForTarget,
  type Rect,
} from "./utils";

export interface TourOverlayProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  labels: OnboardingLabels;
  part: SlotResolver;
  zIndex: number;
  container: HTMLElement | null | undefined;
  padding: number;
  radius: number;
  showArrow: boolean;
  keyboard: boolean;
  closeOnOverlayClick: boolean;
  allowTargetInteraction: boolean;
  renderCard: ((props: OnboardingCardProps) => ReactNode) | undefined;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onGoTo: (index: number) => void;
}

/** The element a step resolved to. `el` is null for centered steps. */
interface Located {
  stepIndex: number;
  el: HTMLElement | null;
}

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  labels,
  part,
  zIndex,
  container,
  padding: defaultPadding,
  radius: defaultRadius,
  showArrow,
  keyboard,
  closeOnOverlayClick,
  allowTargetInteraction,
  renderCard,
  onNext,
  onPrev,
  onSkip,
  onGoTo,
}: TourOverlayProps) {
  const [located, setLocated] = useState<Located | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState(readViewport);
  const titleId = useId();
  const contentId = useId();

  // Give focus back to whatever had it when the tour started.
  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    return () => {
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, []);

  // Keep the backdrop path covering the whole screen.
  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Resolve this step's target: run onBeforeShow, wait for the element (it may
  // appear after a navigation), then scroll it into view.
  useEffect(() => {
    const controller = new AbortController();

    async function locate() {
      try {
        await step.onBeforeShow?.();
      } catch (error) {
        console.error("[react-onboarder] onBeforeShow failed", error);
      }
      if (controller.signal.aborted) return;

      const target = step.target;
      if (target === undefined) {
        setLocated({ stepIndex, el: null });
        return;
      }

      const el = await waitForTarget(() => resolveTarget(target), {
        timeout: step.timeout ?? DEFAULT_TARGET_TIMEOUT,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (!el) {
        console.warn(
          `[react-onboarder] Target for step ${stepIndex + 1} was not found; skipping it.`,
        );
        onNext();
        return;
      }

      setLocated({ stepIndex, el });
      if (!step.disableScroll) scrollTargetIntoView(el);
    }

    void locate();
    return () => controller.abort();
  }, [step, stepIndex, onNext]);

  // Track the target's on-screen box every frame. That covers scrolling,
  // resizing and layout shifts (table rows arriving) without separate listeners.
  const targetEl = located?.el ?? null;
  useEffect(() => {
    if (!targetEl) return;
    let frame = 0;
    const measure = () => {
      // Ignore a target that left the DOM (route change) instead of collapsing the spotlight.
      if (targetEl.isConnected) {
        const next = rectFromElement(targetEl);
        setRect((prev) => (prev && rectsEqual(prev, next) ? prev : next));
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [targetEl]);

  useEffect(() => {
    if (!keyboard) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === "Escape") {
        onSkip();
        return;
      }
      // Don't hijack arrow keys while someone is typing.
      if (isEditableTarget(event.target)) return;
      if (event.key === "ArrowRight") onNext();
      else if (event.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboard, onNext, onPrev, onSkip]);

  // The previous step's backdrop stays put until the next target is found, so
  // the spotlight glides between steps. The card waits for its own target.
  const cardReady = located !== null && located.stepIndex === stepIndex;
  const spotlightRect = targetEl ? rect : null;
  const visible =
    located !== null && (targetEl === null || spotlightRect !== null);
  if (!visible) return null;

  const padding = step.padding ?? defaultPadding;
  const radius = step.radius ?? defaultRadius;
  const clipPath = spotlightRect
    ? buildSpotlightPath(
        viewport.width,
        viewport.height,
        spotlightRect,
        padding,
        radius,
      )
    : undefined;

  const cardProps: OnboardingCardProps = {
    step,
    stepIndex,
    totalSteps,
    isFirst: stepIndex === 0,
    isLast: stepIndex === totalSteps - 1,
    titleId,
    contentId,
    labels,
    next: onNext,
    prev: onPrev,
    skip: onSkip,
    goTo: onGoTo,
  };

  return createPortal(
    <MotionConfig reducedMotion="user">
      <motion.div
        {...part("root")}
        style={{ zIndex }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Dimmed backdrop with a rounded hole over the target. Clicks inside
            the hole reach the target; clicks anywhere else are blocked. */}
        <div
          {...part("backdrop")}
          style={{ clipPath }}
          onClick={closeOnOverlayClick ? onSkip : undefined}
          aria-hidden="true"
        />

        {spotlightRect && (
          <div
            {...part("ring")}
            style={{
              left: spotlightRect.x - padding,
              top: spotlightRect.y - padding,
              width: spotlightRect.width + padding * 2,
              height: spotlightRect.height + padding * 2,
              borderRadius: radius,
              pointerEvents: allowTargetInteraction ? "none" : "auto",
            }}
          />
        )}

        {cardReady && (
          <CardPositioner
            key={stepIndex}
            targetEl={targetEl}
            placement={step.placement}
            showArrow={showArrow}
            part={part}
            titleId={titleId}
            describedBy={step.content !== undefined ? contentId : undefined}
          >
            {renderCard ? (
              renderCard(cardProps)
            ) : (
              <DefaultCard {...cardProps} part={part} />
            )}
          </CardPositioner>
        )}
      </motion.div>
    </MotionConfig>,
    container ?? document.body,
  );
}
