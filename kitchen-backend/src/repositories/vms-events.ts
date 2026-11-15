import type { Environment } from '../types/env'
import type { VmsEventSummary } from '../types/models'

interface VmsEventRow {
  id: string
  name: string
  description: string | null
  start_time: string | null
  end_time: string | null
  status: string
  image_url: string | null
  project_id: string | null
}

const EVENT_SELECT = `SELECT id, name, description, start_time, end_time, status, image_url, project_id
  FROM events`

function mapEvent(row: VmsEventRow): VmsEventSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    image_url: row.image_url,
    project_id: row.project_id,
  }
}

export const listVmsEvents = async (env: Environment): Promise<VmsEventSummary[]> => {
  const { results } = await env.VMS_DB.prepare(
    `${EVENT_SELECT} ORDER BY COALESCE(start_time, created_at) DESC`,
  ).all<VmsEventRow>()
  return (results ?? []).map(mapEvent)
}

export const getVmsEvent = async (
  env: Environment,
  eventId: string,
): Promise<VmsEventSummary | null> => {
  const row = await env.VMS_DB.prepare(`${EVENT_SELECT} WHERE id = ?`)
    .bind(eventId)
    .first<VmsEventRow>()
  return row ? mapEvent(row) : null
}

export const getVmsEventsByIds = async (
  env: Environment,
  eventIds: string[],
): Promise<VmsEventSummary[]> => {
  if (eventIds.length === 0) return []
  const placeholders = eventIds.map(() => '?').join(', ')
  const { results } = await env.VMS_DB.prepare(
    `${EVENT_SELECT} WHERE id IN (${placeholders}) ORDER BY COALESCE(start_time, created_at) DESC`,
  )
    .bind(...eventIds)
    .all<VmsEventRow>()
  return (results ?? []).map(mapEvent)
}

/** Active VMS registration for kitchen access (registered or attended). */
export const isMemberRegisteredForEvent = async (
  env: Environment,
  eventId: string,
  membershipNumber: string,
): Promise<boolean> => {
  const row = await env.VMS_DB.prepare(
    `SELECT id FROM event_registrations
     WHERE event_id = ?
       AND membership_number = ?
       AND status IN ('registered', 'attended')
     LIMIT 1`,
  )
    .bind(eventId, membershipNumber.trim())
    .first<{ id: string }>()
  return Boolean(row)
}
