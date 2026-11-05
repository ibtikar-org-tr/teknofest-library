import type { Environment } from '../types/env'
import type { Individual } from '../types/models'
import { mapIndividual } from '../utils/mappers'

export const listIndividuals = async (env: Environment): Promise<Individual[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM individuals ORDER BY id DESC')
    .all()
  return (results ?? []).map((row) => mapIndividual(row as Record<string, unknown>))
}

export const getIndividual = async (
  env: Environment,
  id: number
): Promise<Individual | null> => {
  const row = await env.D1_DB.prepare('SELECT * FROM individuals WHERE id = ?').bind(id).first()
  return row ? mapIndividual(row as Record<string, unknown>) : null
}

export const createIndividual = async (
  env: Environment,
  payload: {
    registration_type: string
    full_name: string
    membership_number?: string | null
    email: string
    phone: string
    gender: string
    technical_skills?: string | null
    interests?: string | null
    experience_level?: string | null
    preferred_field: string
    project_idea?: string | null
    program_version_id?: number | null
  }
): Promise<Individual> => {
  const row = await env.D1_DB.prepare(
    `INSERT INTO individuals (
      registration_type, full_name, membership_number, email, phone, gender,
      technical_skills, interests, experience_level, preferred_field,
      project_idea, program_version_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *`
  )
    .bind(
      payload.registration_type,
      payload.full_name,
      payload.membership_number ?? null,
      payload.email,
      payload.phone,
      payload.gender,
      payload.technical_skills ?? null,
      payload.interests ?? null,
      payload.experience_level ?? null,
      payload.preferred_field,
      payload.project_idea ?? null,
      payload.program_version_id ?? null
    )
    .first()

  return mapIndividual(row as Record<string, unknown>)
}

export const listUnassignedIndividuals = async (env: Environment): Promise<Individual[]> => {
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM individuals WHERE is_assigned = 0 ORDER BY id DESC')
    .all()
  return (results ?? []).map((row) => mapIndividual(row as Record<string, unknown>))
}
