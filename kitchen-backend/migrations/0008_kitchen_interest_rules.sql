-- Kitchen registration rules: how many competitions a pool registrant must pick.
ALTER TABLE event_kitchens ADD COLUMN interest_min INTEGER;
ALTER TABLE event_kitchens ADD COLUMN interest_max INTEGER;

-- JSON array of library competition ids the individual is interested in.
ALTER TABLE individuals ADD COLUMN preferred_competition_ids TEXT;
