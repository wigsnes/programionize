import type { Session, SessionEmbeddings } from "../types.js";
import { cosineSimilarity } from "./similarity.js";

export type FindSimilarSessionsOptions = {
  limit: number;
  excludeIds?: string[];
  primaryDiscipline?: string;
};

export type SimilarSession = {
  session: Session;
  score: number;
};

/**
 * Finds the most similar sessions to a query embedding using cosine similarity.
 */
export function findSimilarSessions(
  queryEmbedding: number[],
  pool: Session[],
  embeddings: SessionEmbeddings,
  options: FindSimilarSessionsOptions,
): SimilarSession[] {
  const exclude = new Set(options.excludeIds ?? []);
  const discipline = options.primaryDiscipline?.toLowerCase();

  const disciplineMatches = discipline
    ? pool.filter(
        (session) =>
          !exclude.has(session.id) &&
          (session.primaryDiscipline?.toLowerCase() === discipline ||
            session.disciplines.some((d) => d.toLowerCase() === discipline)),
      )
    : [];

  const candidates =
    disciplineMatches.length >= options.limit
      ? disciplineMatches
      : pool.filter((session) => !exclude.has(session.id));

  const scored: SimilarSession[] = [];

  for (const session of candidates) {
    const embedding = embeddings.get(session.id);
    if (!embedding) continue;
    scored.push({
      session,
      score: cosineSimilarity(queryEmbedding, embedding),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, options.limit);
}
