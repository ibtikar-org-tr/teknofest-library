import type { Environment } from '../types/env'
import {
  loadMemberContacts,
  normalizeTelegramUsername,
} from './vms-events'

export type JuryStageStatus = {
  submitted: boolean
  scored: boolean
  project_id: number | null
}

export type JuryTeamDuty = {
  team_id: number
  team_name: string
  primary: JuryStageStatus
  final: JuryStageStatus
}

export type EventJury = {
  event_id: string
  membership_number: string
  full_name: string | null
  email: string | null
  created_by: string | null
  created_at: string
  team_ids: number[]
  telegram_username: string | null
  telegram_id: string | null
  has_telegram: boolean
  /** Stages this jury must score (submitted apps on assigned teams). */
  duty_required: number
  /** Stages this jury has already scored. */
  duty_done: number
  /** Per assigned team stage status (for compact admin UI). */
  team_duties: JuryTeamDuty[]
}

export type EventTeamStageIndex = {
  team_id: number
  team_name: string
  primary_submitted: boolean
  final_submitted: boolean
}

type StagePair = { primary: number | null; final: number | null }

function emptyStage(): JuryStageStatus {
  return { submitted: false, scored: false, project_id: null }
}

export const listEventJuries = async (
  env: Environment,
  eventId: string,
): Promise<{ juries: EventJury[]; teams_index: EventTeamStageIndex[] }> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT event_id, membership_number, full_name, email, created_by, created_at
     FROM event_juries WHERE event_id = ? ORDER BY created_at ASC`,
  )
    .bind(eventId)
    .all<{
      event_id: string
      membership_number: string
      full_name: string | null
      email: string | null
      created_by: string | null
      created_at: string
    }>()

  const juries = results ?? []

  const { results: teamRows } = await env.D1_DB.prepare(
    `SELECT id, team_name FROM teams WHERE event_id = ? AND is_active = 1 ORDER BY team_name ASC`,
  )
    .bind(eventId)
    .all<{ id: number; team_name: string }>()

  const teamNameById = new Map<number, string>()
  for (const t of teamRows ?? []) {
    teamNameById.set(Number(t.id), t.team_name)
  }

  const { results: projectRows } = await env.D1_DB.prepare(
    `SELECT id, team_id, stage FROM project_submissions WHERE event_id = ?`,
  )
    .bind(eventId)
    .all<{ id: number; team_id: number; stage: string }>()

  const projectsByTeam = new Map<number, StagePair>()
  const projectIds: number[] = []
  for (const p of projectRows ?? []) {
    const teamId = Number(p.team_id)
    const pair = projectsByTeam.get(teamId) ?? { primary: null, final: null }
    if (p.stage === 'final') pair.final = Number(p.id)
    else pair.primary = Number(p.id)
    projectsByTeam.set(teamId, pair)
    projectIds.push(Number(p.id))
  }

  const scoredByJury = new Map<string, Set<number>>()
  if (projectIds.length > 0) {
    const placeholders = projectIds.map(() => '?').join(', ')
    const { results: evalRows } = await env.D1_DB.prepare(
      `SELECT project_id, evaluator_membership_number
       FROM evaluations
       WHERE is_ai_evaluation = 0
         AND evaluator_membership_number IS NOT NULL
         AND project_id IN (${placeholders})`,
    )
      .bind(...projectIds)
      .all<{ project_id: number; evaluator_membership_number: string }>()

    for (const row of evalRows ?? []) {
      const membership = row.evaluator_membership_number.trim()
      const set = scoredByJury.get(membership) ?? new Set<number>()
      set.add(Number(row.project_id))
      scoredByJury.set(membership, set)
    }
  }

  const teams_index: EventTeamStageIndex[] = (teamRows ?? []).map((t) => {
    const teamId = Number(t.id)
    const pair = projectsByTeam.get(teamId)
    return {
      team_id: teamId,
      team_name: t.team_name,
      primary_submitted: Boolean(pair?.primary),
      final_submitted: Boolean(pair?.final),
    }
  })

  if (juries.length === 0) {
    return { juries: [], teams_index }
  }

  const { results: assignments } = await env.D1_DB.prepare(
    `SELECT membership_number, team_id FROM jury_team_assignments WHERE event_id = ?`,
  )
    .bind(eventId)
    .all<{ membership_number: string; team_id: number }>()

  const byMember = new Map<string, number[]>()
  for (const row of assignments ?? []) {
    const list = byMember.get(row.membership_number) ?? []
    list.push(Number(row.team_id))
    byMember.set(row.membership_number, list)
  }

  const contacts = await loadMemberContacts(
    env,
    juries.map((j) => j.membership_number),
  )

  const enriched: EventJury[] = juries.map((j) => {
    const membership = j.membership_number.trim()
    const contact = contacts.get(membership)
    const telegram_username = normalizeTelegramUsername(contact?.telegram_username)
    const telegram_id = contact?.telegram_id?.trim() || null
    const teamIds = byMember.get(j.membership_number) ?? []
    const scoredSet = scoredByJury.get(membership) ?? new Set<number>()

    let duty_required = 0
    let duty_done = 0
    const team_duties: JuryTeamDuty[] = teamIds.map((teamId) => {
      const pair = projectsByTeam.get(teamId)
      const primaryId = pair?.primary ?? null
      const finalId = pair?.final ?? null
      const primaryScored = primaryId != null && scoredSet.has(primaryId)
      const finalScored = finalId != null && scoredSet.has(finalId)

      if (primaryId != null) {
        duty_required += 1
        if (primaryScored) duty_done += 1
      }
      if (finalId != null) {
        duty_required += 1
        if (finalScored) duty_done += 1
      }

      return {
        team_id: teamId,
        team_name: teamNameById.get(teamId) || `فريق #${teamId}`,
        primary: {
          submitted: primaryId != null,
          scored: primaryScored,
          project_id: primaryId,
        },
        final: {
          submitted: finalId != null,
          scored: finalScored,
          project_id: finalId,
        },
      }
    })

    return {
      ...j,
      team_ids: teamIds,
      telegram_username,
      telegram_id,
      has_telegram: Boolean(telegram_username || telegram_id),
      duty_required,
      duty_done,
      team_duties,
    }
  })

  return { juries: enriched, teams_index }
}

