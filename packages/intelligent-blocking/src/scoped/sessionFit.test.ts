import { describe, expect, it } from "vitest";
import { buildBlockFromSessions } from "../helpers/blockHelpers.js";
import { scoreSessionFit } from "./sessionFit.js";
import type { Session, SessionEmbeddings } from "../types.js";

function makeSession(id: string, discipline: string): Session {
  return {
    id,
    title: `${discipline} talk`,
    description: "Description",
    duration: 30,
    disciplines: [discipline],
    keywords: [discipline],
    primaryDiscipline: discipline,
  };
}

describe("scoreSessionFit", () => {
  it("ranks similar embeddings higher", () => {
    const session = makeSession("candidate", "backend");
    const block = buildBlockFromSessions(
      [makeSession("b1", "backend"), makeSession("b2", "backend")],
      "backend",
      "Backend block",
    );

    const embeddings: SessionEmbeddings = new Map([
      ["candidate", [1, 0, 0]],
      ["b1", [0.9, 0.1, 0]],
      ["b2", [0.85, 0.15, 0]],
    ]);

    const fit = scoreSessionFit(session, block, embeddings);
    expect(fit.label).toBe("strong");
    expect(fit.disciplineMatch).toBe(true);
  });

  it("reports weak fit for mismatched discipline and embeddings", () => {
    const session = makeSession("candidate", "design");
    const block = buildBlockFromSessions(
      [makeSession("b1", "backend")],
      "backend",
      "Backend block",
    );

    const embeddings: SessionEmbeddings = new Map([
      ["candidate", [0, 1, 0]],
      ["b1", [1, 0, 0]],
    ]);

    const fit = scoreSessionFit(session, block, embeddings);
    expect(fit.label).toBe("weak");
    expect(fit.disciplineMatch).toBe(false);
  });
});
