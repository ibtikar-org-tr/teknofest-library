-- Competitions enabled for a kitchen (library competition ids).
CREATE TABLE IF NOT EXISTS kitchen_competitions (
  event_id TEXT NOT NULL,
  competition_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, competition_id)
);

CREATE INDEX IF NOT EXISTS idx_kitchen_competitions_event
  ON kitchen_competitions(event_id);
