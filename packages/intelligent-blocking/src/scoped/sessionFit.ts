import { cosineSimilarity } from "../embeddings/similarity.js";
import type { Block, Session, SessionEmbeddings } from "../types.js";

export type SessionFitResult = {
  score: number;
  disciplineMatch: boolean;
  label: "strong" | "ok" | "weak";
  rationale: string;
};

function fitLabel(score: number): SessionFitResult["label"] {
  if (score >= 0.75) return "strong";
  if (score >= 0.45) return "ok";
  return "weak";
}

/**
 * Scores how well a session fits a block using embedding cosine similarity.
 * No LLM call — uses cached embeddings when available.
 */
export function scoreSessionFit(
  session: Session,
  block: Block,
  embeddings: SessionEmbeddings,
): SessionFitResult {
  const sessionEmbedding = embeddings.get(session.id);

  let score = 0.5;
  if (sessionEmbedding) {
    const blockParts = block.sessions
      .map((s) => embeddings.get(s.id))
      .filter((e): e is number[] => e !== undefined);
    if (blockParts.length > 0) {
      const centroid = blockParts[0]!.map((_, i) =>
        blockParts.reduce((sum, vec) => sum + (vec[i] ?? 0), 0) / blockParts.length,
      );
      score = cosineSimilarity(sessionEmbedding, centroid);
    }
  }

  const sessionDiscipline =
    session.primaryDiscipline ?? session.disciplines[0] ?? "";
  const disciplineMatch =
    sessionDiscipline.toLowerCase() === block.primaryDiscipline.toLowerCase() ||
    session.disciplines.some(
      (d) => d.toLowerCase() === block.primaryDiscipline.toLowerCase(),
    );

  if (disciplineMatch) score = Math.min(1, score + 0.1);

  const label = fitLabel(score);
  const rationale = disciplineMatch
    ? `${label} thematic fit (${Math.round(score * 100)}%) — same discipline (${block.primaryDiscipline})`
    : `${label} fit (${Math.round(score * 100)}%) — discipline mismatch (${sessionDiscipline || "?"} vs ${block.primaryDiscipline})`;

  return { score, disciplineMatch, label, rationale };
}

export function scoreSessionFitFromTexts(
  session: Session,
  block: Block,
  sessionEmbedding: number[] | undefined,
  blockSessionEmbeddings: number[][],
): SessionFitResult {
  const embeddings: SessionEmbeddings = new Map();
  if (sessionEmbedding) embeddings.set(session.id, sessionEmbedding);
  block.sessions.forEach((s, i) => {
    const emb = blockSessionEmbeddings[i];
    if (emb) embeddings.set(s.id, emb);
  });
  return scoreSessionFit(session, block, embeddings);
}
