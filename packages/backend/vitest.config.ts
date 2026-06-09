import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    include: ["*.test.ts", "*.integration.test.ts"],
    exclude: ["node_modules/**", "convex/**"],
  },
});
