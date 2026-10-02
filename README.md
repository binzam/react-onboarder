# @binii/react-onboarder

Fluid, type-safe product tours for React and Next.js. Styled with Tailwind, animated with Framer Motion, positioned with Floating UI.

- **No z-index wars.** The page is dimmed by one fixed overlay with a hole cut out over your target. Your element is never lifted or re-parented, so it keeps its own stacking context.
- **The card never leaves the screen.** It anchors to the visible part of the target, flips to the side with room, and docks inside the viewport when the target is taller than the screen.
- **Typed end to end.** Bind the API to your own union of target ids; a typo in a step is a compile error.
- **Tailwind-native.** Defaults are plain Tailwind classes; override any part with `classNames` (merged with `tailwind-merge`, so your classes win), or go `unstyled`.
- **Next.js ready.** App Router compatible, with a server-safe `/target` entry.
- **Accessible.** Dialog semantics, focus moves into the card and returns afterwards, keyboard navigation, `prefers-reduced-motion` respected.

## Install

```bash
pnpm add @binii/react-onboarder
```

or

```bash
npm install @binii/react-onboarder
```

Peer dependencies: `react` and `react-dom` 18 or 19, `framer-motion` 11 to 13. Your project needs Tailwind CSS (v3.4+ or v4).

## Let Tailwind see the classes

This package ships Tailwind class names inside its JavaScript, not a stylesheet. Tailwind only generates CSS for classes it finds in your sources, and it skips `node_modules`, so **every project that installs the package needs this one-time setup**.

**Tailwind v4**: add one import to your main CSS file, after Tailwind's:

```css
@import "tailwindcss";
@import "@binii/react-onboarder/tailwind.css";
```

If you prefer to point Tailwind at the files yourself, this is equivalent (the path is relative to your CSS file):

```css
@import "tailwindcss";
@source "../node_modules/@binii/react-onboarder/dist";
```

**Tailwind v3** (`tailwind.config.js`):

```js
content: [
  "./src/**/*.{ts,tsx}",
  "./node_modules/@binii/react-onboarder/dist/**/*.{js,cjs}",
],
```

Symptom of skipping this: the tour works but looks unstyled (no dimmed backdrop, no card styling). Dark mode follows your Tailwind `dark:` strategy.

## Quick start

Bind the API to your target ids once, in a client module:

```tsx
// src/onboarding.tsx
"use client";
import { createOnboarding } from "@binii/react-onboarder";

export type Target = "nav-orders" | "orders-table" | "orders-status-filter";

export const { OnboardingProvider, useOnboarding, defineTour, target } =
  createOnboarding<Target>();
```

