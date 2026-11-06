import { filesUrl } from '@/lib/files-base'

/**
 * R2/CDN prefix for TAC 2024 media (matches uploaded bucket layout).
 * Local mirror: files/media/events/tac/tac-2024/{file}
 * Remote:       https://files.ibtikar.tr/events/2024/2403/TAC2024/media/{file}
 */
export const TAC_2024_MEDIA_PREFIX = '/events/2024/2403/TAC2024/media'

export const TAC_2024_IMAGES = [
  'hero.jpg',
  'gallery-01.jpg',
  'gallery-02.jpg',
  'gallery-03.jpg',
  'gallery-04.jpg',
  'gallery-05.jpg',
  'gallery-06.jpg',
  'gallery-07.jpg',
  'gallery-08.jpg',
  'gallery-09.jpg',
  'gallery-10.jpg',
] as const

export function tac2024ImageUrl(filename: string) {
  return filesUrl(`${TAC_2024_MEDIA_PREFIX}/${filename}`)
}

export const TAC_2024_HERO_IMAGE = tac2024ImageUrl('hero.jpg')
