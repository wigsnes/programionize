import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./convex/_generated/api";
import schema from "./convex/schema";
import type { Id } from "./convex/_generated/dataModel";

const modules = import.meta.glob("./convex/**/*.ts");

async function authSession(t: ReturnType<typeof convexTest>) {
  const { token } = await t.mutation(api.access.createMagicLink, {
    setupSecret: "test-setup-secret",
  });
  return t.mutation(api.access.redeemMagicLink, { token });
}

describe("program workspace", () => {
  it("assigns a session to a block and removes it from the catalog pool", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Talk one",
          description: null,
          field: "Dev",
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
        {
          sessionizeId: "s2",
          title: "Talk two",
          description: null,
          field: "Ops",
          lengthMinutes: 45,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const sessions = await t.query(api.sessions.list, { sessionToken });
    const talkOne = sessions.find((s) => s.title === "Talk one");
    expect(talkOne).toBeDefined();

    const { blockId } = await t.mutation(api.program.createBlock, { sessionToken });

    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId,
      sessionId: talkOne!._id as Id<"sessions">,
    });

    const workspace = await t.query(api.program.getWorkspace, { sessionToken });
    expect(workspace.blocks).toHaveLength(1);
    expect(workspace.blocks[0]?.sessions).toHaveLength(1);
    expect(workspace.blocks[0]?.totalMinutes).toBe(30);
    expect(workspace.assignedSessionIds).toEqual([talkOne!._id]);

    await t.mutation(api.program.unassignSession, {
      sessionToken,
      sessionId: talkOne!._id as Id<"sessions">,
    });

    const after = await t.query(api.program.getWorkspace, { sessionToken });
    expect(after.assignedSessionIds).toEqual([]);
    expect(after.blocks[0]?.sessions).toHaveLength(0);
  });

  it("keeps block placements when re-import marks a session removed", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Talk one",
          description: null,
          field: "Dev",
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
        {
          sessionizeId: "s2",
          title: "Talk two",
          description: null,
          field: "Ops",
          lengthMinutes: 45,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const sessions = await t.query(api.sessions.list, { sessionToken });
    const talkOne = sessions.find((s) => s.sessionizeId === "s1");
    expect(talkOne).toBeDefined();

    const { blockId } = await t.mutation(api.program.createBlock, { sessionToken });
    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId,
      sessionId: talkOne!._id as Id<"sessions">,
    });

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "s2",
          title: "Talk two",
          description: null,
          field: "Ops",
          lengthMinutes: 45,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
        {
          sessionizeId: "s3",
          title: "Talk three",
          description: null,
          field: "Dev",
          lengthMinutes: 15,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: ["s1"],
    });

    const workspace = await t.query(api.program.getWorkspace, { sessionToken });
    expect(workspace.blocks[0]?.sessions).toHaveLength(1);
    expect(workspace.blocks[0]?.sessions[0]?.status).toBe("removed");
    expect(workspace.blocks[0]?.sessions[0]?.sessionizeId).toBe("s1");
    expect(workspace.assignedSessionIds).toContain(talkOne!._id);

    const listed = await t.query(api.sessions.list, { sessionToken });
    expect(listed.find((s) => s.sessionizeId === "s1")?.status).toBe("removed");
    expect(listed.find((s) => s.sessionizeId === "s3")?.title).toBe("Talk three");
  });

  it("supports independent placements per program page", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "s1",
          title: "Talk one",
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

    const sessions = await t.query(api.sessions.list, { sessionToken });
    const talkOne = sessions[0]!;

    const { pageId: mainPageId } = await t.mutation(api.program.createPage, {
      sessionToken,
      name: "Main program",
    });
    const { pageId: altPageId } = await t.mutation(api.program.createPage, {
      sessionToken,
      name: "Experiment",
    });

    const { blockId: mainBlockId } = await t.mutation(api.program.createBlock, {
      sessionToken,
      programPageId: mainPageId,
    });
    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId: mainBlockId,
      sessionId: talkOne._id as Id<"sessions">,
    });

    const { blockId: altBlockId } = await t.mutation(api.program.createBlock, {
      sessionToken,
      programPageId: altPageId,
    });
    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId: altBlockId,
      sessionId: talkOne._id as Id<"sessions">,
    });

    const main = await t.query(api.program.getWorkspace, {
      sessionToken,
      programPageId: mainPageId,
    });
    const alt = await t.query(api.program.getWorkspace, {
      sessionToken,
      programPageId: altPageId,
    });
    expect(main.assignedSessionIds).toEqual([talkOne._id]);
    expect(alt.assignedSessionIds).toEqual([talkOne._id]);

    await t.mutation(api.program.renamePage, {
      sessionToken,
      programPageId: altPageId,
      name: "Alt layout",
    });
    const pages = await t.query(api.program.listPages, { sessionToken });
    expect(pages.map((p) => p.name).sort()).toEqual(["Alt layout", "Main program"]);

    await t.mutation(api.program.deletePage, {
      sessionToken,
      programPageId: altPageId,
    });
    const afterDelete = await t.query(api.program.listPages, { sessionToken });
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0]?.name).toBe("Main program");
  });

  it("inserts sessions at a specific index within a block", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "s1",
          title: "First",
          description: null,
          field: "Dev",
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
        {
          sessionizeId: "s2",
          title: "Second",
          description: null,
          field: "Dev",
          lengthMinutes: 30,
          isServiceSession: false,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
        {
          sessionizeId: "s3",
          title: "Third",
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

    const sessions = await t.query(api.sessions.list, { sessionToken });
    const first = sessions.find((s) => s.title === "First")!;
    const second = sessions.find((s) => s.title === "Second")!;
    const third = sessions.find((s) => s.title === "Third")!;

    const { blockId } = await t.mutation(api.program.createBlock, { sessionToken });
    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId,
      sessionId: first._id as Id<"sessions">,
    });
    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId,
      sessionId: third._id as Id<"sessions">,
    });
    await t.mutation(api.program.assignSession, {
      sessionToken,
      blockId,
      sessionId: second._id as Id<"sessions">,
      insertAtIndex: 1,
    });

    const workspace = await t.query(api.program.getWorkspace, { sessionToken });
    expect(workspace.blocks[0]?.sessions.map((s) => s.title)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });

  it("rejects assigning service sessions to blocks", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    await t.mutation(internal.sessions.applyImport, {
      sessionizeEventId: "evt",
      upserts: [
        {
          sessionizeId: "svc",
          title: "Lunch",
          description: null,
          field: null,
          lengthMinutes: 30,
          isServiceSession: true,
          speakerNames: [],
          sessionizeStatus: "Accept_Queue",
          status: "active",
        },
      ],
      markRemovedIds: [],
    });

    const { pageId } = await t.mutation(api.program.createPage, {
      sessionToken,
      name: "Main",
    });
    const { blockId } = await t.mutation(api.program.createBlock, {
      sessionToken,
      programPageId: pageId,
    });

    const listed = await t.query(api.sessions.list, { sessionToken });
    const lunch = listed[0]!;

    await expect(
      t.mutation(api.program.assignSession, {
        sessionToken,
        blockId,
        sessionId: lunch._id as Id<"sessions">,
      }),
    ).rejects.toThrow(/service sessions cannot be scheduled/i);
  });

  it("renames a block", async () => {
    const t = convexTest(schema, modules);
    const { sessionToken } = await authSession(t);

    const { blockId } = await t.mutation(api.program.createBlock, { sessionToken });
    await t.mutation(api.program.renameBlock, {
      sessionToken,
      blockId,
      label: "Friday morning",
    });

    const workspace = await t.query(api.program.getWorkspace, { sessionToken });
    expect(workspace.blocks[0]?.label).toBe("Friday morning");
  });
});
