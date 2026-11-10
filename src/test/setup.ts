import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/* jsdom / runtime shims                                              */
/* ------------------------------------------------------------------ */

/** Minimal in-memory Storage implementation. */
function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  };
}

function define(target: object, prop: string, value: unknown): void {
  try {
    Object.defineProperty(target, prop, {
      value,
      configurable: true,
      writable: true,
    });
  } catch {
    /* ignore */
  }
}

// Node exposes an experimental `localStorage` that is unavailable unless
// `--localstorage-file` is passed; jsdom's own copy can also be missing.
// Provide a deterministic in-memory implementation for tests.
const testStorage = createStorage();
define(globalThis, "localStorage", testStorage);
if (typeof window !== "undefined" && window !== globalThis) {
  define(window, "localStorage", testStorage);
}

// jsdom does not implement matchMedia; the store relies on it for responsive
// navigation behaviour.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});
