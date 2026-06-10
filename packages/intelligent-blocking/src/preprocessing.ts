import { embedAllSessions } from "./embeddings/embedSessions.js";
import {
  buildSessionEmbeddingText,
  calculateTotalDuration,
} from "./helpers/blockHelpers.js";
import { sessionsToPromptString } from "./helpers/promptFormat.js";
import type { BlockingLLMClient } from "./llm/client.js";
import { EMPTY_TOKEN_USAGE, mergeTokenUsage } from "./llm/client.js";
import { runLLMWithJsonMode } from "./llm/runLlm.js";
import {
  buildDisciplineAssignmentUserPrompt,
  DISCIPLINE_ASSIGNMENT_SYSTEM_PROMPT,
} from "./prompts/initialGrouping.js";
import { disciplineAssignmentResponseSchema } from "./schemas/llmOutputs.js";
import type { SessionTraceCollector } from "./sessionTrace.js";
import { poolIdForDiscipline } from "./sessionTrace.js";
import type {
  BlockingLogger,
  DisciplinePool,
  Session,
  SessionEmbeddings,
  StageMetadata,
  TokenUsage,
} from "./types.js";

const MAX_POOL_SIZE = 40;
const DISCIPLINE_BATCH_SIZE = 30;
const UNKNOWN_DISCIPLINE = "general";

export type PreprocessingResult = {
  pools: DisciplinePool[];
  embeddings: SessionEmbeddings;
  enrichedSessions: Session[];
  stage: StageMetadata;
};

function defaultLogger(): BlockingLogger {
  return {
    info: () => {},
    warn: () => {},
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function resolvePrimaryDiscipline(session: Session): string {
  if (session.primaryDiscipline) return session.primaryDiscipline.toLowerCase();
  if (session.disciplines.length > 0) {
    return session.disciplines[0]!.toLowerCase();
  }
  return UNKNOWN_DISCIPLINE;
}

/**
 * Phase 0: embed all sessions, assign disciplines where missing, and build pools.
 */
export async function preprocessSessions(
  sessions: Session[],
  client: BlockingLLMClient,
  logger: BlockingLogger = defaultLogger(),
  traces?: SessionTraceCollector,
): Promise<PreprocessingResult> {
  const start = Date.now();
  let usage: TokenUsage = { ...EMPTY_TOKEN_USAGE };

  const embeddings = await embedAllSessions(sessions, client);
  let enriched = sessions.map((session) => ({
    ...session,
    primaryDiscipline: resolvePrimaryDiscipline(session),
  }));

  const needsDiscipline = enriched.filter(
    (session) =>
      session.primaryDiscipline === UNKNOWN_DISCIPLINE &&
      session.disciplines.length === 0,
  );

  if (needsDiscipline.length > 0) {
    for (const batch of chunkArray(needsDiscipline, DISCIPLINE_BATCH_SIZE)) {
      const result = await runLLMWithJsonMode(client, {
        system: DISCIPLINE_ASSIGNMENT_SYSTEM_PROMPT,
        prompt: buildDisciplineAssignmentUserPrompt(
          sessionsToPromptString(batch),
        ),
        schema: disciplineAssignmentResponseSchema,
        temperature: 0.3,
      });
      usage = mergeTokenUsage(usage, result.usage);

      const byId = new Map(batch.map((session) => [session.id, session]));
      for (const assignment of result.object.assignments) {
        const session = byId.get(assignment.id);
        if (!session) continue;
        session.primaryDiscipline = assignment.primaryDiscipline.toLowerCase();
        if (assignment.keywords && assignment.keywords.length > 0) {
          session.keywords = assignment.keywords;
        }
        if (session.disciplines.length === 0) {
          session.disciplines = [assignment.primaryDiscipline.toLowerCase()];
        }
      }
    }
  }

  enriched = enriched.map((session) => ({
    ...session,
    primaryDiscipline: resolvePrimaryDiscipline(session),
  }));

  const byDiscipline = new Map<string, Session[]>();
  for (const session of enriched) {
    const key = session.primaryDiscipline ?? UNKNOWN_DISCIPLINE;
    const list = byDiscipline.get(key) ?? [];
    list.push(session);
    byDiscipline.set(key, list);
  }

  const pools: DisciplinePool[] = [];
  for (const [primaryDiscipline, group] of byDiscipline) {
    const sorted = [...group].sort((a, b) => a.title.localeCompare(b.title));
    const chunks = chunkArray(sorted, MAX_POOL_SIZE);
    chunks.forEach((chunk, chunkIndex) => {
      const poolId = poolIdForDiscipline(primaryDiscipline, chunkIndex);
      for (const session of chunk) {
        traces?.recordPreprocess(session, poolId);
      }
      pools.push({ primaryDiscipline, sessions: chunk, poolId });
    });
  }

  logger.info("preprocessing complete", {
    poolCount: pools.length,
    sessionCount: enriched.length,
  });

  return {
    pools,
    embeddings,
    enrichedSessions: enriched,
    stage: {
      name: "preprocessing",
      durationMs: Date.now() - start,
      usage,
      details: { poolCount: pools.length },
    },
  };
}

export { buildSessionEmbeddingText, calculateTotalDuration };
