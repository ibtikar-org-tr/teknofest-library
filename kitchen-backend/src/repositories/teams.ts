import type { Environment } from '../types/env'
import type { Team, TeamMember } from '../types/models'
import { mapTeam, mapTeamMember } from '../utils/mappers'
import { boolToInt } from '../utils/sql'
import { averageJuryScores, listEvaluationsByProject } from './evaluations'
import { getKitchenMaxTeamSize } from './event-kitchens'
import { markMatchingIndividualAssigned } from './individuals'
import { listJuriesAssignedToTeam } from './juries'

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

export type LeaderboardScoredEntry = {
  team_id: number
  team_name: string
  member_count: number
  stage: 'primary' | 'final'
  score: number
  rank: number
}

export type PublicLeaderboard = {
  teams: LeaderboardTeam[]
  primary: LeaderboardScoredEntry[]
  final: LeaderboardScoredEntry[]
}

/** Public leaderboard: all teams (name + count) + accepted stage scores only. */
export const listPublicLeaderboard = async (
  env: Environment,
  eventId: string,
): Promise<PublicLeaderboard> => {
  const { results: teamRows } = await env.D1_DB.prepare(
    `SELECT t.id AS team_id, t.team_name AS team_name,
            (
              SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id
            ) AS member_count
     FROM teams t
     WHERE t.event_id = ?
       AND t.is_active = 1
     ORDER BY t.team_name ASC`,
  )
    .bind(eventId)
    .all<{ team_id: number; team_name: string; member_count: number }>()

  const teams = (teamRows ?? []).map((row) => ({
    team_name: row.team_name,
    member_count: Number(row.member_count) || 0,
  }))

  const memberCountById = new Map(
    (teamRows ?? []).map((r) => [Number(r.team_id), Number(r.member_count) || 0]),
  )

  const { results: accepted } = await env.D1_DB.prepare(
    `SELECT p.id AS project_id, p.team_id, p.stage, t.team_name
     FROM project_submissions p
     INNER JOIN teams t ON t.id = p.team_id
     WHERE p.event_id = ?
       AND p.score_accepted = 1
       AND t.is_active = 1`,
  )
    .bind(eventId)
    .all<{ project_id: number; team_id: number; stage: string; team_name: string }>()

  const primaryRaw: Omit<LeaderboardScoredEntry, 'rank'>[] = []
  const finalRaw: Omit<LeaderboardScoredEntry, 'rank'>[] = []

  for (const row of accepted ?? []) {
    const assigned = await listJuriesAssignedToTeam(env, eventId, Number(row.team_id))
    const jurySet = new Set(assigned.map((j) => j.membership_number))
    const evals = await listEvaluationsByProject(env, Number(row.project_id))
    const { jury_average } = averageJuryScores(evals, jurySet)
    if (jury_average == null) continue
    const entry = {
      team_id: Number(row.team_id),
      team_name: row.team_name,
      member_count: memberCountById.get(Number(row.team_id)) ?? 0,
      stage: (row.stage === 'final' ? 'final' : 'primary') as 'primary' | 'final',
      score: Math.round(jury_average * 100) / 100,
    }
    if (entry.stage === 'final') finalRaw.push(entry)
    else primaryRaw.push(entry)
  }

  const rank = (rows: Omit<LeaderboardScoredEntry, 'rank'>[]) =>
    [...rows]
      .sort((a, b) => b.score - a.score || a.team_name.localeCompare(b.team_name, 'ar'))
      .map((row, i) => ({ ...row, rank: i + 1 }))

  return {
    teams,
    primary: rank(primaryRaw),
    final: rank(finalRaw),
  }
}

/** @deprecated use listPublicLeaderboard */
export const listLeaderboardTeams = async (
  env: Environment,
  eventId: string,
): Promise<LeaderboardTeam[]> => {
  const board = await listPublicLeaderboard(env, eventId)
  return board.teams
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
      const mapped = mapTeamMember(created as Record<string, unknown>)
      members.push(mapped)
      await markMatchingIndividualAssigned(
        env,
        payload.event_id,
        team.id,
        mapped.membership_number,
        mapped.email,
      )
    }
    team.members = members
  }

  return team
}

export const teamHasPrimarySubmission = async (
  env: Environment,
  teamId: number,
): Promise<boolean> => {
  const row = await env.D1_DB.prepare(
    `SELECT id FROM project_submissions
     WHERE team_id = ? AND stage = 'primary'
     LIMIT 1`,
  )
    .bind(teamId)
    .first()
  return Boolean(row)
}

