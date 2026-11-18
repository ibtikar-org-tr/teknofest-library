-- Add competition type: 'competitive' | 'innovative'
ALTER TABLE competitions ADD COLUMN type TEXT;
CREATE INDEX IF NOT EXISTS idx_competitions_type ON competitions(type);
