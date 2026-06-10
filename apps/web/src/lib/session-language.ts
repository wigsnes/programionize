const LANGUAGE_LABELS: Record<string, string> = {
  Norwegian: "Norwegian",
  Norsk: "Norwegian",
  English: "English",
  Engelsk: "English",
};

export function sessionLanguageLabel(language: string | null): string | null {
  if (!language) return null;
  return LANGUAGE_LABELS[language] ?? language;
}
