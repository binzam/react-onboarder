import { twMerge } from "tailwind-merge";
import type { OnboardingClassNames, OnboardingSlot } from "./types";

/**
 * Layout-critical classes. These stay even with `unstyled`, because the
 * overlay, the spotlight and the "card always fits the viewport" guarantee
 * depend on them. Consumers can still override them through `classNames`.
 *
 * Keep every class here a complete literal string: Tailwind finds classes by
 * scanning this package's output for them.
 */
const structural: Partial<Record<OnboardingSlot, string>> = {
  root: "fixed inset-0",
  backdrop: "absolute inset-0",
  ring: "absolute",
  card: "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden",
  header: "flex shrink-0 items-start justify-between gap-3",
  body: "min-h-0 overflow-y-auto",
  footer: "flex shrink-0 items-center justify-between gap-3",
  dots: "flex items-center gap-1.5",
  actions: "flex items-center gap-2",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500";

/** The default look. `unstyled` drops all of these. */
export const defaultClassNames: Record<OnboardingSlot, string> = {
  root: "",
  backdrop:
    "bg-zinc-950/60 backdrop-blur-[1px] transition-[clip-path] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
  ring: "ring-[6px] ring-amber-500/80 animate-pulse transition-[left,top,width,height] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none motion-reduce:transition-none",
  positioner: "w-[min(360px,90vw)]",
  arrow: "fill-white dark:fill-zinc-900",
  card: "rounded-2xl border border-zinc-900/10 bg-white text-zinc-900 shadow-2xl dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50",
  header: "px-5 pt-4",
  stepCount:
    "text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400",
  close: `cursor-pointer rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-50 ${focusRing}`,
  body: "px-5 pb-4 pt-1",
  title: "text-lg font-semibold leading-snug",
  content: "mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300",
  footer:
    "border-t border-zinc-900/5 bg-zinc-50 px-5 py-3 dark:border-white/10 dark:bg-zinc-800/60",
  dots: "",
  dot: "block h-1.5 w-1.5 rounded-full bg-zinc-900/15 transition-all duration-300 motion-reduce:transition-none dark:bg-white/20",
  dotActive: "w-4 bg-amber-500 dark:bg-amber-500",
  actions: "",
  backButton: `inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-zinc-50 ${focusRing}`,
  nextButton: `inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[13px] font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-amber-600 ${focusRing}`,
};

export interface SlotAttributes {
  "data-slot": string;
  className: string;
}

/** Returns the `data-slot` and merged `className` for a part of the UI. */
export type SlotResolver = (slot: OnboardingSlot) => SlotAttributes;

export function createSlotResolver(options: {
  unstyled: boolean;
  classNames: OnboardingClassNames | undefined;
}): SlotResolver {
  const { unstyled, classNames } = options;
  return (slot) => ({
    "data-slot": `onboarder-${slot}`,
    className: twMerge(
      structural[slot],
      unstyled ? undefined : defaultClassNames[slot],
      classNames?.[slot],
    ),
  });
}

export { twMerge as mergeClasses };
