import type { Environment } from '../types/env'
import {
  DEFAULT_MAX_TEAM_SIZE,
  getEventKitchen,
  setKitchenInterestRules,
} from './event-kitchens'
import {
  getLibraryCompetitionById,
  listLibraryCompetitionFields,
  type KitchenCompetitionField,
} from './library-competitions'

export type KitchenCompetitionSettings = {
  competitions: KitchenCompetitionField[]
  interest_min: number | null
  interest_max: number | null
  /** True when admin set min/max and enough allowlisted competitions exist. */
  registration_open: boolean
  allow_create_teams: boolean
  allow_join_teams: boolean
  max_team_size: number
}

export function isRegistrationOpen(settings: {
  interest_min: number | null
  interest_max: number | null
  allowlist_count: number
}): boolean {
  const min = settings.interest_min
  const max = settings.interest_max
  if (min == null || max == null) return false
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false
  if (min < 1 || max < min) return false
  return settings.allowlist_count >= min
}

export async function getKitchenCompetitionSettings(
  env: Environment,
  eventId: string,
): Promise<KitchenCompetitionSettings> {
  const kitchen = await getEventKitchen(env, eventId)
  const competitions = await listKitchenCompetitionFields(env, eventId)
  const interest_min = kitchen?.interest_min ?? null
  const interest_max = kitchen?.interest_max ?? null
  return {
    competitions,
    interest_min,
    interest_max,
    registration_open: isRegistrationOpen({
      interest_min,
      interest_max,
      allowlist_count: competitions.length,
    }),
    allow_create_teams: kitchen?.allow_create_teams ?? false,
    allow_join_teams: kitchen?.allow_join_teams ?? false,
    max_team_size: kitchen?.max_team_size ?? DEFAULT_MAX_TEAM_SIZE,
  }
}

export async function listKitchenCompetitionIds(
  env: Environment,
  eventId: string,
): Promise<number[]> {
  const { results } = await env.D1_DB.prepare(
    `SELECT competition_id FROM kitchen_competitions
     WHERE event_id = ?
     ORDER BY competition_id ASC`,
  )
    .bind(eventId)
    .all()

  return (results ?? [])
    .map((row) => Number((row as { competition_id: number }).competition_id))
    .filter((id) => Number.isFinite(id) && id > 0)
}

/** Allowlisted competitions for members (enriched from Library). */
export async function listKitchenCompetitionFields(
  env: Environment,
  eventId: string,
): Promise<KitchenCompetitionField[]> {
  const ids = await listKitchenCompetitionIds(env, eventId)
  if (ids.length === 0) return []

  const catalog = await listLibraryCompetitionFields(env)
  const byId = new Map(catalog.map((c) => [c.id, c]))
  return ids
    .map((id) => byId.get(id))
    .filter((c): c is KitchenCompetitionField => c != null)
    .sort((a, b) => a.label.localeCompare(b.label, 'ar'))
}

/**
 * Replace allowlist + interest min/max.
 * Registration opens only when min/max are valid and allowlist.length >= min.
 */
export async function setKitchenCompetitionSettings(
  env: Environment,
  eventId: string,
  competitionIds: number[],
  interestMin: number,
  interestMax: number,
): Promise<
  | { ok: true; competition_ids: number[]; interest_min: number; interest_max: number }
  | { ok: false; message: string }
> {
  const min = Number(interestMin)
  const max = Number(interestMax)
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 1 || max < min || max > 20) {
    return {
      ok: false,
      message: 'interest_min/interest_max must satisfy 1 ≤ min ≤ max ≤ 20',
    }
  }

  const unique = [
    ...new Set(
      competitionIds
        .map((n) => Number(n))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ].sort((a, b) => a - b)

  if (unique.length < min) {
    return {
      ok: false,
      message: `Select at least ${min} competitions (interest_min)`,
    }
  }

  if (unique.length > 0) {
    const catalog = await listLibraryCompetitionFields(env)
    const known = new Set(catalog.map((c) => c.id))
    const missing = unique.filter((id) => !known.has(id))
    if (missing.length > 0) {
      return {
        ok: false,
        message: `Unknown library competition ids: ${missing.join(', ')}`,
      }
    }
  }

  const kitchen = await getEventKitchen(env, eventId)
  if (!kitchen) {
    return { ok: false, message: 'Kitchen not found for this event' }
  }

  await env.D1_DB.prepare(`DELETE FROM kitchen_competitions WHERE event_id = ?`)
    .bind(eventId)
    .run()

  for (const id of unique) {
    await env.D1_DB.prepare(
      `INSERT INTO kitchen_competitions (event_id, competition_id) VALUES (?, ?)`,
    )
      .bind(eventId, id)
      .run()
  }

  await setKitchenInterestRules(env, eventId, min, max)
  return { ok: true, competition_ids: unique, interest_min: min, interest_max: max }
}

