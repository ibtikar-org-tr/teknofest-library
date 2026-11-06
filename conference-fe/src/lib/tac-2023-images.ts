import { filesUrl } from '@/lib/files-base'

/**
 * R2/CDN prefix for TAC 2023 media (matches uploaded bucket layout).
 * Local mirror: files/media/events/tac/tac-2023/{file}
 * Remote:       https://files.ibtikar.tr/events/2023/2303/TAC/media/{file}
 */
export const TAC_2023_MEDIA_PREFIX = '/events/2023/2303/TAC/media'

export const TAC_2023_IMAGES = [
  'hero.jpg',
  'gallery-01.jpg',
  'gallery-02.jpg',
  'gallery-03.jpg',
  'gallery-04.jpg',
  'gallery-05.jpg',
  'gallery-06.jpg',
  'gallery-07.jpg',
  'gallery-08.jpg',
] as const

export function tac2023ImageUrl(filename: string) {
  return filesUrl(`${TAC_2023_MEDIA_PREFIX}/${filename}`)
}

export const TAC_2023_HERO_IMAGE = tac2023ImageUrl('hero.jpg')
