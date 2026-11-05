import type { Environment } from '../types/env'
import type { Admin, ProgramVersion } from '../types/models'
import { mapAdmin, mapProgramVersion } from '../utils/mappers'
import { boolToInt } from '../utils/sql'

export const listAdmins = async (env: Environment): Promise<Admin[]> => {
  const { results } = await env.D1_DB.prepare('SELECT * FROM admins ORDER BY id').all()
  return (results ?? []).map((row) => mapAdmin(row as Record<string, unknown>))
}

export const getAdminByUsername = async (
  env: Environment,
  username: string
): Promise<(Admin & { hashed_password: string }) | null> => {
  const row = await env.D1_DB
    .prepare('SELECT * FROM admins WHERE username = ?')
    .bind(username)
    .first()
  if (!row) return null
  return {
    ...mapAdmin(row as Record<string, unknown>),
    hashed_password: String((row as Record<string, unknown>).hashed_password),
  }
}

export const createAdmin = async (
  env: Environment,
  payload: {
    username: string
    email: string
    hashed_password: string
    full_name?: string | null
    evaluation_weight?: number
    is_superadmin?: boolean
  }
): Promise<Admin> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO admins (
      username, email, hashed_password, full_name, evaluation_weight, is_superadmin
    ) VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *`
  )
    .bind(
      payload.username,
      payload.email,
      payload.hashed_password,
      payload.full_name ?? null,
      payload.evaluation_weight ?? 10,
      boolToInt(payload.is_superadmin ?? false)
    )
    .first()

  return mapAdmin(row as Record<string, unknown>)
}

export const listProgramVersions = async (env: Environment): Promise<ProgramVersion[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM program_versions ORDER BY version_number DESC')
    .all()
  return (results ?? []).map((row) => mapProgramVersion(row as Record<string, unknown>))
}

export const createProgramVersion = async (
  env: Environment,
  payload: { version_number: number; version_name?: string | null; is_active?: boolean }
): Promise<ProgramVersion> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO program_versions (version_number, version_name, is_active)
     VALUES (?, ?, ?)
     RETURNING *`
  )
    .bind(payload.version_number, payload.version_name ?? null, boolToInt(payload.is_active ?? true))
    .first()

  return mapProgramVersion(row as Record<string, unknown>)
}
