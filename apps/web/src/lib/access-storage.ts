const STORAGE_KEY = "programionize_session";

export function readSessionToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function writeSessionToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
