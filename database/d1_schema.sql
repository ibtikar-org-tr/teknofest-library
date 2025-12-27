-- Cloudflare D1 Database Schema
-- SQLite-compatible schema for TEKNOFEST Library

-- Competitions Table
CREATE TABLE IF NOT EXISTS competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tr_name TEXT,
    en_name TEXT,
    ar_name TEXT,
    tk_number TEXT,
    t3kys_number TEXT,
    years TEXT,
    tr_link TEXT,
    en_link TEXT,
    ar_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitions_tk_number ON competitions(tk_number);
CREATE INDEX idx_competitions_years ON competitions(years);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    competition_id INTEGER,
    stage TEXT,
    member_count INTEGER,
    leader INTEGER,
    years TEXT,
    status TEXT,
    rank INTEGER,
    relation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE INDEX idx_teams_competition_id ON teams(competition_id);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_years ON teams(years);
CREATE INDEX idx_teams_status ON teams(status);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    en_name TEXT,
    tr_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    membership_number TEXT UNIQUE,
    university TEXT,
    major TEXT,
    year INTEGER,
    country TEXT,
    city TEXT,
    district TEXT,
    status TEXT,
    is_advisor BOOLEAN DEFAULT 0,
    is_leader BOOLEAN DEFAULT 0,
    skills TEXT,
    rating INTEGER,
    team_ids TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_membership_number ON members(membership_number);
CREATE INDEX idx_members_university ON members(university);
CREATE INDEX idx_members_status ON members(status);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER,
    team_id INTEGER,
    resource_type TEXT,
    year INTEGER,
    url TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_resources_competition_id ON resources(competition_id);
CREATE INDEX idx_resources_team_id ON resources(team_id);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_year ON resources(year);

-- Report Files Table
CREATE TABLE IF NOT EXISTS report_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER,
    team_id INTEGER,
    file_name TEXT,
    file_url TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_report_files_competition_id ON report_files(competition_id);
CREATE INDEX idx_report_files_team_id ON report_files(team_id);

-- Result Files Table
CREATE TABLE IF NOT EXISTS result_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER,
    file_name TEXT,
    file_url TEXT,
    file_size INTEGER,
    year TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE INDEX idx_result_files_competition_id ON result_files(competition_id);
CREATE INDEX idx_result_files_year ON result_files(year);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_competitions_timestamp 
AFTER UPDATE ON competitions
BEGIN
    UPDATE competitions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_teams_timestamp 
AFTER UPDATE ON teams
BEGIN
    UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_members_timestamp 
AFTER UPDATE ON members
BEGIN
    UPDATE members SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_resources_timestamp 
AFTER UPDATE ON resources
BEGIN
    UPDATE resources SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
