import {
  FloatingArrow,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
} from "@floating-ui/react";
import { motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { ARROW_HEIGHT, ARROW_WIDTH, VIEWPORT_PADDING } from "./constants";
import { CheckIcon, CloseIcon } from "./icons";
import { mergeClasses, type SlotResolver } from "./styles";
import type { OnboardingCardProps } from "./types";
import { visibleRectFromElement } from "./utils";

interface CardPositionerProps {
  /** The element to point at. Null centers the card in the viewport. */
  targetEl: HTMLElement | null;
  placement: Placement | undefined;
  showArrow: boolean;
  part: SlotResolver;
  titleId: string;
  /** Only set when the step has content to describe. */
  describedBy: string | undefined;
  children: ReactNode;
}

const CENTERED = "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";

/**
 * Places the card next to the target, flips it to the side with room, and
 * keeps it inside the viewport even when the target is taller than the
 * screen (see `visibleRectFromElement`). Also owns the dialog semantics and
 * moves focus into the card when a step opens.
 */
export function CardPositioner({
  targetEl,
  placement,
  showArrow,
  part,
  titleId,
  describedBy,
  children,
}: CardPositionerProps) {
  const arrowRef = useRef<SVGSVGElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    refs,
    floatingStyles,
    context,
    placement: finalPlacement,
    middlewareData,
  } = useFloating({
    placement: placement ?? "bottom",
    // animationFrame keeps the card glued to the target through smooth
    // scrolling and late layout shifts (e.g. table rows arriving).
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, { animationFrame: true }),
    middleware: [
      offset(16),
      flip({ padding: VIEWPORT_PADDING }),
      // crossAxis with no limiter: when no side fits (the target fills the
      // viewport), pull the card inside the viewport even if it overlaps the
      // target, instead of leaving it cropped off screen.
      shift({ padding: VIEWPORT_PADDING, crossAxis: true }),
      // eslint-disable-next-line react-hooks/refs
      arrow({ element: arrowRef, padding: 12 }),
    ],
  });

  // Anchor to the on-screen part of the target, not its full box.
  useEffect(() => {
    if (!targetEl) {
      refs.setPositionReference(null);
      return;
    }
    refs.setPositionReference({
      contextElement: targetEl,
      getBoundingClientRect: () => visibleRectFromElement(targetEl),
    });
  }, [targetEl, refs]);

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  // If shift had to move the card along the side axis it now overlaps the
  // target, and an arrow would point at the wrong place: hide it.
  const side = finalPlacement.split("-")[0];
  const sideAxisShift =
    side === "top" || side === "bottom"
      ? middlewareData.shift?.y
      : middlewareData.shift?.x;
  const isDocked = Math.abs(sideAxisShift ?? 0) > 0.5;

  const positioner = part("positioner");
  const arrowPart = part("arrow");

  return (
    <div
      ref={refs.setFloating}
      data-slot={positioner["data-slot"]}
      className={
        targetEl ? positioner.className : mergeClasses(CENTERED, positioner.className)
      }
      style={targetEl ? floatingStyles : undefined}
    >
      {showArrow && targetEl && !isDocked && (
        <FloatingArrow
          ref={arrowRef}
          context={context}
          width={ARROW_WIDTH}
          height={ARROW_HEIGHT}
          data-slot={arrowPart["data-slot"]}
          className={arrowPart.className}
        />
      )}
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        data-slot="onboarder-dialog"
        className="outline-none"
        initial={{ opacity: 0, scale: 0.96, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface DefaultCardProps extends OnboardingCardProps {
  part: SlotResolver;
}

export function DefaultCard({
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  titleId,
  contentId,
  labels,
  next,
  prev,
  skip,
  goTo,
  part,
}: DefaultCardProps) {
  const dot = part("dot");
  const dotActive = part("dotActive");

  return (
    <div {...part("card")}>
      <div {...part("header")}>
        <p {...part("stepCount")}>{labels.stepCounter(stepIndex + 1, totalSteps)}</p>
        <button type="button" onClick={skip} aria-label={labels.skip} {...part("close")}>
          <CloseIcon />
        </button>
      </div>

      <div {...part("body")}>
        <h2 id={titleId} {...part("title")}>
          {step.title}
        </h2>
        {step.content !== undefined && (
          <div id={contentId} {...part("content")}>
            {step.content}
          </div>
        )}
      </div>

      <div {...part("footer")}>
        <div {...part("dots")}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={labels.goToStep(index + 1)}
              aria-current={index === stepIndex ? "step" : undefined}
              onClick={() => goTo(index)}
              className="cursor-pointer p-1"
            >
              <span
                data-slot={dot["data-slot"]}
                data-active={index === stepIndex ? "true" : undefined}
                className={
                  index === stepIndex
                    ? mergeClasses(dot.className, dotActive.className)
                    : dot.className
                }
              />
            </button>
          ))}
        </div>

        <div {...part("actions")}>
          {!isFirst && (
            <button type="button" onClick={prev} {...part("backButton")}>
              {labels.back}
            </button>
          )}
          <button type="button" onClick={next} {...part("nextButton")}>
            {isLast ? labels.finish : labels.next}
            {isLast && <CheckIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
