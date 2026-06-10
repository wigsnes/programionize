export type SessionDuration = 15 | 30 | 45 | 60;

export type Session = {
  id: string;
  title: string;
  description: string;
  duration: SessionDuration;
  disciplines: string[];
  keywords: string[];
  primaryDiscipline?: string;
};

export type Block = {
  id: string;
  sessions: Session[];
  totalDuration: number;
  primaryDiscipline: string;
  rationale: string;
  confidence?: number;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type StageMetadata = {
  name: string;
  durationMs: number;
  usage: TokenUsage;
  details?: Record<string, unknown>;
};

export type CriticFlag = {
  blockId: string;
  issue: string;
  suggestion: string | null;
  regenerated: boolean;
};

export type SessionTraceStage =
  | "preprocess"
  | "grouping"
  | "completion"
  | "reconciliation"
  | "critic"
  | "unassigned";

export type SessionTrace = {
  sessionId: string;
  primaryDiscipline: string;
  keywords: string[];
  poolId?: string;
  embeddingText: string;
  stage: SessionTraceStage;
  blockId?: string;
  rationale?: string;
  confidence?: number;
};

export type BlockingScope =
  | "full"
  | "page_unassigned"
  | "page_regroup"
  | "block_complete"
  | "block_review";

export type BlockingMetadata = {
  inputSessionCount: number;
  assignedSessionCount: number;
  blockCount: number;
  unassignedCount: number;
  stages: StageMetadata[];
  criticFlags: CriticFlag[];
  sessionTraces: SessionTrace[];
  scope?: BlockingScope;
};

export type BlockingResult = {
  blocks: Block[];
  unassigned: Session[];
  metadata: BlockingMetadata;
};

export type DisciplinePool = {
  primaryDiscipline: string;
  sessions: Session[];
  poolId: string;
};

export type BlockingLogger = {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
};

export type SessionEmbeddings = Map<string, number[]>;

export type BlockingOptions = {
  existingBlocks?: Block[];
  lockedSessionIds?: string[];
  scope?: BlockingScope;
};

export type BlockingDeps = {
  llm: import("./llm/client.js").BlockingLLMClient;
  logger?: BlockingLogger;
  options?: BlockingOptions;
  traces?: import("./sessionTrace.js").SessionTraceCollector;
};

export type StoredSessionProfile = {
  sessionId: string;
  primaryDiscipline: string;
  keywords: string[];
  embeddingText: string;
  embedding: number[];
  enrichedAt: number;
};

export type SessionFitResult = {
  score: number;
  disciplineMatch: boolean;
  label: "strong" | "ok" | "weak";
  rationale: string;
};
