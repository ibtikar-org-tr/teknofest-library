import { archive2023 } from '@/i18n/archives/2023'
import { archive2024 } from '@/i18n/archives/2024'
import type { ArchiveDict } from '@/i18n/archives/types'
import type { Lang } from '@/i18n/types'
import type { ArchiveYear } from '@/lib/page-url'

export type { ArchiveDict, ArchiveTrack, ArchiveDictionaries } from '@/i18n/archives/types'

export function getArchiveDictionary(year: ArchiveYear, lang: Lang): ArchiveDict {
  return year === 2023 ? archive2023[lang] : archive2024[lang]
}
