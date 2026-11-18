import type { Environment } from '../types/env'

export type LibraryCompetitionType = 'competitive' | 'innovative'

/** Slim competition row for kitchen dropdowns (sourced from library). */
export type KitchenCompetitionField = {
  id: number
  /** Stored on teams/individuals/projects as `field` / `preferred_field` (Arabic name preferred). */
  value: string
  label: string
  labelEn: string
  labelTr: string
  type: LibraryCompetitionType | null
}

type LibraryCompetitionRow = {
  id: number
  deleted_at?: string | null
  ar_name?: string | null
  en_name?: string | null
  tr_name?: string | null
  type?: string | null
}

async function libraryFetch(env: Environment, path: string): Promise<Response> {
  // Prefer HTTP base for local/offline; production uses the LIBRARY service binding.
  const base = env.LIBRARY_API_BASE?.trim().replace(/\/+$/, '')
  if (base) {
    return fetch(`${base}${path}`)
  }

  if (env.LIBRARY) {
    return env.LIBRARY.fetch(new Request(`https://library.internal${path}`))
  }

  throw new Error('LIBRARY service binding or LIBRARY_API_BASE is required')
}

function pickName(
  row: LibraryCompetitionRow,
  lang: 'ar' | 'en' | 'tr',
): string {
  const primary =
    lang === 'ar' ? row.ar_name : lang === 'en' ? row.en_name : row.tr_name
  if (primary?.trim()) return primary.trim()
  return (
    row.ar_name?.trim() ||
    row.en_name?.trim() ||
    row.tr_name?.trim() ||
    `Competition ${row.id}`
  )
}

function mapCompetition(row: LibraryCompetitionRow): KitchenCompetitionField | null {
  if (row.deleted_at) return null
  const id = Number(row.id)
  if (!Number.isFinite(id) || id <= 0) return null

  const label = pickName(row, 'ar')
  const labelEn = pickName(row, 'en')
  const labelTr = pickName(row, 'tr')
  const type =
    row.type === 'competitive' || row.type === 'innovative' ? row.type : null

  return {
    id,
    value: label,
    label,
    labelEn,
    labelTr,
    type,
  }
}

/** Active competitions from the library worker (service binding or HTTP). */
export async function listLibraryCompetitionFields(
  env: Environment,
): Promise<KitchenCompetitionField[]> {
  const response = await libraryFetch(env, '/api/competitions')
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Library competitions failed (${response.status}): ${body}`)
  }

  const rows = (await response.json()) as LibraryCompetitionRow[]
  if (!Array.isArray(rows)) {
    throw new Error('Library competitions response was not an array')
  }

  return rows
    .map(mapCompetition)
    .filter((row): row is KitchenCompetitionField => row != null)
    .sort((a, b) => a.label.localeCompare(b.label, 'ar'))
}
