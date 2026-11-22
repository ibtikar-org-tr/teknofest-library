import type { Environment } from '../types/env'
import type { VmsEventSummary } from '../types/models'

export interface VmsEventRow {
  id: string
  name: string
  description: string | null
  start_time: string | null
  end_time: string | null
  status: string
  image_url: string | null
  project_id: string | null
  created_by: string | null
}

const EVENT_SELECT = `SELECT id, name, description, start_time, end_time, status, image_url, project_id, created_by
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
    created_by: row.created_by,
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

export type EventRegistrant = {
  membership_number: string
  full_name: string
  email: string
  status: string
}

export type MemberContact = {
  membership_number: string
  email: string | null
  ar_name: string | null
  en_name: string | null
  phone_number: string | null
  sex: string | null
  telegram_id: string | null
  telegram_username: string | null
}

const MEMBERSHIP_BATCH = 80

/** Enrich membership numbers from MEMBERS_DB (users live there, not on VMS_DB). */
export async function loadMemberContacts(
  env: Environment,
  membershipNumbers: string[],
): Promise<Map<string, MemberContact>> {
  const map = new Map<string, MemberContact>()
  const membersDb = env.MEMBERS_DB
  if (!membersDb || membershipNumbers.length === 0) return map

  for (let i = 0; i < membershipNumbers.length; i += MEMBERSHIP_BATCH) {
    const batch = membershipNumbers.slice(i, i + MEMBERSHIP_BATCH)
    const placeholders = batch.map(() => '?').join(', ')
    try {
      const { results } = await membersDb
        .prepare(
          `SELECT
             u.membership_number AS membership_number,
             u.email AS email,
             ui.ar_name AS ar_name,
             ui.en_name AS en_name,
             ui.phone_number AS phone_number,
             ui.sex AS sex,
             ui.telegram_id AS telegram_id,
             ui.telegram_username AS telegram_username
           FROM users u
           LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
           WHERE u.membership_number IN (${placeholders})`,
        )
        .bind(...batch)
        .all<MemberContact>()
      for (const row of results ?? []) {
        map.set(row.membership_number.trim(), row)
      }
    } catch (error) {
      console.error('MEMBERS_DB contact lookup failed', error)
      break
    }
  }
  return map
}

export function normalizeTelegramUsername(raw: string | null | undefined): string | null {
  const cleaned = raw?.trim().replace(/^@+/, '') || ''
  return cleaned || null
}

/** Resolve one VMS/membership identity for team create / membership verify. */
export async function lookupMemberContact(
  env: Environment,
  membershipNumber: string,
): Promise<{
  membership_number: string
  full_name: string
  email: string
  phone: string
  gender: 'male' | 'female' | null
} | null> {
  const trimmed = membershipNumber.trim()
  if (!trimmed) return null
  const contacts = await loadMemberContacts(env, [trimmed])
  const contact = contacts.get(trimmed)
  if (!contact) return null
  const fullName =
    contact.ar_name?.trim() || contact.en_name?.trim() || trimmed
  const email = contact.email?.trim() || ''
  if (!email) return null
  const sex = contact.sex?.trim()
  return {
    membership_number: trimmed,
    full_name: fullName,
    email,
    phone: contact.phone_number?.trim() || 'n/a',
    gender: sex === 'female' ? 'female' : sex === 'male' ? 'male' : null,
  }
}

/**
 * Member registrants (not guests) eligible to be appointed as juries.
 * Registrations come from VMS_DB; names/emails from MEMBERS_DB when bound.
 */
export const listEventRegistrants = async (
  env: Environment,
  eventId: string,
): Promise<EventRegistrant[]> => {
  const { results } = await env.VMS_DB.prepare(
    `SELECT membership_number, status
     FROM event_registrations
     WHERE event_id = ?
       AND status IN ('registered', 'attended')
       AND membership_number IS NOT NULL
       AND TRIM(membership_number) != ''`,
  )
    .bind(eventId)
    .all<{ membership_number: string; status: string }>()

  const seen = new Set<string>()
  const base: { membership_number: string; status: string }[] = []
  for (const row of results ?? []) {
    const membershipNumber = row.membership_number.trim()
    if (!membershipNumber || seen.has(membershipNumber)) continue
    seen.add(membershipNumber)
    base.push({ membership_number: membershipNumber, status: row.status })
  }

  const contacts = await loadMemberContacts(
    env,
    base.map((r) => r.membership_number),
  )

  const out: EventRegistrant[] = base.map((r) => {
    const contact = contacts.get(r.membership_number)
    const fullName =
      contact?.ar_name?.trim() ||
      contact?.en_name?.trim() ||
      r.membership_number
    return {
      membership_number: r.membership_number,
      full_name: fullName,
      email: contact?.email?.trim() || '',
      status: r.status,
    }
  })

  out.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'))
  return out
}
