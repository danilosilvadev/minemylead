export interface Env {
  DOWNLOADS: R2Bucket;
  DB: D1Database;
  MASTER_TOKEN?: string;
  ADMIN_TOKEN?: string;
  WEBHOOK_SECRET?: string;
  WAITLIST_NOTIFY?: string;
  /** The key antiHunt uses to publish links and pull results (wrangler secret put INTEREST_KEY). Not the admin token: it is copied to the local machine. */
  INTEREST_KEY?: string;
  /** Secret: the API key of Resend (free plan: 3000 a month, 100 a day), which sends the free-sample email. Absent: the email is left for a person to send. */
  RESEND_API_KEY?: string;
  /** The sender of the sample email, on a domain verified in Resend (for example samples@minemylead.com). Empty: no automatic email. */
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
