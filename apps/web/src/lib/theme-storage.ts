export type Theme = "light" | "dark";

const STORAGE_KEY = "programionize_theme";

export function readTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function writeTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
}

export function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(): Theme {
  return readTheme() ?? getSystemTheme();
}
