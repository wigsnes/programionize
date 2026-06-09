import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./convex/_generated/api";
import schema from "./convex/schema";

const modules = import.meta.glob("./convex/**/*.ts");

describe("magic link access", () => {
  it("redeems a valid link and allows listing sessions", async () => {
    const t = convexTest(schema, modules);

    const { token } = await t.mutation(api.access.createMagicLink, {
      setupSecret: "test-setup-secret",
      label: "Team",
    });

    const { sessionToken } = await t.mutation(api.access.redeemMagicLink, {
      token,
    });

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Talk",
          description: null,
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

    const listed = await t.query(api.sessions.list, { sessionToken });
    expect(listed).toHaveLength(1);
  });

  it("rejects listing without a valid session", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.sessions.list, { sessionToken: "invalid" }),
    ).rejects.toThrow();
  });

  it("rejects expired magic links", async () => {
    const t = convexTest(schema, modules);

    const { token } = await t.mutation(api.access.createMagicLink, {
      setupSecret: "test-setup-secret",
      expiresInDays: -1,
    });

    await expect(
      t.mutation(api.access.redeemMagicLink, { token }),
    ).rejects.toThrow(/invalid or expired/i);
  });
});
