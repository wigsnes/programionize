import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSystemTheme,
  readTheme,
  resolveTheme,
  writeTheme,
} from "./theme-storage";

describe("theme-storage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists explicit theme preference", () => {
    writeTheme("dark");
    expect(readTheme()).toBe("dark");
    expect(resolveTheme()).toBe("dark");
  });

  it("falls back to system preference when unset", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    expect(getSystemTheme()).toBe("dark");
    expect(resolveTheme()).toBe("dark");
  });
});
