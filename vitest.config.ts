import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["apps/web/tests/**/*.test.ts","packages/*/tests/**/*.test.ts","packages/shared/tests/**/*.test.ts"], environment: "node" } });