/** @deprecated use setKitchenCompetitionSettings */
export async function setKitchenCompetitionIds(
  env: Environment,
  eventId: string,
  competitionIds: number[],
): Promise<{ ok: true; competition_ids: number[] } | { ok: false; message: string }> {
  const kitchen = await getEventKitchen(env, eventId)
  const min = kitchen?.interest_min ?? 1
  const max = kitchen?.interest_max ?? Math.max(min, Math.min(5, competitionIds.length || 5))
  const result = await setKitchenCompetitionSettings(env, eventId, competitionIds, min, max)
  if (!result.ok) return result
  return { ok: true, competition_ids: result.competition_ids }
}

export async function isCompetitionAllowedForKitchen(
  env: Environment,
  eventId: string,
  competitionId: number,
): Promise<boolean> {
  const row = await env.D1_DB.prepare(
    `SELECT 1 AS ok FROM kitchen_competitions
     WHERE event_id = ? AND competition_id = ?
     LIMIT 1`,
  )
    .bind(eventId, competitionId)
    .first()
  return Boolean(row)
}

/** Resolve stored `teams.field` (library id string, or legacy name) to a display label. */
export async function resolveCompetitionLabel(
  env: Environment,
  field: string | null | undefined,
): Promise<string | null> {
  const raw = String(field ?? '').trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    const row = await getLibraryCompetitionById(env, Number(raw))
    return row?.label ?? raw
  }

  return raw
}

async function labelLookup(env: Environment): Promise<Map<string, string>> {
  const catalog = await listLibraryCompetitionFields(env).catch(
    () => [] as KitchenCompetitionField[],
  )
  const map = new Map<string, string>()
  for (const c of catalog) {
    map.set(String(c.id), c.label)
    map.set(c.label, c.label)
  }
  return map
}

export async function enrichTeamsWithCompetitionLabels<
  T extends { field: string },
>(env: Environment, teams: T[]): Promise<(T & { field_label: string })[]> {
  const labels = await labelLookup(env)
  return teams.map((team) => {
    const key = String(team.field ?? '').trim()
    return { ...team, field_label: labels.get(key) || key }
  })
}

export async function enrichIndividualsWithCompetitionLabels<
  T extends { preferred_field: string; preferred_competition_ids?: number[] },
>(
  env: Environment,
  individuals: T[],
): Promise<(T & { preferred_field_label: string; preferred_field_labels: string[] })[]> {
  const labels = await labelLookup(env)
  return individuals.map((row) => {
    const ids =
      row.preferred_competition_ids && row.preferred_competition_ids.length > 0
        ? row.preferred_competition_ids
        : (() => {
            const n = Number(row.preferred_field)
            return Number.isFinite(n) && n > 0 ? [n] : []
          })()
    const preferred_field_labels = ids.map((id) => labels.get(String(id)) || String(id))
    const key = String(row.preferred_field ?? '').trim()
    return {
      ...row,
      preferred_field_label: labels.get(key) || preferred_field_labels[0] || key,
      preferred_field_labels,
    }
  })
}

export async function enrichProjectsWithCompetitionLabels<
  T extends { field: string },
>(env: Environment, projects: T[]): Promise<(T & { field_label: string })[]> {
  const labels = await labelLookup(env)
  return projects.map((row) => {
    const key = String(row.field ?? '').trim()
    return { ...row, field_label: labels.get(key) || key }
  })
}
