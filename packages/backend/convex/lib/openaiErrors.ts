export function toSuggestionGenerateError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (/quota|billing|exceeded your current quota/i.test(message)) {
    return new Error(
      "OpenAI quota exceeded. Add credits or check billing at platform.openai.com, then try again.",
    );
  }
  if (/invalid.*api.*key|incorrect api key/i.test(message)) {
    return new Error(
      "Invalid OpenAI API key. Update OPENAI_API_KEY on your Convex deployment.",
    );
  }
  if (/too large|tokens per min|\bTPM\b/i.test(message)) {
    return new Error(
      "The session catalog is too large for one OpenAI request. Try again after redeploying, or contact the team if this persists.",
    );
  }

  return error instanceof Error ? error : new Error(message);
}
