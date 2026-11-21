import type { Environment } from '../types/env'
import {
  getLibraryCompetitionById,
  listLibraryCompetitionFields,
  type KitchenCompetitionField,
} from './library-competitions'

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

/** Replace the kitchen allowlist. Unknown library ids are rejected. */
export async function setKitchenCompetitionIds(
  env: Environment,
  eventId: string,
  competitionIds: number[],
): Promise<{ ok: true; competition_ids: number[] } | { ok: false; message: string }> {
  const unique = [
    ...new Set(
      competitionIds
        .map((n) => Number(n))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ].sort((a, b) => a - b)

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

  return { ok: true, competition_ids: unique }
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
  T extends { preferred_field: string },
>(
  env: Environment,
  individuals: T[],
): Promise<(T & { preferred_field_label: string })[]> {
  const labels = await labelLookup(env)
  return individuals.map((row) => {
    const key = String(row.preferred_field ?? '').trim()
    return { ...row, preferred_field_label: labels.get(key) || key }
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
