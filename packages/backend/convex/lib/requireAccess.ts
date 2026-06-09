import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireAccess(
  ctx: Ctx,
  sessionToken: string,
): Promise<Id<"accessSessions">> {
  const session = await ctx.db
    .query("accessSessions")
    .withIndex("by_sessionToken", (q) => q.eq("sessionToken", sessionToken))
    .unique();

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.expiresAt !== null && session.expiresAt <= Date.now()) {
    throw new Error("Unauthorized");
  }

  return session._id;
}
