/**
 * Public files origin. Paths under it match `files/media/` relative layout
 * (e.g. files/media/events/tac/tac-2023/hero.jpg → {origin}/events/tac/tac-2023/hero.jpg).
 *
 * - Production default: https://files.ibtikar.tr (after you sync files/media to R2)
 * - Local: set VITE_FILES_BASE= in .env.development so URLs are same-origin `/events/...`
 *   while Vite serves `files/media`.
 */
const raw = import.meta.env.VITE_FILES_BASE
const ORIGIN =
  raw === undefined ? 'https://files.ibtikar.tr' : String(raw).replace(/\/$/, '')

export function filesUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!ORIGIN) return normalized
  return `${ORIGIN}${normalized}`
}
