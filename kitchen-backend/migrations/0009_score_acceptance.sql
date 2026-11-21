-- Admin must accept a stage's jury average before it appears on the public leaderboard.
ALTER TABLE project_submissions ADD COLUMN score_accepted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE project_submissions ADD COLUMN score_accepted_at TEXT;
ALTER TABLE project_submissions ADD COLUMN score_accepted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_project_submissions_score_accepted
  ON project_submissions(event_id, stage, score_accepted);
