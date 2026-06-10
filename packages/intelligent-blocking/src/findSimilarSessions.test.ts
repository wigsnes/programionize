import { describe, expect, it } from "vitest";
import { findSimilarSessions } from "./embeddings/findSimilarSessions.js";
import { cosineSimilarity } from "./embeddings/similarity.js";
import type { Session, SessionEmbeddings } from "./types.js";

function session(id: string, discipline: string): Session {
  return {
    id,
    title: id,
    description: id,
    duration: 30,
    disciplines: [discipline],
    keywords: [],
    primaryDiscipline: discipline,
  };
}

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBe(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });
});

describe("findSimilarSessions", () => {
  const embeddings: SessionEmbeddings = new Map([
    ["a", [1, 0, 0]],
    ["b", [0.9, 0.1, 0]],
    ["c", [0, 1, 0]],
  ]);

  const pool = [
    session("a", "backend"),
    session("b", "backend"),
    session("c", "design"),
  ];

  it("ranks by cosine similarity", () => {
    const results = findSimilarSessions([1, 0, 0], pool, embeddings, {
      limit: 2,
    });
    expect(results.map((entry) => entry.session.id)).toEqual(["a", "b"]);
  });

  it("excludes ids", () => {
    const results = findSimilarSessions([1, 0, 0], pool, embeddings, {
      limit: 3,
      excludeIds: ["a"],
    });
    expect(results.some((entry) => entry.session.id === "a")).toBe(false);
  });

  it("prefers same primary discipline when enough matches exist", () => {
    const results = findSimilarSessions([0.5, 0.5, 0], pool, embeddings, {
      limit: 1,
      primaryDiscipline: "backend",
    });
    expect(results[0]?.session.primaryDiscipline).toBe("backend");
  });
});
