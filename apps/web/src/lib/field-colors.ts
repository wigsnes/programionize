const accentPalette = [
  "#4f46e5",
  "#059669",
  "#d97706",
  "#db2777",
  "#7c3aed",
  "#0891b2",
];

const dotPalette = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#22d3ee",
];

function fieldHash(field: string | null): number {
  if (!field) return -1;
  let hash = 0;
  for (const char of field) hash = (hash + char.charCodeAt(0)) % 997;
  return hash;
}

export function fieldStripeColor(field: string | null): string {
  const hash = fieldHash(field);
  if (hash < 0) return "#64748b";
  return accentPalette[hash % accentPalette.length] ?? accentPalette[0];
}

export function fieldDotColor(field: string | null): string {
  const hash = fieldHash(field);
  if (hash < 0) return "#94a3b8";
  return dotPalette[hash % dotPalette.length] ?? dotPalette[0];
}

/** @deprecated Use fieldStripeColor for accent stripes */
export function fieldColor(field: string | null): string {
  return fieldStripeColor(field);
}

export function sessionHeightPx(lengthMinutes: number | null): number {
  const base = 72;
  if (!lengthMinutes) return base;
  return base + lengthMinutes * 2;
}

const lengthPalette: Record<number, string> = {
  15: "#a5b4fc",
  30: "#818cf8",
  45: "#6366f1",
  60: "#4f46e5",
};

export function lengthBarColor(lengthMinutes: number | null): string {
  if (!lengthMinutes) return "#94a3b8";
  return lengthPalette[lengthMinutes] ?? "#6366f1";
}
