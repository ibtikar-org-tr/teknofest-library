import type { Environment } from '../types/env'
import type { Individual } from '../types/models'
import { mapIndividual } from '../utils/mappers'

export const listIndividuals = async (
  env: Environment,
  eventId?: string,
): Promise<Individual[]> => {
  if (eventId) {
    const { results } = await env.D1_DB.prepare(
      'SELECT * FROM individuals WHERE event_id = ? ORDER BY id DESC',
    )
      .bind(eventId)
      .all()
    return (results ?? []).map((row) => mapIndividual(row as Record<string, unknown>))
  }
  const { results } = await env.D1_DB.prepare('SELECT * FROM individuals ORDER BY id DESC').all()
  return (results ?? []).map((row) => mapIndividual(row as Record<string, unknown>))
}

export const getIndividual = async (
  env: Environment,
  id: number,
): Promise<Individual | null> => {
  const row = await env.D1_DB.prepare('SELECT * FROM individuals WHERE id = ?').bind(id).first()
  return row ? mapIndividual(row as Record<string, unknown>) : null
}

export const createIndividual = async (
  env: Environment,
  payload: {
    event_id: string
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
    preferred_competition_ids: number[]
    project_idea?: string | null
    program_version_id?: number | null
  },
): Promise<Individual> => {
  const idsJson = JSON.stringify(payload.preferred_competition_ids)
  const row = await env.D1_DB.prepare(
    `INSERT INTO individuals (
      event_id, registration_type, full_name, membership_number, email, phone, gender,
      technical_skills, interests, experience_level, preferred_field, preferred_competition_ids,
      project_idea, program_version_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *`,
  )
    .bind(
      payload.event_id,
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
      idsJson,
      payload.project_idea ?? null,
      payload.program_version_id ?? null,
    )
    .first()

  return mapIndividual(row as Record<string, unknown>)
}

export const listUnassignedIndividuals = async (
  env: Environment,
  eventId?: string,
): Promise<Individual[]> => {
  if (eventId) {
    const { results } = await env.D1_DB.prepare(
      'SELECT * FROM individuals WHERE event_id = ? AND is_assigned = 0 ORDER BY id DESC',
    )
      .bind(eventId)
      .all()
    return (results ?? []).map((row) => mapIndividual(row as Record<string, unknown>))
  }
  const { results } = await env.D1_DB.prepare(
    'SELECT * FROM individuals WHERE is_assigned = 0 ORDER BY id DESC',
  ).all()
  return (results ?? []).map((row) => mapIndividual(row as Record<string, unknown>))
}

export const getIndividualsByIds = async (
  env: Environment,
  eventId: string,
  ids: number[],
): Promise<Individual[]> => {
  if (ids.length === 0) return []
  const placeholders = ids.map(() => '?').join(', ')
  const { results } = await env.D1_DB.prepare(
    `SELECT * FROM individuals
     WHERE event_id = ? AND id IN (${placeholders})
     ORDER BY id ASC`,
  )
    .bind(eventId, ...ids)
    .all()
  return (results ?? []).map((row) => mapIndividual(row as Record<string, unknown>))
}

export const markIndividualsAssigned = async (
  env: Environment,
  individualIds: number[],
  teamId: number,
): Promise<void> => {
  for (const id of individualIds) {
    await env.D1_DB.prepare(
      `UPDATE individuals
       SET is_assigned = 1, assigned_team_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(teamId, id)
      .run()
  }
}

export const markIndividualUnassigned = async (
  env: Environment,
  individualId: number,
): Promise<void> => {
  await env.D1_DB.prepare(
    `UPDATE individuals
     SET is_assigned = 0, assigned_team_id = NULL, updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(individualId)
    .run()
}

/** When someone joins/creates a team, mark matching pool individual as assigned. */
export const markMatchingIndividualAssigned = async (
  env: Environment,
  eventId: string,
  teamId: number,
  membershipNumber: string | null | undefined,
  email: string | null | undefined,
): Promise<void> => {
  const normalizedEmail = email?.trim().toLowerCase() || null
  const normalizedMembership = membershipNumber?.trim() || null
  if (!normalizedEmail && !normalizedMembership) return

  await env.D1_DB.prepare(
    `UPDATE individuals
     SET is_assigned = 1, assigned_team_id = ?, updated_at = datetime('now')
     WHERE event_id = ?
       AND (
         (? IS NOT NULL AND lower(email) = ?)
         OR (? IS NOT NULL AND membership_number = ?)
       )`,
  )
    .bind(
      teamId,
      eventId,
      normalizedEmail,
      normalizedEmail ?? '',
      normalizedMembership,
      normalizedMembership ?? '',
    )
    .run()
}

/**
 * Heal stale pool flags: individuals who are on an active team but still
 * marked unassigned (common after self create/join without pool sync).
 */
export const syncIndividualAssignmentsForEvent = async (
  env: Environment,
  eventId: string,
): Promise<void> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT i.id AS individual_id, t.id AS team_id
     FROM individuals i
     JOIN team_members tm
       ON (
         (i.membership_number IS NOT NULL AND TRIM(i.membership_number) != ''
           AND tm.membership_number = i.membership_number)
         OR (i.email != '' AND lower(tm.email) = lower(i.email))
       )
     JOIN teams t ON t.id = tm.team_id
     WHERE i.event_id = ?
       AND t.event_id = ?
       AND t.is_active = 1
       AND (i.is_assigned = 0 OR i.assigned_team_id IS NULL OR i.assigned_team_id != t.id)`,
  )
    .bind(eventId, eventId)
    .all<{ individual_id: number; team_id: number }>()

  for (const row of results ?? []) {
    await env.D1_DB.prepare(
      `UPDATE individuals
       SET is_assigned = 1, assigned_team_id = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(row.team_id, row.individual_id)
      .run()
  }
}
