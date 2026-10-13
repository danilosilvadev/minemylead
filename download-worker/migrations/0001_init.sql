CREATE TABLE IF NOT EXISTS links (
  token TEXT PRIMARY KEY,
  email TEXT,
  note TEXT,
  lang TEXT,
  created_at TEXT NOT NULL,
  used_at TEXT,
  used_file TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at);
