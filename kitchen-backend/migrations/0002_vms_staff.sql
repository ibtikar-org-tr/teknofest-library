-- Replace local password admins with VMS membership-based kitchen staff.

CREATE TABLE IF NOT EXISTS kitchen_staff (
  membership_number TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  evaluation_weight REAL NOT NULL DEFAULT 10.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_superadmin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kitchen_staff_email ON kitchen_staff(email);
CREATE INDEX IF NOT EXISTS idx_kitchen_staff_active ON kitchen_staff(is_active);

-- Point evaluations at VMS membership numbers instead of local admin ids.
ALTER TABLE evaluations ADD COLUMN evaluator_membership_number TEXT;

CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_membership
  ON evaluations(evaluator_membership_number);

-- Backfill evaluator from legacy admin_id when possible (best-effort; may be empty).
-- Legacy admins table may still exist from 0001_init.
UPDATE evaluations
SET evaluator_membership_number = (
  SELECT CAST(admins.id AS TEXT) FROM admins WHERE admins.id = evaluations.admin_id
)
WHERE evaluator_membership_number IS NULL AND admin_id IS NOT NULL;