export type SetTeamCompetitionResult =
  | { ok: true; team: Team }
  | { ok: false; status: 400 | 404 | 409; message: string }

/**
 * Set / change competition (`field` = library competition id as string).
 * Allowed until the primary stage is submitted; after that returns 409.
 * Final-stage submit does not unlock competition changes.
 * Caller must validate the id is on the kitchen allowlist.
 */
export const setTeamCompetition = async (
  env: Environment,
  teamId: number,
  competitionId: number,
): Promise<SetTeamCompetitionResult> => {
  if (!Number.isFinite(competitionId) || competitionId <= 0) {
    return { ok: false, status: 400, message: 'competition_id is required' }
  }

  const existing = await getTeam(env, teamId)
  if (!existing) return { ok: false, status: 404, message: 'Team not found' }

  if (await teamHasPrimarySubmission(env, teamId)) {
    return {
      ok: false,
      status: 409,
      message: 'Competition cannot be changed after the primary application is submitted',
    }
  }

  const stored = String(competitionId)
  const row = await env.D1_DB.prepare(
    `UPDATE teams
     SET field = ?, updated_at = datetime('now')
     WHERE id = ?
     RETURNING *`,
  )
    .bind(stored, teamId)
    .first()

  if (!row) return { ok: false, status: 404, message: 'Team not found' }
  const team = mapTeam(row as Record<string, unknown>)
  team.members = existing.members
  return { ok: true, team }
}

export type UpdateTeamNameResult =
  | { ok: true; team: Team }
  | { ok: false; status: 400 | 404; message: string }

export const updateTeamName = async (
  env: Environment,
  eventId: string,
  teamId: number,
  teamName: string,
): Promise<UpdateTeamNameResult> => {
  const name = teamName.trim()
  if (name.length < 2) {
    return { ok: false, status: 400, message: 'team_name must be at least 2 characters' }
  }
  if (name.length > 80) {
    return { ok: false, status: 400, message: 'team_name is too long' }
  }

  const existing = await getTeam(env, teamId)
  if (!existing || existing.event_id !== eventId) {
    return { ok: false, status: 404, message: 'Team not found in this event kitchen' }
  }

  const row = await env.D1_DB.prepare(
    `UPDATE teams
     SET team_name = ?, updated_at = datetime('now')
     WHERE id = ? AND event_id = ?
     RETURNING *`,
  )
    .bind(name, teamId, eventId)
    .first()

  if (!row) return { ok: false, status: 404, message: 'Team not found in this event kitchen' }
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

  const mapped = mapTeamMember(created as Record<string, unknown>)
  const teamRow = await env.D1_DB.prepare('SELECT event_id FROM teams WHERE id = ?')
    .bind(teamId)
    .first<{ event_id: string | null }>()
  if (teamRow?.event_id) {
    await markMatchingIndividualAssigned(
      env,
      teamRow.event_id,
      teamId,
      mapped.membership_number,
      mapped.email,
    )
  }
  return mapped
}

export const getTeamMember = async (
  env: Environment,
  memberId: number,
): Promise<TeamMember | null> => {
  const row = await env.D1_DB.prepare('SELECT * FROM team_members WHERE id = ?')
    .bind(memberId)
    .first()
  return row ? mapTeamMember(row as Record<string, unknown>) : null
}

async function clearIndividualAssignmentForMember(
  env: Environment,
  eventId: string,
  member: TeamMember,
): Promise<void> {
  const email = member.email?.trim().toLowerCase() || null
  const membership = member.membership_number?.trim() || null
  if (!email && !membership) return
  await env.D1_DB.prepare(
    `UPDATE individuals
     SET is_assigned = 0, assigned_team_id = NULL, updated_at = datetime('now')
     WHERE event_id = ?
       AND (
         (? IS NOT NULL AND lower(email) = ?)
         OR (? IS NOT NULL AND membership_number = ?)
       )`,
  )
    .bind(eventId, email, email ?? '', membership, membership ?? '')
    .run()
}

async function promoteFirstRemainingLeader(env: Environment, teamId: number): Promise<void> {
  const remaining = await env.D1_DB.prepare(
    `SELECT id FROM team_members WHERE team_id = ? ORDER BY id ASC LIMIT 1`,
  )
    .bind(teamId)
    .first<{ id: number }>()
  if (!remaining) return
  await env.D1_DB.prepare(`UPDATE team_members SET is_leader = 1 WHERE id = ?`)
    .bind(remaining.id)
    .run()
}

