-- Event-scoped kitchens: one kitchen per VMS event (VMS event UUID).

CREATE TABLE IF NOT EXISTS event_kitchens (
  event_id TEXT PRIMARY KEY NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_event_kitchens_enabled ON event_kitchens(enabled);

ALTER TABLE teams ADD COLUMN event_id TEXT;
ALTER TABLE individuals ADD COLUMN event_id TEXT;
ALTER TABLE project_submissions ADD COLUMN event_id TEXT;

CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_individuals_event_id ON individuals(event_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_event_id ON project_submissions(event_id);
