import { TALL_TARGET_RATIO, TARGET_ATTRIBUTE } from "./constants";
import type { TargetResolver } from "./types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportRect extends Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function rectFromElement(el: Element): Rect {
  const { x, y, width, height } = el.getBoundingClientRect();
  return { x, y, width, height };
}

export function rectsEqual(a: Rect, b: Rect, tolerance = 0.5): boolean {
  return (
    Math.abs(a.x - b.x) < tolerance &&
    Math.abs(a.y - b.y) < tolerance &&
    Math.abs(a.width - b.width) < tolerance &&
    Math.abs(a.height - b.height) < tolerance
  );
}

function toViewportRect(
  x: number,
  y: number,
  width: number,
  height: number,
): ViewportRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  };
}

/**
 * The part of an element that is actually on screen (its box intersected with
 * the viewport). Anchoring the card to this instead of the full box keeps the
 * card in view when the target is taller or wider than the viewport. Falls
 * back to the real box when the element is entirely off screen.
 */
export function visibleRectFromElement(el: Element): ViewportRect {
  const box = el.getBoundingClientRect();
  const left = Math.max(box.left, 0);
  const top = Math.max(box.top, 0);
  const right = Math.min(box.right, document.documentElement.clientWidth);
  const bottom = Math.min(box.bottom, document.documentElement.clientHeight);
  if (right <= left || bottom <= top) {
    return toViewportRect(box.left, box.top, box.width, box.height);
  }
  return toViewportRect(left, top, right - left, bottom - top);
}

/**
 * Builds an SVG path (evenodd) covering the viewport with a rounded hole cut
 * out. Used as `clip-path: path(...)` so the dimmed backdrop reveals the
 * target untouched, which means the target never needs a z-index of its own.
 *
 * The command structure is identical between calls (only coordinates change),
 * so browsers can animate `clip-path` smoothly from one step to the next.
 */
export function buildSpotlightPath(
  viewportWidth: number,
  viewportHeight: number,
  rect: Rect,
  padding: number,
  radius: number,
): string {
  const x = clamp(rect.x - padding, 0, viewportWidth);
  const y = clamp(rect.y - padding, 0, viewportHeight);
  const w = Math.min(rect.width + padding * 2, viewportWidth - x);
  const h = Math.min(rect.height + padding * 2, viewportHeight - y);
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));

  const outer = `M0 0 H${viewportWidth} V${viewportHeight} H0 Z`;
  const inner = [
    `M${x + r} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");

  return `path(evenodd, "${outer} ${inner}")`;
}

export function resolveTarget(
  target: string | TargetResolver,
): HTMLElement | null {
  if (typeof target === "function") return target();
  const escaped = target.replace(/["\\]/g, "\\$&");
  return document.querySelector<HTMLElement>(
    `[${TARGET_ATTRIBUTE}="${escaped}"]`,
  );
}

interface WaitOptions {
  timeout: number;
  signal: AbortSignal;
}

/**
 * Resolves with the element as soon as it exists, or null after `timeout` ms
 * or when `signal` aborts. Reacts to DOM mutations instead of polling, and
 * always disconnects its observer.
 */
export function waitForTarget(
  find: () => HTMLElement | null,
  { timeout, signal }: WaitOptions,
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const existing = find();
    if (existing) {
      resolve(existing);
      return;
    }
    if (signal.aborted) {
      resolve(null);
      return;
    }

    let timer = 0;
    const observer = new MutationObserver(() => {
      const el = find();
      if (el) finish(el);
    });

    function finish(result: HTMLElement | null) {
      observer.disconnect();
      window.clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve(result);
    }
    function onAbort() {
      finish(null);
    }

    timer = window.setTimeout(() => finish(null), timeout);
    signal.addEventListener("abort", onAbort, { once: true });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [TARGET_ATTRIBUTE],
    });
  });
}

/** Centering a target taller than the viewport shows its middle; its top is what people expect. */
export function scrollTargetIntoView(el: HTMLElement): void {
  const isTall =
    el.getBoundingClientRect().height > window.innerHeight * TALL_TARGET_RATIO;
  el.scrollIntoView({
    behavior: "smooth",
    block: isTall ? "start" : "center",
    inline: "nearest",
  });
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
