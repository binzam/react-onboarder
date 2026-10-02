// Compile-time tests: `pnpm typecheck` fails if any @ts-expect-error below stops
// producing an error, or if any plain line starts producing one. Not run by vitest.
import * as lib from "../src";
import { createOnboarding, useOnboarding as looseUseOnboarding } from "../src";

type Target = "nav" | "table";
const { defineTour, useOnboarding, target } = createOnboarding<Target>();

// A tour bound to your ids: valid ids pass, a typo is an error.
export const ok = defineTour("t", [
  { title: "Centered, no target" },
  { target: "nav", title: "Nav" },
  { target: () => document.body, title: "Resolver function" },
]);
export const typo = defineTour("t", [
  // @ts-expect-error "nope" is not part of Target
  { target: "nope", title: "Typo" },
]);

// `target()` is bound too.
target("table");
// @ts-expect-error "nope" is not part of Target
target("nope");

// The package must not export a loose, unbound `defineTour`: it would accept
// any string and silently disable these checks.
// @ts-expect-error defineTour is only available from createOnboarding()
export const looseDefineTour = lib.defineTour;

export function Check() {
  const typed = useOnboarding();
  typed.startTour(ok);

  // The generic package-level hook still works for generic code.
  const loose = looseUseOnboarding<Target>();
  loose.startTour(ok);
}
