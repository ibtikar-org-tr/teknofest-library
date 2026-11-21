import type { ProjectFieldOption } from '../types'

const LIBRARY_PUBLIC_URL = (
  import.meta.env.VITE_LIBRARY_URL as string | undefined
)?.trim() || 'https://tal.ibtikar.tr'

/** Resolve library competition id from stored field (id string or legacy name). */
export function competitionIdFromField(
  field: string | null | undefined,
  competitions: ProjectFieldOption[] = [],
): number | null {
  const raw = String(field ?? '').trim()
  if (!raw) return null
  if (/^\d+$/.test(raw)) return Number(raw)
  const match = competitions.find((c) => c.value === raw || c.label === raw)
  return match?.id ?? null
}

export function competitionLabel(
  field: string | null | undefined,
  competitions: ProjectFieldOption[] = [],
  fieldLabel?: string | null,
): string {
  if (fieldLabel?.trim()) return fieldLabel.trim()
  const raw = String(field ?? '').trim()
  if (!raw) return ''
  const match = competitions.find(
    (c) => String(c.id) === raw || c.value === raw || c.label === raw,
  )
  return match?.label ?? raw
}

/** Public TAL / library competition page (always by numeric id when possible). */
export function libraryCompetitionUrl(
  field: string | null | undefined,
  competitions: ProjectFieldOption[] = [],
): string | null {
  const id = competitionIdFromField(field, competitions)
  if (id == null) return null
  return `${LIBRARY_PUBLIC_URL.replace(/\/+$/, '')}/competition/${id}?lang=ar`
}
