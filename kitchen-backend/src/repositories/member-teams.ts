import type { Environment } from '../types/env'
import { getTeam } from './teams'
import type { Team } from '../types/models'

export async function findTeamForMemberInEvent(
  env: Environment,
  eventId: string,
  membershipNumber: string | undefined,
  email: string | undefined,
): Promise<Team | null> {
  const normalizedEmail = email?.trim().toLowerCase() || null
  const normalizedMembership = membershipNumber?.trim() || null
  if (!normalizedEmail && !normalizedMembership) return null

  const row = await env.D1_DB.prepare(
    `SELECT t.id AS team_id
     FROM teams t
     JOIN team_members tm ON tm.team_id = t.id
     WHERE t.event_id = ?
       AND t.is_active = 1
       AND (
         (? IS NOT NULL AND lower(tm.email) = ?)
         OR (? IS NOT NULL AND tm.membership_number = ?)
       )
     ORDER BY t.id DESC
     LIMIT 1`,
  )
    .bind(
      eventId,
      normalizedEmail,
      normalizedEmail ?? '',
      normalizedMembership,
      normalizedMembership ?? '',
    )
    .first<{ team_id: number }>()

  if (!row) return null
  return getTeam(env, Number(row.team_id))
}

export async function isMemberOfTeam(
  env: Environment,
  teamId: number,
  membershipNumber: string | undefined,
  email: string | undefined,
): Promise<boolean> {
  const normalizedEmail = email?.trim().toLowerCase() || null
  const normalizedMembership = membershipNumber?.trim() || null
  if (!normalizedEmail && !normalizedMembership) return false

  const row = await env.D1_DB.prepare(
    `SELECT id FROM team_members
     WHERE team_id = ?
       AND (
         (? IS NOT NULL AND lower(email) = ?)
         OR (? IS NOT NULL AND membership_number = ?)
       )
     LIMIT 1`,
  )
    .bind(
      teamId,
      normalizedEmail,
      normalizedEmail ?? '',
      normalizedMembership,
      normalizedMembership ?? '',
    )
    .first<{ id: number }>()

  return Boolean(row)
}
