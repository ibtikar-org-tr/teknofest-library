import type { Environment } from '../types/env'
import type { KitchenStaff, ProgramVersion } from '../types/models'
import { mapKitchenStaff, mapProgramVersion } from '../utils/mappers'
import { boolToInt } from '../utils/sql'

export const listStaff = async (env: Environment): Promise<KitchenStaff[]> => {
  const { results } = await env.D1_DB.prepare(
    'SELECT * FROM kitchen_staff ORDER BY created_at ASC',
  ).all()
  return (results ?? []).map((row) => mapKitchenStaff(row as Record<string, unknown>))
}

export const getStaffByMembershipNumber = async (
  env: Environment,
  membershipNumber: string,
): Promise<KitchenStaff | null> => {
  const row = await env.D1_DB
    .prepare('SELECT * FROM kitchen_staff WHERE membership_number = ? LIMIT 1')
    .bind(membershipNumber)
    .first()
  if (!row) return null
  return mapKitchenStaff(row as Record<string, unknown>)
}

export const upsertStaff = async (
  env: Environment,
  payload: {
    membership_number: string
    email: string
    full_name?: string | null
    evaluation_weight?: number
    is_superadmin?: boolean
    is_active?: boolean
  },
): Promise<KitchenStaff> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO kitchen_staff (
      membership_number, email, full_name, evaluation_weight, is_superadmin, is_active
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(membership_number) DO UPDATE SET
      email = excluded.email,
      full_name = COALESCE(excluded.full_name, kitchen_staff.full_name),
      evaluation_weight = COALESCE(excluded.evaluation_weight, kitchen_staff.evaluation_weight),
      is_superadmin = COALESCE(excluded.is_superadmin, kitchen_staff.is_superadmin),
      is_active = COALESCE(excluded.is_active, kitchen_staff.is_active)
    RETURNING *`,
  )
    .bind(
      payload.membership_number,
      payload.email,
      payload.full_name ?? null,
      payload.evaluation_weight ?? 10,
      boolToInt(payload.is_superadmin ?? false),
      boolToInt(payload.is_active ?? true),
    )
    .first()

  return mapKitchenStaff(row as Record<string, unknown>)
}

export const updateStaffWeight = async (
  env: Environment,
  membershipNumber: string,
  weight: number,
): Promise<KitchenStaff | null> => {
  const row = await env.D1_DB.prepare(
    `UPDATE kitchen_staff SET evaluation_weight = ? WHERE membership_number = ?
     RETURNING *`,
  )
    .bind(weight, membershipNumber)
    .first()
  if (!row) return null
  return mapKitchenStaff(row as Record<string, unknown>)
}

export const listProgramVersions = async (env: Environment): Promise<ProgramVersion[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM program_versions ORDER BY version_number DESC')
    .all()
  return (results ?? []).map((row) => mapProgramVersion(row as Record<string, unknown>))
}

export const createProgramVersion = async (
  env: Environment,
  payload: { version_number: number; version_name?: string | null; is_active?: boolean },
): Promise<ProgramVersion> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO program_versions (version_number, version_name, is_active)
     VALUES (?, ?, ?)
     RETURNING *`,
  )
    .bind(payload.version_number, payload.version_name ?? null, boolToInt(payload.is_active ?? true))
    .first()

  return mapProgramVersion(row as Record<string, unknown>)
}
