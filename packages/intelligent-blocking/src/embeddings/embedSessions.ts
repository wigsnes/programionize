import { buildSessionEmbeddingText } from "../helpers/blockHelpers.js";
import type { BlockingLLMClient } from "../llm/client.js";
import type { Session, SessionEmbeddings } from "../types.js";

const EMBEDDING_CONCURRENCY = 10;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]!);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

/** Generates embeddings for all sessions in parallel with bounded concurrency. */
export async function embedAllSessions(
  sessions: Session[],
  client: BlockingLLMClient,
): Promise<SessionEmbeddings> {
  const embeddings: SessionEmbeddings = new Map();

  await mapWithConcurrency(sessions, EMBEDDING_CONCURRENCY, async (session) => {
    const text = buildSessionEmbeddingText(session);
    const embedding = await client.getEmbedding(text);
    embeddings.set(session.id, embedding);
  });

  return embeddings;
}

export async function embedText(
  text: string,
  client: BlockingLLMClient,
): Promise<number[]> {
  return client.getEmbedding(text);
}
