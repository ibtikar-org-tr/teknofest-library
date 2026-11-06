/** Public R2 / CDN host (files.ibtikar.tr custom domain on files-main). */
export const FILES_CDN_ORIGIN = 'https://files.ibtikar.tr'

/**
 * Build an absolute CDN URL.
 * `path` is the object key path on R2 (leading slash optional), e.g.
 * `/events/2023/2303/TAC/media/hero.jpg`.
 */
export function filesUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${FILES_CDN_ORIGIN}${normalized}`
}
