-- Projects require program_version_id (FK). Seed a default season if missing.
INSERT INTO program_versions (version_number, version_name, is_active)
SELECT 1, '2026', 1
WHERE NOT EXISTS (SELECT 1 FROM program_versions LIMIT 1);
