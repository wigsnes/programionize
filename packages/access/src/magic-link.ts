export type MagicLinkRecord = {
  revokedAt: number | null;
  expiresAt: number | null;
};

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateMagicLinkToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateAccessToken(): string {
  return crypto.randomUUID();
}

export function isMagicLinkValid(link: MagicLinkRecord, now: number): boolean {
  if (link.revokedAt !== null) return false;
  if (link.expiresAt !== null && link.expiresAt <= now) return false;
  return true;
}
