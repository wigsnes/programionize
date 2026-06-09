const palette = [
  "#dbeafe",
  "#dcfce7",
  "#fef3c7",
  "#fce7f3",
  "#e0e7ff",
  "#ffedd5",
];

export function fieldStripeColor(field: string | null): string {
  if (!field) return "#94a3b8";
  let hash = 0;
  for (const char of field) hash = (hash + char.charCodeAt(0)) % 997;
  return palette[hash % palette.length] ?? palette[0];
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
