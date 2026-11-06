-- The free-sample request is not answered by the Worker any more: it emails the owner, who makes the sample by hand. These say whether that email went out.
ALTER TABLE intake ADD COLUMN notified_at TEXT;
ALTER TABLE intake ADD COLUMN notify_error TEXT;
