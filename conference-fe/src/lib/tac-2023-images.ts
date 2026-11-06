import { filesUrl } from '@/lib/files-base'

/** Keys match `files/media/events/tac/tac-2023/` (R2 sync source). */
const PREFIX = '/events/tac/tac-2023'

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
  return filesUrl(`${PREFIX}/${filename}`)
}

export const TAC_2023_HERO_IMAGE = tac2023ImageUrl('hero.jpg')
