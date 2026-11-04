-- The pilot form becomes an order for a free sample: the client gives a website and an email; antiHunt reads the site, asks only for what is missing,
-- makes 3 super leads and delivers them (the page /o/<code> shows them) with a way to ask for the 100.
ALTER TABLE intake ADD COLUMN website TEXT;
ALTER TABLE intake ADD COLUMN code TEXT;
ALTER TABLE intake ADD COLUMN found TEXT;
ALTER TABLE intake ADD COLUMN missing TEXT;
ALTER TABLE intake ADD COLUMN stage TEXT NOT NULL DEFAULT 'received';
ALTER TABLE intake ADD COLUMN sample_html TEXT;
ALTER TABLE intake ADD COLUMN sample_at TEXT;
ALTER TABLE intake ADD COLUMN buy_at TEXT;
ALTER TABLE intake ADD COLUMN buy_taken INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS intake_code ON intake (code);
