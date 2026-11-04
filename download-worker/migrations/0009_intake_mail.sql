-- The sample email goes out from the Worker (Cloudflare Email Service) when the sending domain is set up; these say whether it did.
ALTER TABLE intake ADD COLUMN mailed_at TEXT;
ALTER TABLE intake ADD COLUMN mail_error TEXT;