export const addEventJury = async (
  env: Environment,
  payload: {
    event_id: string
    membership_number: string
    full_name?: string | null
    email?: string | null
    created_by?: string | null
  },
): Promise<EventJury> => {
  const membershipNumber = payload.membership_number.trim()
  await env.D1_DB.prepare(
    `INSERT INTO event_juries (event_id, membership_number, full_name, email, created_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(event_id, membership_number) DO UPDATE SET
       full_name = COALESCE(excluded.full_name, event_juries.full_name),
       email = COALESCE(excluded.email, event_juries.email)`,
  )
    .bind(
      payload.event_id,
      membershipNumber,
      payload.full_name?.trim() || null,
      payload.email?.trim() || null,
      payload.created_by?.trim() || null,
    )
    .run()

  const row = await env.D1_DB.prepare(
    `SELECT event_id, membership_number, full_name, email, created_by, created_at
     FROM event_juries WHERE event_id = ? AND membership_number = ?`,
  )
    .bind(payload.event_id, membershipNumber)
    .first<{
      event_id: string
      membership_number: string
      full_name: string | null
      email: string | null
      created_by: string | null
      created_at: string
    }>()

  const teamIds = await listJuryTeamIds(env, payload.event_id, membershipNumber)
  return {
    ...row!,
    team_ids: teamIds,
    telegram_username: null,
    telegram_id: null,
    has_telegram: false,
    duty_required: 0,
    duty_done: 0,
    team_duties: [],
  }
}

export const removeEventJury = async (
  env: Environment,
  eventId: string,
  membershipNumber: string,
): Promise<boolean> => {
  await env.D1_DB.prepare(
    `DELETE FROM jury_team_assignments WHERE event_id = ? AND membership_number = ?`,
  )
    .bind(eventId, membershipNumber.trim())
    .run()

  const result = await env.D1_DB.prepare(
    `DELETE FROM event_juries WHERE event_id = ? AND membership_number = ?`,
  )
    .bind(eventId, membershipNumber.trim())
    .run()

  return (result.meta?.changes ?? 0) > 0
}