export type RemoveMemberResult =
  | { ok: true; team: Team }
  | { ok: false; status: 400 | 404; message: string }

/** Manager-only: remove a member from a team. Members cannot do this themselves. */
export const removeMemberFromTeam = async (
  env: Environment,
  eventId: string,
  teamId: number,
  memberId: number,
): Promise<RemoveMemberResult> => {
  const team = await getTeam(env, teamId)
  if (!team || team.event_id !== eventId) {
    return { ok: false, status: 404, message: 'Team not found in this event kitchen' }
  }
  const member = await getTeamMember(env, memberId)
  if (!member || member.team_id !== teamId) {
    return { ok: false, status: 404, message: 'Team member not found' }
  }

  const wasLeader = member.is_leader
  await env.D1_DB.prepare('DELETE FROM team_members WHERE id = ?').bind(memberId).run()
  await clearIndividualAssignmentForMember(env, eventId, member)

  if (wasLeader) {
    const stillHasLeader = await env.D1_DB.prepare(
      `SELECT id FROM team_members WHERE team_id = ? AND is_leader = 1 LIMIT 1`,
    )
      .bind(teamId)
      .first()
    if (!stillHasLeader) {
      await promoteFirstRemainingLeader(env, teamId)
    }
  }

  const updated = await getTeam(env, teamId)
  return { ok: true, team: updated! }
}

export type MoveMemberResult =
  | { ok: true; from_team: Team; to_team: Team }
  | { ok: false; status: 400 | 404 | 409; message: string }

/** Manager-only: move a member from their current team to another team in the same event. */
export const moveMemberToTeam = async (
  env: Environment,
  eventId: string,
  memberId: number,
  toTeamId: number,
): Promise<MoveMemberResult> => {
  const member = await getTeamMember(env, memberId)
  if (!member) return { ok: false, status: 404, message: 'Team member not found' }

  const fromTeam = await getTeam(env, member.team_id)
  if (!fromTeam || fromTeam.event_id !== eventId) {
    return { ok: false, status: 404, message: 'Source team not found in this event kitchen' }
  }

  if (member.team_id === toTeamId) {
    return { ok: false, status: 400, message: 'Member is already on that team' }
  }

  const toTeam = await getTeam(env, toTeamId)
  if (!toTeam || toTeam.event_id !== eventId || !toTeam.is_active) {
    return { ok: false, status: 404, message: 'Target team not found in this event kitchen' }
  }

  const maxTeamSize = await getKitchenMaxTeamSize(env, eventId)
  const destCount = toTeam.members?.length ?? 0
  if (destCount >= maxTeamSize) {
    return {
      ok: false,
      status: 409,
      message: `Target team is full (max ${maxTeamSize} members)`,
    }
  }

  const wasLeader = member.is_leader
  const fromTeamId = member.team_id

  await env.D1_DB.prepare('DELETE FROM team_members WHERE id = ?').bind(memberId).run()

  if (wasLeader) {
    const stillHasLeader = await env.D1_DB.prepare(
      `SELECT id FROM team_members WHERE team_id = ? AND is_leader = 1 LIMIT 1`,
    )
      .bind(fromTeamId)
      .first()
    if (!stillHasLeader) {
      await promoteFirstRemainingLeader(env, fromTeamId)
    }
  }

  await addMemberToTeam(env, toTeamId, {
    full_name: member.full_name,
    email: member.email,
    phone: member.phone,
    membership_number: member.membership_number,
    is_leader: false,
  })

  // Keep individual assignment pointing at the new team if present.
  const email = member.email?.trim().toLowerCase() || null
  const membership = member.membership_number?.trim() || null
  if (email || membership) {
    await env.D1_DB.prepare(
      `UPDATE individuals
       SET is_assigned = 1, assigned_team_id = ?, updated_at = datetime('now')
       WHERE event_id = ?
         AND (
           (? IS NOT NULL AND lower(email) = ?)
           OR (? IS NOT NULL AND membership_number = ?)
         )`,
    )
      .bind(toTeamId, eventId, email, email ?? '', membership, membership ?? '')
      .run()
  }

  const fromUpdated = await getTeam(env, fromTeamId)
  const toUpdated = await getTeam(env, toTeamId)
  return { ok: true, from_team: fromUpdated!, to_team: toUpdated! }
}
