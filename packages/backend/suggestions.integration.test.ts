import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./convex/_generated/api";
import schema from "./convex/schema";

const modules = import.meta.glob("./convex/**/*.ts");

async function authSession(t: ReturnType<typeof convexTest>) {
  const { token } = await t.mutation(api.access.createMagicLink, {
    setupSecret: "test-setup-secret",
  });
  return t.mutation(api.access.redeemMagicLink, { token });
}

describe("AI suggestions", () => {
  it("returns null when no runs exist", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    expect(await t.query(api.suggestions.getLatest, { sessionToken })).toBeNull();
  });

  it("returns the latest cached suggestion run", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    await t.mutation(internal.suggestionsInternals.storeRun, {
      groups: [
        {
          title: "Platform",
          rationale: "Infra",
          sessions: [
            { sessionizeId: "a", title: "Talk A", lengthMinutes: 30 },
          ],
          totalMinutes: 30,
        },
      ],
      createdAt: 100,
    });

    const latest = await t.query(api.suggestions.getLatest, { sessionToken });
    expect(latest?.groups[0]?.title).toBe("Platform");
  });

  it("requires OPENAI_API_KEY to generate", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "a",
          title: "Talk",
          description: "cloud",
          field: "Dev",
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await expect(
      t.action(api.suggestionsGenerate.generate, { sessionToken }),
    ).rejects.toThrow(/OPENAI_API_KEY/i);

    if (previousKey) process.env.OPENAI_API_KEY = previousKey;
  });
});
