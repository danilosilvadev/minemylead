CREATE TABLE IF NOT EXISTS waitlist (
  email TEXT PRIMARY KEY,
  lang TEXT,
  niche TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist (created_at);
