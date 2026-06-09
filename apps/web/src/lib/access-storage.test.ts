import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSessionToken,
  readSessionToken,
  writeSessionToken,
} from "./access-storage";

describe("access storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and clears the session token", () => {
    writeSessionToken("abc");
    expect(readSessionToken()).toBe("abc");
    clearSessionToken();
    expect(readSessionToken()).toBeNull();
  });
});
