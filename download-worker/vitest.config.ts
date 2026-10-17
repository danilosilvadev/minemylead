import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(import.meta.dirname, "migrations"));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          bindings: {
            MASTER_TOKEN: "master-token-0123456789abcdef0123456789abcdef",
            ADMIN_TOKEN: "admin-token-0123456789abcdef0123456789abcdef",
            TEST_MIGRATIONS: migrations,
            WAITLIST_NOTIFY: "off",
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
      fileParallelism: false,
    },
  };
});
