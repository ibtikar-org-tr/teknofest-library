import type { Environment } from '../types/env'
import type { EventKitchen } from '../types/models'
import { asBool } from '../utils/sql'

const mapKitchen = (row: Record<string, unknown>): EventKitchen => ({
  event_id: String(row.event_id),
  enabled: asBool(row.enabled),
  created_by: String(row.created_by),
  created_at: String(row.created_at),
  updated_at: (row.updated_at as string) ?? null,
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
