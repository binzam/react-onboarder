import { describe, expect, it } from "vitest";
import { createMemoryStorage, createWebStorage } from "../src/storage";

describe("createWebStorage", () => {
  it("persists seen state under a prefix and can reset it", () => {
    const storage = createWebStorage({ prefix: "t:" });
    expect(storage.isSeen("tour")).toBe(false);
    storage.markSeen("tour");
    expect(storage.isSeen("tour")).toBe(true);
    expect(window.localStorage.getItem("t:tour")).toBe("1");
    storage.reset?.("tour");
    expect(storage.isSeen("tour")).toBe(false);
  });

  it("uses sessionStorage when asked", () => {
    const storage = createWebStorage({ storage: "session", prefix: "s:" });
    storage.markSeen("tour");
    expect(window.sessionStorage.getItem("s:tour")).toBe("1");
    expect(window.localStorage.getItem("s:tour")).toBeNull();
  });
});

describe("createMemoryStorage", () => {
  it("tracks seen state in memory", () => {
    const storage = createMemoryStorage();
    storage.markSeen("a");
    expect(storage.isSeen("a")).toBe(true);
    expect(storage.isSeen("b")).toBe(false);
    storage.reset?.("a");
    expect(storage.isSeen("a")).toBe(false);
  });
});
