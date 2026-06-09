export function parseLengthMinutes(label: string | null | undefined): number | null {
  if (!label?.trim()) return null;
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const minutes = Number.parseInt(match[1], 10);
  return Number.isFinite(minutes) ? minutes : null;
}
