import type { Environment } from '../types/env'
import type { EventKitchen } from '../types/models'
import { asBool } from '../utils/sql'

/** Default max team size when unset / invalid. */
export const DEFAULT_MAX_TEAM_SIZE = 8

export function resolveMaxTeamSize(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX_TEAM_SIZE
  return Math.min(50, Math.floor(n))
}

const mapKitchen = (row: Record<string, unknown>): EventKitchen => ({
  event_id: String(row.event_id),
  enabled: asBool(row.enabled),
  created_by: String(row.created_by),
  created_at: String(row.created_at),
  updated_at: (row.updated_at as string) ?? null,
  interest_min:
    row.interest_min == null || row.interest_min === ''
      ? null
      : Number(row.interest_min),
  interest_max:
    row.interest_max == null || row.interest_max === ''
      ? null
      : Number(row.interest_max),
  allow_create_teams: asBool(row.allow_create_teams),
  allow_join_teams: asBool(row.allow_join_teams),
  max_team_size: resolveMaxTeamSize(
    row.max_team_size == null || row.max_team_size === ''
      ? DEFAULT_MAX_TEAM_SIZE
      : row.max_team_size,
  ),
})

export const listEventKitchens = async (
  env: Environment,
  options?: { enabledOnly?: boolean },
): Promise<EventKitchen[]> => {
  const sql = options?.enabledOnly
    ? 'SELECT * FROM event_kitchens WHERE enabled = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM event_kitchens ORDER BY created_at DESC'
  const { results } = await env.D1_DB.prepare(sql).all()
  return (results ?? []).map((row) => mapKitchen(row as Record<string, unknown>))
}

export const getEventKitchen = async (
  env: Environment,
  eventId: string,
): Promise<EventKitchen | null> => {
  const row = await env.D1_DB.prepare('SELECT * FROM event_kitchens WHERE event_id = ?')
    .bind(eventId)
    .first()
  return row ? mapKitchen(row as Record<string, unknown>) : null
}

export const enableEventKitchen = async (
  env: Environment,
  eventId: string,
  createdBy: string,
): Promise<EventKitchen> => {
  const existing = await getEventKitchen(env, eventId)
  if (existing) {
    const row = await env.D1_DB.prepare(
      `UPDATE event_kitchens
       SET enabled = 1, updated_at = datetime('now')
       WHERE event_id = ?
       RETURNING *`,
    )
      .bind(eventId)
      .first()
    return mapKitchen(row as Record<string, unknown>)
  }

  const row = await env.D1_DB.prepare(
    `INSERT INTO event_kitchens (event_id, enabled, created_by)
     VALUES (?, 1, ?)
     RETURNING *`,
  )
    .bind(eventId, createdBy)
    .first()
  return mapKitchen(row as Record<string, unknown>)
}

export const disableEventKitchen = async (
  env: Environment,
  eventId: string,
): Promise<EventKitchen | null> => {
  const row = await env.D1_DB.prepare(
    `UPDATE event_kitchens
     SET enabled = 0, updated_at = datetime('now')
     WHERE event_id = ?
     RETURNING *`,
  )
    .bind(eventId)
    .first()
  return row ? mapKitchen(row as Record<string, unknown>) : null
}

export const setKitchenInterestRules = async (
  env: Environment,
  eventId: string,
  interestMin: number,
  interestMax: number,
): Promise<EventKitchen | null> => {
  const row = await env.D1_DB.prepare(
    `UPDATE event_kitchens
     SET interest_min = ?, interest_max = ?, updated_at = datetime('now')
     WHERE event_id = ?
     RETURNING *`,
  )
    .bind(interestMin, interestMax, eventId)
    .first()
  return row ? mapKitchen(row as Record<string, unknown>) : null
}

export type KitchenTeamSettingsInput = {
  allow_create_teams: boolean
  allow_join_teams: boolean
  max_team_size: number
}

export const setKitchenTeamSettings = async (
  env: Environment,
  eventId: string,
  settings: KitchenTeamSettingsInput,
): Promise<EventKitchen | null> => {
  const maxSize = resolveMaxTeamSize(settings.max_team_size)
  const row = await env.D1_DB.prepare(
    `UPDATE event_kitchens
     SET allow_create_teams = ?, allow_join_teams = ?, max_team_size = ?,
         updated_at = datetime('now')
     WHERE event_id = ?
     RETURNING *`,
  )
    .bind(
      settings.allow_create_teams ? 1 : 0,
      settings.allow_join_teams ? 1 : 0,
      maxSize,
      eventId,
    )
    .first()
  return row ? mapKitchen(row as Record<string, unknown>) : null
}

export async function getKitchenMaxTeamSize(
  env: Environment,
  eventId: string,
): Promise<number> {
  const kitchen = await getEventKitchen(env, eventId)
  return kitchen?.max_team_size ?? DEFAULT_MAX_TEAM_SIZE
}