export const listJuryTeamIds = async (
  env: Environment,
  eventId: string,
  membershipNumber: string,
): Promise<number[]> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT team_id FROM jury_team_assignments
     WHERE event_id = ? AND membership_number = ?
     ORDER BY team_id ASC`,
  )
    .bind(eventId, membershipNumber.trim())
    .all<{ team_id: number }>()
  return (results ?? []).map((r) => Number(r.team_id))
}

export const setJuryTeamAssignments = async (
  env: Environment,
  eventId: string,
  membershipNumber: string,
  teamIds: number[],
  createdBy?: string | null,
): Promise<number[]> => {
  const member = membershipNumber.trim()
  const uniqueTeamIds = [...new Set(teamIds.map(Number).filter((id) => Number.isFinite(id) && id > 0))]

  await env.D1_DB.prepare(
    `DELETE FROM jury_team_assignments WHERE event_id = ? AND membership_number = ?`,
  )
    .bind(eventId, member)
    .run()

  for (const teamId of uniqueTeamIds) {
    await env.D1_DB.prepare(
      `INSERT INTO jury_team_assignments (event_id, membership_number, team_id, created_by)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(eventId, member, teamId, createdBy?.trim() || null)
      .run()
  }

  return uniqueTeamIds
}

export const isEventJury = async (
  env: Environment,
  eventId: string,
  membershipNumber: string | undefined,
): Promise<boolean> => {
  if (!membershipNumber?.trim()) return false
  const row = await env.D1_DB.prepare(
    `SELECT 1 AS ok FROM event_juries WHERE event_id = ? AND membership_number = ? LIMIT 1`,
  )
    .bind(eventId, membershipNumber.trim())
    .first<{ ok: number }>()
  return Boolean(row)
}

export const canEvaluateTeam = async (
  env: Environment,
  eventId: string,
  membershipNumber: string | undefined,
  teamId: number,
): Promise<boolean> => {
  if (!membershipNumber?.trim()) return false
  const row = await env.D1_DB.prepare(
    `SELECT 1 AS ok FROM jury_team_assignments
     WHERE event_id = ? AND membership_number = ? AND team_id = ?
     LIMIT 1`,
  )
    .bind(eventId, membershipNumber.trim(), teamId)
    .first<{ ok: number }>()
  return Boolean(row)
}

export const memberIsAnyJury = async (
  env: Environment,
  membershipNumber: string | undefined,
): Promise<boolean> => {
  if (!membershipNumber?.trim()) return false
  const row = await env.D1_DB.prepare(
    `SELECT 1 AS ok FROM event_juries WHERE membership_number = ? LIMIT 1`,
  )
    .bind(membershipNumber.trim())
    .first<{ ok: number }>()
  return Boolean(row)
}

export const listAssignedTeamsForJury = async (
  env: Environment,
  eventId: string,
  membershipNumber: string,
): Promise<{ team_id: number; team_name: string }[]> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT t.id AS team_id, t.team_name
     FROM jury_team_assignments j
     INNER JOIN teams t ON t.id = j.team_id
     WHERE j.event_id = ? AND j.membership_number = ?
     ORDER BY t.team_name ASC`,
  )
    .bind(eventId, membershipNumber.trim())
    .all<{ team_id: number; team_name: string }>()
  return (results ?? []).map((r) => ({
    team_id: Number(r.team_id),
    team_name: r.team_name,
  }))
}

/** Membership numbers of appointed juries for an event (for score filtering). */
export const listJuryMembershipNumbers = async (
  env: Environment,
  eventId: string,
): Promise<Set<string>> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT membership_number FROM event_juries WHERE event_id = ?`,
  )
    .bind(eventId)
    .all<{ membership_number: string }>()
  return new Set((results ?? []).map((r) => r.membership_number.trim()))
}

/** Juries assigned to a specific team (required scorers for that team). */
export const listJuriesAssignedToTeam = async (
  env: Environment,
  eventId: string,
  teamId: number,
): Promise<{ membership_number: string; full_name: string | null; email: string | null }[]> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT j.membership_number, ej.full_name, ej.email
     FROM jury_team_assignments j
     LEFT JOIN event_juries ej
       ON ej.event_id = j.event_id AND ej.membership_number = j.membership_number
     WHERE j.event_id = ? AND j.team_id = ?
     ORDER BY j.membership_number ASC`,
  )
    .bind(eventId, teamId)
    .all<{ membership_number: string; full_name: string | null; email: string | null }>()

  return (results ?? []).map((r) => ({
    membership_number: r.membership_number.trim(),
    full_name: r.full_name,
    email: r.email,
  }))
}
