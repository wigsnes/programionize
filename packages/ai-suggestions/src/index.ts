export {
  enrichSuggestedGroups,
  formatGroupForClipboard,
  buildSuggestionPrompt,
  buildSuggestionPrompts,
} from "./enrich-groups.js";
export { attachBlockWarnings } from "./block-warnings.js";
export {
  buildApplyPreview,
  buildBulkApplyPreview,
  formatApplyPreviewSummary,
} from "./apply-preview.js";
export type {
  ApplyPreview,
  WorkspaceBlock,
} from "./apply-preview.js";
export {
  compactSessionDescription,
  DESCRIPTION_MAX_CHARS,
  SESSIONS_PER_PROMPT,
  buildReconciliationPrompt,
} from "./prompt.js";
export { suggestionsModelSchema, rawSuggestedGroupSchema } from "./schema.js";
export {
  dedupeRawGroups,
  buildSuggestionRunReport,
} from "./validate-groups.js";
export type { DuplicateSessionEntry as ValidateDuplicateEntry } from "./validate-groups.js";
export {
  formatSuggestionErrorMessage,
  toSuggestionGenerateError,
} from "./suggestion-errors.js";
export type {
  RawSuggestedGroup,
  SuggestedGroup,
  SuggestedGroupSession,
  SuggestedGroupWarning,
  SuggestionInputSession,
  SuggestionRunReport,
  UncoveredSession,
} from "./types.js";
