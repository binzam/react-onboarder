import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createOnboarding,
  createMemoryStorage,
  useAutoStartTour,
  type OnboardingProviderProps,
} from "../src";

type Target = "first" | "second";

const { OnboardingProvider, useOnboarding, defineTour, target } =
  createOnboarding<Target>();

const tour = defineTour("demo", [
  { target: "first", title: "First stop", content: "Look here." },
  { target: "second", title: "Second stop", content: "Then here." },
]);

function Demo() {
  const { startTour, isRunning } = useOnboarding();
  return (
    <div>
      <button onClick={() => startTour(tour)}>start</button>
      <span data-testid="running">{String(isRunning)}</span>
      <div {...target("first")}>First</div>
      <div {...target("second")}>Second</div>
    </div>
  );
}

function renderDemo(props: Partial<OnboardingProviderProps> = {}) {
  return render(
    <OnboardingProvider storage={createMemoryStorage()} {...props}>
      <Demo />
    </OnboardingProvider>,
  );
}

describe("OnboardingProvider", () => {
  it("walks through the steps and finishes", async () => {
    const onComplete = vi.fn();
    const onStepChange = vi.fn();
    renderDemo({ onComplete, onStepChange });

    fireEvent.click(screen.getByText("start"));
    const dialog = await screen.findByRole("dialog", { name: "First stop" });
    expect(within(dialog).getByText("Step 1 of 2")).toBeTruthy();
    expect(within(dialog).getByText("Look here.")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
    const second = await screen.findByRole("dialog", { name: "Second stop" });
    expect(within(second).getByText("Step 2 of 2")).toBeTruthy();
    expect(onStepChange).toHaveBeenCalledWith("demo", 1);

    fireEvent.click(within(second).getByRole("button", { name: "Finish" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onComplete).toHaveBeenCalledWith("demo");
    expect(screen.getByTestId("running").textContent).toBe("false");
  });

  it("goes back and jumps to a step via the dots", async () => {
    renderDemo();
    fireEvent.click(screen.getByText("start"));
    let dialog = await screen.findByRole("dialog", { name: "First stop" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Go to step 2" }));
    dialog = await screen.findByRole("dialog", { name: "Second stop" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Back" }));
    await screen.findByRole("dialog", { name: "First stop" });
  });

  it("closes on Escape, records the skip, and marks the tour seen", async () => {
    const storage = createMemoryStorage();
    const onSkip = vi.fn();
    renderDemo({ storage, onSkip });

    fireEvent.click(screen.getByText("start"));
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onSkip).toHaveBeenCalledWith("demo", 0);
    expect(storage.isSeen("demo")).toBe(true);
  });

  it("uses arrow keys for navigation but not while typing", async () => {
    render(
      <OnboardingProvider storage={createMemoryStorage()}>
        <Demo />
        <input aria-label="search" />
      </OnboardingProvider>,
    );
    fireEvent.click(screen.getByText("start"));
    await screen.findByRole("dialog", { name: "First stop" });

    fireEvent.keyDown(screen.getByLabelText("search"), { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: "First stop" })).toBeTruthy();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await screen.findByRole("dialog", { name: "Second stop" });
  });

  it("skips a step whose target never appears", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const skipping = defineTour("skipping", [
      { target: () => null, title: "Missing", timeout: 20 },
      { target: "second", title: "Present" },
    ]);

    function Runner() {
      const { startTour } = useOnboarding();
      return (
        <>
          <button onClick={() => startTour(skipping)}>go</button>
          <div {...target("second")}>Second</div>
        </>
      );
    }

    render(
      <OnboardingProvider storage={createMemoryStorage()}>
        <Runner />
      </OnboardingProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    await screen.findByRole("dialog", { name: "Present" });
  });

  it("shows a centered step without a target", async () => {
    const welcome = defineTour("welcome", [{ title: "Welcome", content: "Hello." }]);
    function Runner() {
      const { startTour } = useOnboarding();
      return <button onClick={() => startTour(welcome)}>go</button>;
    }
    render(
      <OnboardingProvider storage={createMemoryStorage()}>
        <Runner />
      </OnboardingProvider>,
    );
    fireEvent.click(screen.getByText("go"));
    await screen.findByRole("dialog", { name: "Welcome" });
  });

  it("supports translated labels and class overrides that beat the defaults", async () => {
    renderDemo({
      labels: { next: "ቀጥል", stepCounter: (c, t) => `ደረጃ ${c}/${t}` },
      classNames: { card: "rounded-none" },
    });
    fireEvent.click(screen.getByText("start"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ደረጃ 1/2")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "ቀጥል" })).toBeTruthy();

    const card = dialog.querySelector('[data-slot="onboarder-card"]');
    expect(card?.className).toContain("rounded-none");
    expect(card?.className).not.toContain("rounded-2xl");
  });

  it("drops cosmetic defaults with unstyled but keeps layout classes", async () => {
    renderDemo({ unstyled: true });
    fireEvent.click(screen.getByText("start"));
    const dialog = await screen.findByRole("dialog");
    const card = dialog.querySelector('[data-slot="onboarder-card"]');
    expect(card?.className).toContain("overflow-hidden");
    expect(card?.className).not.toContain("bg-white");
  });

  it("renders a custom card", async () => {
    renderDemo({
      renderCard: ({ step, next, titleId }) => (
        <div>
          <h2 id={titleId}>{step.title}</h2>
          <button onClick={next}>custom next</button>
        </div>
      ),
    });
    fireEvent.click(screen.getByText("start"));
    await screen.findByRole("dialog", { name: "First stop" });
    fireEvent.click(screen.getByText("custom next"));
    await screen.findByRole("dialog", { name: "Second stop" });
  });

  it("returns focus to the trigger when the tour ends", async () => {
    renderDemo();
    const trigger = screen.getByText("start");
    trigger.focus();
    fireEvent.click(trigger);
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});

describe("useAutoStartTour", () => {
  function AutoDemo() {
    useAutoStartTour(tour, { delay: 0 });
    return (
      <>
        <div {...target("first")}>First</div>
        <div {...target("second")}>Second</div>
      </>
    );
  }

  it("starts once, then not again after it has been seen", async () => {
    const storage = createMemoryStorage();
    const first = render(
      <OnboardingProvider storage={storage}>
        <AutoDemo />
      </OnboardingProvider>,
    );
    await screen.findByRole("dialog", { name: "First stop" });
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    first.unmount();

    render(
      <OnboardingProvider storage={storage}>
        <AutoDemo />
      </OnboardingProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("useOnboarding", () => {
  it("throws a helpful error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    function Orphan() {
      useOnboarding();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/OnboardingProvider/);
  });
});
