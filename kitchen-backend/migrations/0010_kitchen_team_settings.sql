-- Member self-service team policies + capacity (defaults: create/join off, max 8).
ALTER TABLE event_kitchens ADD COLUMN allow_create_teams INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_kitchens ADD COLUMN allow_join_teams INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_kitchens ADD COLUMN max_team_size INTEGER NOT NULL DEFAULT 8;
