import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
      "@server": path.resolve(templateRoot, "server"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "build/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/types.ts",
        "**/*.d.ts",
        "tests/",
        "drizzle/",
        "client/",
      ],
      // Target 80% coverage for backend
      thresholds: {
        lines: 60,      // Start with 60%, gradually increase
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
