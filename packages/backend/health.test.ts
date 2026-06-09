import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./convex/_generated/api";
import schema from "./convex/schema";

const modules = import.meta.glob("./convex/**/*.ts");

describe("health", () => {
  it("reports ok for connectivity checks", async () => {
    const t = convexTest(schema, modules);
    const status = await t.query(api.health.ping, {});
    expect(status).toBe("ok");
  });
});
