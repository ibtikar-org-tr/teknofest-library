import type { Environment } from '../types/env'
import type { Team, TeamMember } from '../types/models'
import { mapTeam, mapTeamMember } from '../utils/mappers'
import { boolToInt } from '../utils/sql'

export const listTeams = async (env: Environment): Promise<Team[]> => {
  const { results } = await env.D1_DB.prepare('SELECT * FROM teams ORDER BY id DESC').all()
  return (results ?? []).map((row) => mapTeam(row as Record<string, unknown>))
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
  }
): Promise<Team> => {
  const result = await env.D1_DB.prepare(
    `INSERT INTO teams (
      team_name, registration_type, field, gender, initial_idea,
      program_version_id, telegram_group_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *`
  )
    .bind(
      payload.team_name,
      payload.registration_type,
      payload.field,
      payload.gender,
      payload.initial_idea ?? null,
      payload.program_version_id ?? null,
      payload.telegram_group_link ?? null
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
        RETURNING *`
      )
        .bind(
          team.id,
          member.full_name,
          member.email,
          member.phone,
          boolToInt(member.is_leader ?? false),
          member.membership_number ?? null
        )
        .first()
      members.push(mapTeamMember(created as Record<string, unknown>))
    }
    team.members = members
  }

  return team
}
