-- Event juries (from VMS registrants) and per-team assignments.

CREATE TABLE IF NOT EXISTS event_juries (
  event_id TEXT NOT NULL,
  membership_number TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, membership_number)
);

CREATE INDEX IF NOT EXISTS idx_event_juries_membership
  ON event_juries(membership_number);

CREATE TABLE IF NOT EXISTS jury_team_assignments (
  event_id TEXT NOT NULL,
  membership_number TEXT NOT NULL,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, membership_number, team_id),
  FOREIGN KEY (event_id, membership_number)
    REFERENCES event_juries(event_id, membership_number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jury_team_assignments_team
  ON jury_team_assignments(team_id);

CREATE INDEX IF NOT EXISTS idx_jury_team_assignments_membership
  ON jury_team_assignments(event_id, membership_number);
