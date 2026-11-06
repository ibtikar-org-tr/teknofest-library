import { filesUrl } from '@/lib/files-base'

/** Keys match `files/media/events/tac/tac-2024/` (R2 sync source). */
const PREFIX = '/events/tac/tac-2024'

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
  return filesUrl(`${PREFIX}/${filename}`)
}

export const TAC_2024_HERO_IMAGE = tac2024ImageUrl('hero.jpg')
