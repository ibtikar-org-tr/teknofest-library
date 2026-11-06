/** CDN base — upload curated JPGs here (same pattern as ETC). */
const BASE = 'https://files.ibtikar.tr/events/tac/tac-2024'

/**
 * Placeholder filenames until curated photos are uploaded to the CDN.
 * Replace this list with the real uploaded filenames.
 */
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
  return `${BASE}/${filename}`
}

export const TAC_2024_HERO_IMAGE = tac2024ImageUrl('hero.jpg')
