-- What a pilot client tells us before the first message goes out: the details the messages and the reply page need
-- (service, client name, postal address, info link, who sends). antiHunt pulls the new rows over its own key and fills Go Live step 2.
CREATE TABLE IF NOT EXISTS intake (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  service TEXT,
  address TEXT,
  info_link TEXT,
  sender_name TEXT,
  sender_channel TEXT,
  phone TEXT,
  lang TEXT NOT NULL DEFAULT 'pt'
);
CREATE INDEX IF NOT EXISTS intake_status ON intake (status, id);