Import `defineTour`, `useOnboarding` and `target` from **this file** everywhere in your app, never from the package. These are bound to your `Target` union, so a typo in a step is a compile error. The package deliberately has no `defineTour` of its own (it couldn't know your ids and would accept any string), but it does export a generic `useOnboarding` for library-style code. If your editor auto-imports from `@binii/react-onboarder`, change the import.

Wrap your app:

```tsx
// app/providers.tsx
"use client";
import { OnboardingProvider } from "@/onboarding";

export function Providers({ children }: { children: React.ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
```

Mark the elements to highlight:

```tsx
<nav {...target("nav-orders")}>…</nav>
<div {...target("orders-table")}>
  <DataTable … />
</div>
```

Spread `target(...)` on a plain DOM element. If a component doesn't forward unknown props, wrap it in a `<div>`.

Define a tour as a hook, so it can use the router and isn't rebuilt on every render:

```tsx
// src/useOrdersTour.ts
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { defineTour } from "@/onboarding";

export function useOrdersTour() {
  const router = useRouter();

  return useMemo(
    () =>
      defineTour("orders-onboarding", [
        { title: "Welcome", content: "A quick look around." }, // no target = centered
        {
          target: "nav-orders",
          title: "Orders",
          content: "Everything you've sold.",
          placement: "right",
        },
        {
          target: "orders-table",
          title: "The table",
          content: "All your orders, in one place.",
          onBeforeShow: () => router.push("/orders"), // may be async; the tour waits for the target
        },
      ]),
    [router],
  );
}
```

Start it automatically, once per user:

```tsx
"use client";
import { useAutoStartTour } from "@binii/react-onboarder";
import { useOrdersTour } from "./useOrdersTour";

export function OrdersTour() {
  const tour = useOrdersTour();
  useAutoStartTour(tour); // skipped if this user has already seen "orders-onboarding"
  return null;
}
```

### Tour ids

The first argument of `defineTour` is the tour's id. It must be unique per tour, and it is what the library uses to:

- remember that a user finished or skipped the tour (stored as `react-onboarder:seen:<id>`),
- decide whether `useAutoStartTour` should start it,
- identify the tour in `onStart`, `onStepChange`, `onComplete`, `onSkip` and `activeTourId`.

Changing an id makes every user's tour count as unseen again. Use that on purpose when you redesign a tour, for example `"orders-onboarding-v2"`. Starting a tour with `startTour(tour)` always works, whether or not it was seen before.

Or start one yourself: `const { startTour } = useOnboarding(); startTour(tour)`.

## Server Components

`createOnboarding()` returns client components, so the returned `target` can't be called on the server. In a Server Component import the pure helper from the server-safe entry:

```tsx
import { onboardTarget } from "@binii/react-onboarder/target";

<table {...onboardTarget("orders-table")} />;
```

To keep it typed, wrap it once in a file that is not marked `"use client"`:

```ts
import { onboardTarget } from "@binii/react-onboarder/target";
import type { Target } from "./onboarding";

export const target = (id: Target) => onboardTarget(id);
```

## Styling

Every part has a slot. Pass Tailwind classes; they are merged over the defaults with `tailwind-merge`, so conflicts resolve in your favor.

```tsx
<OnboardingProvider
  classNames={{
    card: "rounded-lg bg-slate-900 text-slate-50 border-slate-700",
    nextButton: "bg-indigo-500 hover:bg-indigo-600 text-white",
    ring: "ring-indigo-500/70",
    backdrop: "bg-black/70",
  }}
/>
```

Slots: `root backdrop ring positioner arrow card header stepCount close body title content footer dots dot dotActive actions backButton nextButton`. Every part also carries `data-slot="onboarder-<slot>"` for CSS selectors.

- `unstyled` drops the default look but keeps the few layout-critical classes (fixed overlay, the "card fits the viewport" guarantee).
- `renderCard` replaces the card entirely; the library still positions, animates and labels it. Put `titleId` and `contentId` on your heading and body.
- The arrow fill is a Tailwind class (`fill-white dark:fill-zinc-900`); change it with `classNames.arrow`.

## Translations

```tsx
<OnboardingProvider
  labels={{
    next: "ቀጥል",
    back: "ተመለስ",
    finish: "ጨርስ",
    skip: "ጉብኝቱን ዝለል",
    goToStep: (n) => `ወደ ደረጃ ${n} ሂድ`,
    stepCounter: (current, total) => `ደረጃ ${current} ከ ${total}`,
  }}
/>
```

## Persistence

By default a finished or dismissed tour is remembered in `localStorage` under `react-onboarder:seen:<tourId>`. Swap it with any object implementing `OnboardingStorage`:

```tsx
import { createWebStorage, createMemoryStorage } from "@binii/react-onboarder";

<OnboardingProvider storage={createWebStorage({ prefix: "myapp:", storage: "session" })} />
<OnboardingProvider storage={createMemoryStorage()} />
<OnboardingProvider storage={{ isSeen, markSeen, reset }} /> {/* your own */}
```

`resetTour(id)` from `useOnboarding()` forgets a tour so it can run again.

## Provider props

| Prop                                           | Default         |                                                               |
| ---------------------------------------------- | --------------- | ------------------------------------------------------------- |
| `storage`                                      | localStorage    | Where "seen" state lives                                      |
| `labels`                                       | English         | Partial override of all UI text                               |
| `classNames`                                   | none            | Tailwind classes per slot                                     |
| `unstyled`                                     | `false`         | Drop the default look                                         |
| `renderCard`                                   | none            | Custom card                                                   |
| `zIndex`                                       | `2147483000`    | Stacking order of the overlay                                 |
| `container`                                    | `document.body` | Portal target                                                 |
| `showArrow`                                    | `true`          | Arrow pointing at the target                                  |
| `closeOnOverlayClick`                          | `false`         | Dismiss on backdrop click                                     |
| `allowTargetInteraction`                       | `true`          | Let clicks reach the highlighted element                      |
| `keyboard`                                     | `true`          | Esc closes, left/right arrows navigate (ignored while typing) |
| `padding` / `radius`                           | `8` / `12`      | Spotlight defaults (per-step overrides exist)                 |
| `onStart` `onStepChange` `onComplete` `onSkip` | none            | Lifecycle callbacks                                           |

## Step options

| Option             |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| `target`           | A target id, or `() => HTMLElement \| null`. Omit for a centered step.      |
| `title` `content`  | Any `ReactNode`.                                                            |
| `placement`        | Preferred side; flips and shifts automatically.                             |
| `padding` `radius` | Spotlight overrides for this step.                                          |
| `onBeforeShow`     | Runs before the target lookup; may be async.                                |
| `timeout`          | How long to wait for the target (default 3000 ms) before skipping the step. |
| `disableScroll`    | Skip the automatic scroll-into-view.                                        |

## Notes

- Clicks inside the spotlight reach your element (so users can try the thing you're showing). Set `allowTargetInteraction={false}` to block them.
- There is no focus trap, on purpose: the target stays usable. Focus moves into the card when a step opens and returns to where it was when the tour ends.
- Targets taller than 60% of the viewport are scrolled to their top instead of their center. Add `scroll-mt-*` to the target if a sticky header covers it.

## Development

```bash
pnpm install
pnpm test          # vitest + jsdom
pnpm typecheck
pnpm build         # tsup -> dist/
pnpm check:package # publint + are-the-types-wrong
```

TypeScript is pinned to 6.x: tsup's declaration build crashed under TypeScript 7.0.2 (it relies on the JS compiler API). Revisit when tsup or tsdown supports it.

## License

MIT
