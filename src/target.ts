import { TARGET_ATTRIBUTE } from "./constants";

export { TARGET_ATTRIBUTE };

export interface TargetProps<TTarget extends string = string> {
  readonly "data-onboarder-target": TTarget;
}

/**
 * Props to spread onto the element a tour step should highlight:
 * `<div {...onboardTarget("orders-table")} />`.
 *
 * Also exported from `@binii/react-onboarder/target`, an entry without the
 * "use client" directive, so it can be called inside Server Components.
 */
export function onboardTarget<TTarget extends string>(
  id: TTarget,
): TargetProps<TTarget> {
  return { [TARGET_ATTRIBUTE]: id };
}
