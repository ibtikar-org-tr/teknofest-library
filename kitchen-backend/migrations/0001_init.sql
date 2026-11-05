-- Cloudflare D1 schema for TEKNOFEST Kitchen
-- Ported from the FastAPI/SQLAlchemy models

CREATE TABLE IF NOT EXISTS program_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_number INTEGER NOT NULL UNIQUE,
  version_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  full_name TEXT,
  evaluation_weight REAL NOT NULL DEFAULT 10.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_superadmin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_name TEXT NOT NULL,
  registration_type TEXT NOT NULL,
  field TEXT NOT NULL,
  gender TEXT NOT NULL,
  initial_idea TEXT,
  program_version_id INTEGER REFERENCES program_versions(id),
  telegram_group_link TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_teams_gender ON teams(gender);
CREATE INDEX IF NOT EXISTS idx_teams_program_version_id ON teams(program_version_id);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_leader INTEGER NOT NULL DEFAULT 0,
  membership_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

CREATE TABLE IF NOT EXISTS individuals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_type TEXT NOT NULL,
  full_name TEXT NOT NULL,
  membership_number TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL,
  technical_skills TEXT,
  interests TEXT,
  experience_level TEXT,
  preferred_field TEXT NOT NULL,
  project_idea TEXT,
  assigned_team_id INTEGER REFERENCES teams(id),
  program_version_id INTEGER REFERENCES program_versions(id),
  is_assigned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_individuals_gender ON individuals(gender);
CREATE INDEX IF NOT EXISTS idx_individuals_assigned_team_id ON individuals(assigned_team_id);

CREATE TABLE IF NOT EXISTS project_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  program_version_id INTEGER NOT NULL REFERENCES program_versions(id),
  submission_version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  technical_description TEXT NOT NULL,
  scientific_reference TEXT NOT NULL,
  field TEXT NOT NULL,
  image_path TEXT,
  diagram_path TEXT,
  design_path TEXT,
  has_attachments INTEGER NOT NULL DEFAULT 0,
  is_complete INTEGER NOT NULL DEFAULT 0,
  character_count INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_project_submissions_team_id ON project_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_featured ON project_submissions(is_featured);

CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES project_submissions(id) ON DELETE CASCADE,
  admin_id INTEGER REFERENCES admins(id),
  is_ai_evaluation INTEGER NOT NULL DEFAULT 0,
  score REAL NOT NULL,
  notes TEXT,
  detailed_scores TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_evaluations_project_id ON evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_admin_id ON evaluations(admin_id);

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);
