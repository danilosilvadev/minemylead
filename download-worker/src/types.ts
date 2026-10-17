export interface Env {
  DOWNLOADS: R2Bucket;
  DB: D1Database;
  MASTER_TOKEN?: string;
  ADMIN_TOKEN?: string;
  WEBHOOK_SECRET?: string;
  WAITLIST_NOTIFY?: string;
}

export type Lang = "en" | "pt";

export type LinkRow = {
  token: string;
  email: string | null;
  note: string | null;
  lang: string | null;
  created_at: string;
  used_at: string | null;
  used_file: string | null;
  revoked_at: string | null;
};

export type LinkStatus = "active" | "used" | "revoked";
