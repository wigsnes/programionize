export { mapSuggestionInputs, fromSuggestionInput } from "./adapters/fromSuggestionInput.js";
export type { FromSuggestionInputResult } from "./adapters/fromSuggestionInput.js";
export {
  toSuggestedGroups,
  toUncoveredSessions,
  buildBlockingRunReport,
} from "./adapters/toSuggestedGroups.js";
export { runBlockCompletion } from "./blockCompletion.js";
export { runCriticPass } from "./critic.js";
export { findSimilarSessions } from "./embeddings/findSimilarSessions.js";
export { embedAllSessions, embedText } from "./embeddings/embedSessions.js";
export { cosineSimilarity } from "./embeddings/similarity.js";
export {
  buildBlockFromSessions,
  buildBlockEmbeddingText,
  buildSessionEmbeddingText,
  calculateTotalDuration,
  createBlockId,
  isPartialBlock,
  validateBlock,
} from "./helpers/blockHelpers.js";
export type { BlockValidationResult } from "./helpers/blockHelpers.js";
export {
  formatBlockForPrompt,
  formatBlocksForCritic,
  formatSessionLine,
  sessionsToPromptString,
} from "./helpers/promptFormat.js";
export { parseJsonWithRetry, JsonParseError } from "./helpers/jsonParse.js";
export {
  collectUnassigned,
  runInitialGrouping,
  splitBlocksByCompleteness,
} from "./initialGrouping.js";
export type { BlockingLLMClient, TokenUsage } from "./llm/client.js";
export { mergeTokenUsage, EMPTY_TOKEN_USAGE } from "./llm/client.js";
export {
  createAnthropicClient,
  createBlockingClientFromEnv,
} from "./llm/anthropicClient.js";
export type { BlockingClientEnv, AnthropicClientConfig } from "./llm/anthropicClient.js";
export { createOpenAIClient } from "./llm/openaiClient.js";
export type { OpenAIClientConfig } from "./llm/openaiClient.js";
export { runLLMWithJsonMode } from "./llm/runLlm.js";
export { buildIntelligentBlocks } from "./orchestrator.js";
export { preprocessSessions } from "./preprocessing.js";
export { runReconciliation } from "./reconciliation.js";
export {
  SessionTraceCollector,
  poolIdForDiscipline,
} from "./sessionTrace.js";
export type { SessionTrace, SessionTraceStage } from "./sessionTrace.js";
export {
  completePartialBlock,
  reviewSingleBlock,
  blockFromSessions,
  isBlockCompletable,
} from "./scoped/blockActions.js";
export type { CompleteBlockRequest, ReviewBlockRequest } from "./scoped/blockActions.js";
export { buildBlocksForPage } from "./scoped/pageBlocking.js";
export type { PageBlockingRequest } from "./scoped/pageBlocking.js";
export { scoreSessionFit, scoreSessionFitFromTexts } from "./scoped/sessionFit.js";
export {
  BLOCK_COMPLETION_SYSTEM_PROMPT,
  buildBlockCompletionUserPrompt,
} from "./prompts/blockCompletion.js";
export {
  buildInitialGroupingUserPrompt,
  INITIAL_GROUPING_SYSTEM_PROMPT,
} from "./prompts/initialGrouping.js";
export { buildCriticUserPrompt, CRITIC_SYSTEM_PROMPT } from "./prompts/critic.js";
export {
  blockCompletionResponseSchema,
  criticResponseSchema,
  disciplineAssignmentResponseSchema,
  initialGroupingResponseSchema,
} from "./schemas/llmOutputs.js";
export type {
  Block,
  BlockingDeps,
  BlockingLogger,
  BlockingMetadata,
  BlockingOptions,
  BlockingResult,
  CriticFlag,
  DisciplinePool,
  Session,
  SessionDuration,
  SessionEmbeddings,
  SessionFitResult,
  StageMetadata,
  StoredSessionProfile,
  BlockingScope,
} from "./types.js";
