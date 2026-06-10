import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./convex/_generated/api";
import schema from "./convex/schema";

const modules = import.meta.glob("./convex/**/*.ts");

describe("sessions import", () => {
  it("stores imported sessions for the catalog", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "test-event",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Zebra talk",
          description: null,
          field: "Dev",
          language: "Norwegian",
          lengthMinutes: 60,
          isServiceSession: false,
          speakerNames: ["Ada"],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
        {
          sessionizeId: "s2",
          title: "Alpha talk",
          description: "Details",
          field: "Ops",
          language: "English",
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accepted",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const { token } = await t.mutation(api.access.createMagicLink, {
      setupSecret: "test-setup-secret",
    });
    const { sessionToken } = await t.mutation(api.access.redeemMagicLink, { token });

    const listed = await t.query(api.sessions.list, { sessionToken });
    expect(listed).toHaveLength(2);
    expect(listed.map((s) => s.title).sort()).toEqual(["Alpha talk", "Zebra talk"]);
    expect(listed.find((s) => s.title === "Zebra talk")?.language).toBe("Norwegian");
    expect(listed.find((s) => s.title === "Alpha talk")?.language).toBe("English");
  });

  it("toggles catalog visibility and preserves it on re-import", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "test-event",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Visible talk",
          description: null,
          field: "Dev",
          language: null,
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const { token } = await t.mutation(api.access.createMagicLink, {
      setupSecret: "test-setup-secret",
    });
    const { sessionToken } = await t.mutation(api.access.redeemMagicLink, {
      token,
    });

    const [session] = await t.query(api.sessions.list, { sessionToken });
    expect(session?.showInCatalog).toBeUndefined();

    await t.mutation(api.sessions.setShowInCatalog, {
      sessionToken,
      sessionId: session!._id,
      showInCatalog: false,
    });

    const [hidden] = await t.query(api.sessions.list, { sessionToken });
    expect(hidden?.showInCatalog).toBe(false);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "test-event",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Visible talk updated",
          description: null,
          field: "Dev",
          language: null,
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const [afterReimport] = await t.query(api.sessions.list, { sessionToken });
    expect(afterReimport?.showInCatalog).toBe(false);
    expect(afterReimport?.title).toBe("Visible talk updated");
  });

  it("lists placement counts for admin", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "test-event",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Placed talk",
          description: null,
          field: "Dev",
          language: null,
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const { token } = await t.mutation(api.access.createMagicLink, {
      setupSecret: "test-setup-secret",
    });
    const { sessionToken } = await t.mutation(api.access.redeemMagicLink, {
      token,
    });

    await t.mutation(api.program.createPage, {
      sessionToken,
      name: "Main",
    });
    const { blockId } = await t.mutation(api.program.createBlock, { sessionToken });
    const [session] = await t.query(api.sessions.list, { sessionToken });
    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId,
      sessionId: session!._id,
    });

    const adminList = await t.query(api.sessions.listForAdmin, { sessionToken });
    expect(adminList[0]?.placementCount).toBe(1);
  });
});
