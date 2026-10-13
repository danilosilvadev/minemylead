declare namespace Cloudflare {
  interface Env {
    DOWNLOADS: R2Bucket;
    DB: D1Database;
    MASTER_TOKEN: string;
    ADMIN_TOKEN: string;
    WEBHOOK_SECRET?: string;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
