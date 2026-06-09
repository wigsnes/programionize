export {
  enrichSuggestedGroups,
  formatGroupForClipboard,
  buildSuggestionPrompt,
  buildSuggestionPrompts,
} from "./enrich-groups.js";
export {
  compactSessionDescription,
  DESCRIPTION_MAX_CHARS,
  SESSIONS_PER_PROMPT,
} from "./prompt.js";
export { suggestionsModelSchema, rawSuggestedGroupSchema } from "./schema.js";
export type {
  RawSuggestedGroup,
  SuggestedGroup,
  SuggestedGroupSession,
  SuggestionInputSession,
} from "./types.js";
