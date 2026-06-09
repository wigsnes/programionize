import { describe, expect, it } from "vitest";
import {
  generateAccessToken,
  generateMagicLinkToken,
  hashToken,
  isMagicLinkValid,
} from "./magic-link.js";

describe("hashToken", () => {
  it("returns a stable sha256 hash for the same token", async () => {
    expect(await hashToken("secret-token")).toBe(await hashToken("secret-token"));
    expect(await hashToken("secret-token")).not.toBe(await hashToken("other"));
  });
});

describe("isMagicLinkValid", () => {
  const now = 1_000_000;

  it("accepts active links within expiry", () => {
    expect(
      isMagicLinkValid({ revokedAt: null, expiresAt: now + 1000 }, now),
    ).toBe(true);
  });

  it("rejects revoked or expired links", () => {
    expect(
      isMagicLinkValid({ revokedAt: now - 1, expiresAt: null }, now),
    ).toBe(false);
    expect(
      isMagicLinkValid({ revokedAt: null, expiresAt: now - 1 }, now),
    ).toBe(false);
  });
});

describe("token generators", () => {
  it("creates non-empty random tokens", () => {
    expect(generateMagicLinkToken().length).toBeGreaterThan(20);
    expect(generateAccessToken().length).toBeGreaterThan(20);
  });
});
