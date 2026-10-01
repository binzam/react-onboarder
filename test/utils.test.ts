import { describe, expect, it } from "vitest";
import {
  buildSpotlightPath,
  clamp,
  resolveTarget,
  waitForTarget,
} from "../src/utils";

describe("buildSpotlightPath", () => {
  it("cuts a padded, rounded hole out of the viewport", () => {
    const path = buildSpotlightPath(
      1000,
      800,
      { x: 100, y: 100, width: 200, height: 100 },
      10,
      12,
    );
    expect(path.startsWith('path(evenodd, "M0 0 H1000 V800 H0 Z')).toBe(true);
    // Hole starts at (x - padding + radius, y - padding).
    expect(path).toContain("M102 90");
  });

  it("clamps the hole to the viewport for targets that overflow it", () => {
    const path = buildSpotlightPath(
      500,
      400,
      { x: -50, y: -50, width: 2000, height: 2000 },
      8,
      12,
    );
    expect(path).toContain("H500");
    expect(path).not.toContain("NaN");
  });

  it("never produces a negative radius", () => {
    const path = buildSpotlightPath(500, 400, { x: 10, y: 10, width: 0, height: 0 }, 0, 12);
    expect(path).not.toContain("-");
  });
});

describe("clamp", () => {
  it("keeps values inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("resolveTarget", () => {
  it("finds an element by target id, including ids with quotes", () => {
    document.body.innerHTML = `<div data-onboarder-target='say "hi"'></div>`;
    expect(resolveTarget('say "hi"')).toBe(document.body.firstElementChild);
  });

  it("calls a resolver function", () => {
    const el = document.createElement("div");
    expect(resolveTarget(() => el)).toBe(el);
  });
});

describe("waitForTarget", () => {
  it("resolves as soon as the element appears", async () => {
    document.body.innerHTML = "";
    const controller = new AbortController();
    const promise = waitForTarget(() => resolveTarget("late"), {
      timeout: 1000,
      signal: controller.signal,
    });
    const el = document.createElement("div");
    el.setAttribute("data-onboarder-target", "late");
    document.body.appendChild(el);
    await expect(promise).resolves.toBe(el);
  });

  it("resolves null after the timeout", async () => {
    document.body.innerHTML = "";
    const controller = new AbortController();
    await expect(
      waitForTarget(() => resolveTarget("never"), { timeout: 20, signal: controller.signal }),
    ).resolves.toBeNull();
  });

  it("resolves null when aborted", async () => {
    document.body.innerHTML = "";
    const controller = new AbortController();
    const promise = waitForTarget(() => resolveTarget("never"), {
      timeout: 5000,
      signal: controller.signal,
    });
    controller.abort();
    await expect(promise).resolves.toBeNull();
  });
});
