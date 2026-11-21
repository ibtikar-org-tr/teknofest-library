-- Flexible application files: name + description, up to 10 per submission (10MB each enforced in API).

CREATE TABLE IF NOT EXISTS project_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  description TEXT,
  storage_key TEXT NOT NULL UNIQUE,
  original_filename TEXT,
  content_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
