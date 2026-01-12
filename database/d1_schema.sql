-- Cloudflare D1 Database Schema
-- SQLite-compatible schema for TEKNOFEST Library
-- Updated to match application models

-- Competitions Table
CREATE TABLE IF NOT EXISTS competitions (
    id INTEGER PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    image_path TEXT,
    tk_number TEXT,
    t3kys_number TEXT,
    application_link_tr TEXT,
    application_link_en TEXT,
    application_link_ar TEXT,
    tr_name TEXT,
    tr_description TEXT,
    tr_link TEXT,
    en_name TEXT,
    en_description TEXT,
    en_link TEXT,
    ar_name TEXT,
    ar_description TEXT,
    ar_link TEXT,
    years TEXT, -- JSON array of years
    min_member INTEGER,
    max_member INTEGER
);

CREATE INDEX idx_competitions_tk_number ON competitions(tk_number);
CREATE INDEX idx_competitions_t3kys_number ON competitions(t3kys_number);
CREATE INDEX idx_competitions_tr_name ON competitions(tr_name);
CREATE INDEX idx_competitions_en_name ON competitions(en_name);
CREATE INDEX idx_competitions_ar_name ON competitions(ar_name);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    description TEXT,
    stage TEXT,
    institution_name TEXT,
    member_count INTEGER,
    tap_members TEXT, -- JSON array of UUIDs
    members_list TEXT, -- JSON array of member names
    leader TEXT, -- UUID stored as TEXT
    competition_id INTEGER NOT NULL,
    years TEXT, -- JSON array of years
    status TEXT,
    rank INTEGER,
    relation TEXT,
    intro_file_path TEXT,
    team_link TEXT,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE INDEX idx_teams_competition_id ON teams(competition_id);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_leader ON teams(leader);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    ar_name TEXT NOT NULL,
    en_name TEXT NOT NULL,
    membership_number TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    university TEXT NOT NULL,
    major TEXT NOT NULL,
    year INTEGER NOT NULL,
    sex TEXT NOT NULL,
    birthdate TIMESTAMP NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    team_ids TEXT, -- JSON array of UUIDs
    status TEXT NOT NULL,
    is_advisor BOOLEAN DEFAULT 0,
    is_leader BOOLEAN DEFAULT 0,
    skills TEXT, -- JSON array of skills
    rating INTEGER NOT NULL,
    comments TEXT -- JSON array of UUIDs
);

CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_membership_number ON members(membership_number);
CREATE INDEX idx_members_university ON members(university);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_is_advisor ON members(is_advisor);
CREATE INDEX idx_members_is_leader ON members(is_leader);

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    competition_id TEXT NOT NULL, -- UUID stored as TEXT
    team_id TEXT NOT NULL, -- UUID stored as TEXT
    resource_type TEXT NOT NULL,
    resource_url TEXT NOT NULL,
    description TEXT NOT NULL,
    year INTEGER NOT NULL,
    comments TEXT -- JSON array of UUIDs
);

CREATE INDEX idx_resources_competition_id ON resources(competition_id);
CREATE INDEX idx_resources_team_id ON resources(team_id);
CREATE INDEX idx_resources_resource_type ON resources(resource_type);
CREATE INDEX idx_resources_year ON resources(year);

-- Report Files Table
CREATE TABLE IF NOT EXISTS report_files (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    competition_id INTEGER NOT NULL,
    team_id TEXT, -- UUID stored as TEXT, nullable
    year TEXT NOT NULL,
    file_path TEXT NOT NULL,
    rank TEXT,
    stage TEXT,
    language TEXT,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE INDEX idx_report_files_competition_id ON report_files(competition_id);
CREATE INDEX idx_report_files_team_id ON report_files(team_id);
CREATE INDEX idx_report_files_year ON report_files(year);
CREATE INDEX idx_report_files_stage ON report_files(stage);
CREATE INDEX idx_report_files_rank ON report_files(rank);

-- Result Files Table
CREATE TABLE IF NOT EXISTS result_files (
    id TEXT PRIMARY KEY, -- UUID stored as TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    competition_id INTEGER NOT NULL,
    year TEXT NOT NULL,
    stage TEXT NOT NULL,
    file_path TEXT NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE INDEX idx_result_files_competition_id ON result_files(competition_id);
CREATE INDEX idx_result_files_year ON result_files(year);
CREATE INDEX idx_result_files_stage ON result_files(stage);

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

CREATE TRIGGER update_report_files_timestamp 
AFTER UPDATE ON report_files
BEGIN
    UPDATE report_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_result_files_timestamp 
AFTER UPDATE ON result_files
BEGIN
    UPDATE result_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
