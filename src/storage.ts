import { DEFAULT_STORAGE_PREFIX } from "./constants";
import type { OnboardingStorage } from "./types";

export interface WebStorageOptions {
  /** Key prefix. Default `react-onboarder:seen:`. */
  prefix?: string;
  /** Which web storage to use. Default "local". */
  storage?: "local" | "session";
}

/**
 * Persists "seen" state in localStorage or sessionStorage. Safe on the server
 * and in private modes where storage throws: it just behaves as "never seen".
 */
export function createWebStorage({
  prefix = DEFAULT_STORAGE_PREFIX,
  storage = "local",
}: WebStorageOptions = {}): OnboardingStorage {
  const getStore = (): Storage | null => {
    try {
      if (typeof window === "undefined") return null;
      return storage === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  };

  return {
    isSeen(tourId) {
      try {
        return getStore()?.getItem(prefix + tourId) === "1";
      } catch {
        return false;
      }
    },
    markSeen(tourId) {
      try {
        getStore()?.setItem(prefix + tourId, "1");
      } catch {
        // Storage unavailable: the tour may offer itself again, which is fine.
      }
    },
    reset(tourId) {
      try {
        getStore()?.removeItem(prefix + tourId);
      } catch {
        // Nothing to clean up.
      }
    },
  };
}

/** In-memory "seen" state. Forgets everything on reload; handy for tests and demos. */
export function createMemoryStorage(): OnboardingStorage {
  const seen = new Set<string>();
  return {
    isSeen: (tourId) => seen.has(tourId),
    markSeen: (tourId) => {
      seen.add(tourId);
    },
    reset: (tourId) => {
      seen.delete(tourId);
    },
  };
}
