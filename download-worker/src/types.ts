export interface Env {
  DOWNLOADS: R2Bucket;
  DB: D1Database;
  MASTER_TOKEN?: string;
  ADMIN_TOKEN?: string;
  WEBHOOK_SECRET?: string;
  WAITLIST_NOTIFY?: string;
  /** The key antiHunt uses to publish links and pull results (wrangler secret put INTEREST_KEY). Not the admin token: it is copied to the local machine. */
  INTEREST_KEY?: string;
  /** Cloudflare Email Service binding ([[send_email]] in wrangler.toml): sends the free-sample email from the minemylead domain. Absent or not set up: the email is left for a person to send. */
  EMAIL?: { send(message: { to: string; from: string | { email: string; name?: string }; subject: string; text: string; replyTo?: string }): Promise<{ messageId?: string }> };
  /** The sender of the sample email, on a domain onboarded for Email Sending (for example samples@minemylead.com). Empty: no automatic email. */
  MAIL_FROM?: string;
  /** Where a client's reply goes (a real inbox). Optional. */
  MAIL_REPLY_TO?: string;
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
