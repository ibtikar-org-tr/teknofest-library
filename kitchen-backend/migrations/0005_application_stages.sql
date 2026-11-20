-- Two-stage applications: primary then final. Content is summary + files.

ALTER TABLE project_submissions ADD COLUMN stage TEXT NOT NULL DEFAULT 'primary';
ALTER TABLE project_submissions ADD COLUMN summary TEXT NOT NULL DEFAULT '';

UPDATE project_submissions
SET summary = CASE
  WHEN TRIM(COALESCE(summary, '')) != '' THEN summary
  WHEN TRIM(COALESCE(problem_statement, '')) != '' THEN problem_statement
  ELSE COALESCE(title, '')
END
WHERE TRIM(COALESCE(summary, '')) = '';

-- One submission per team per stage
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_submissions_team_stage
  ON project_submissions(team_id, stage);

CREATE INDEX IF NOT EXISTS idx_project_submissions_stage
  ON project_submissions(stage);
