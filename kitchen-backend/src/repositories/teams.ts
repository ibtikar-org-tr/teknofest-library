import type { Environment } from '../types/env'
import type { Team, TeamMember } from '../types/models'
import { mapTeam, mapTeamMember } from '../utils/mappers'
import { boolToInt } from '../utils/sql'

export const listTeams = async (
  env: Environment,
  eventId?: string,
): Promise<Team[]> => {
  if (eventId) {
    const { results } = await env.D1_DB.prepare(
      'SELECT * FROM teams WHERE event_id = ? ORDER BY id DESC',
    )
      .bind(eventId)
      .all()
    return (results ?? []).map((row) => mapTeam(row as Record<string, unknown>))
  }
  const { results } = await env.D1_DB.prepare('SELECT * FROM teams ORDER BY id DESC').all()
  return (results ?? []).map((row) => mapTeam(row as Record<string, unknown>))
}

export type LeaderboardTeam = {
  team_name: string
  member_count: number
}

/** Public leaderboard rows: active teams for an event (name + member count only). */
export const listLeaderboardTeams = async (
  env: Environment,
  eventId: string,
): Promise<LeaderboardTeam[]> => {
  const { results } = await env.D1_DB.prepare(
    `SELECT t.team_name AS team_name,
            (
              SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id
            ) AS member_count
     FROM teams t
     WHERE t.event_id = ?
       AND t.is_active = 1
     ORDER BY t.team_name ASC`,
  )
    .bind(eventId)
    .all<{ team_name: string; member_count: number }>()

  return (results ?? []).map((row) => ({
    team_name: row.team_name,
    member_count: Number(row.member_count) || 0,
  }))
}

export const getTeam = async (env: Environment, id: number): Promise<Team | null> => {
  const row = await env.D1_DB.prepare('SELECT * FROM teams WHERE id = ?').bind(id).first()
  if (!row) return null

  const team = mapTeam(row as Record<string, unknown>)
  const { results } = await env.D1_DB
    .prepare('SELECT * FROM team_members WHERE team_id = ? ORDER BY id')
    .bind(id)
    .all()
  team.members = (results ?? []).map((m) => mapTeamMember(m as Record<string, unknown>))
  return team
}

export const createTeam = async (
  env: Environment,
  payload: {
    event_id: string
    team_name: string
    registration_type: string
    field: string
    gender: string
    initial_idea?: string | null
    program_version_id?: number | null
    telegram_group_link?: string | null
    members?: Array<{
      full_name: string
      email: string
      phone: string
      is_leader?: boolean
      membership_number?: string | null
    }>
  },
): Promise<Team> => {
  const result = await env.D1_DB.prepare(
    `INSERT INTO teams (
      event_id, team_name, registration_type, field, gender, initial_idea,
      program_version_id, telegram_group_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *`,
  )
    .bind(
      payload.event_id,
      payload.team_name,
      payload.registration_type,
      payload.field,
      payload.gender,
      payload.initial_idea ?? null,
      payload.program_version_id ?? null,
      payload.telegram_group_link ?? null,
    )
    .first()

  const team = mapTeam(result as Record<string, unknown>)

  if (payload.members?.length) {
    const members: TeamMember[] = []
    for (const member of payload.members) {
      const created = await env.D1_DB.prepare(
        `INSERT INTO team_members (
          team_id, full_name, email, phone, is_leader, membership_number
        ) VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *`,
      )
        .bind(
          team.id,
          member.full_name,
          member.email,
          member.phone,
          boolToInt(member.is_leader ?? false),
          member.membership_number ?? null,
        )
        .first()
      members.push(mapTeamMember(created as Record<string, unknown>))
    }
    team.members = members
  }

  return team
}

export type SetTeamCompetitionResult =
  | { ok: true; team: Team }
  | { ok: false; status: 400 | 404 | 409; message: string }

/** Set competition (`field`) before applications. Locked after primary stage is submitted. */
export const setTeamCompetition = async (
  env: Environment,
  teamId: number,
  field: string,
): Promise<SetTeamCompetitionResult> => {
  const trimmed = String(field ?? '').trim()
  if (!trimmed) {
    return { ok: false, status: 400, message: 'Competition field is required' }
  }

  const existing = await getTeam(env, teamId)
  if (!existing) return { ok: false, status: 404, message: 'Team not found' }

  const primary = await env.D1_DB.prepare(
    `SELECT id FROM project_submissions
     WHERE team_id = ? AND stage = 'primary'
     LIMIT 1`,
  )
    .bind(teamId)
    .first()
  if (primary) {
    return {
      ok: false,
      status: 409,
      message: 'Competition cannot be changed after the primary application is submitted',
    }
  }

  const row = await env.D1_DB.prepare(
    `UPDATE teams
     SET field = ?, updated_at = datetime('now')
     WHERE id = ?
     RETURNING *`,
  )
    .bind(trimmed, teamId)
    .first()

  if (!row) return { ok: false, status: 404, message: 'Team not found' }
  const team = mapTeam(row as Record<string, unknown>)
  team.members = existing.members
  return { ok: true, team }
}

export const addMemberToTeam = async (
  env: Environment,
  teamId: number,
  member: {
    full_name: string
    email: string
    phone: string
    membership_number?: string | null
    is_leader?: boolean
  },
): Promise<TeamMember> => {
  const created = await env.D1_DB.prepare(
    `INSERT INTO team_members (
      team_id, full_name, email, phone, is_leader, membership_number
    ) VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *`,
  )
    .bind(
      teamId,
      member.full_name,
      member.email,
      member.phone,
      boolToInt(member.is_leader ?? false),
      member.membership_number ?? null,
    )
    .first()

  return mapTeamMember(created as Record<string, unknown>)
}
