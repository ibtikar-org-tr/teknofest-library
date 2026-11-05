import { ar } from './dictionaries/ar'
import { en } from './dictionaries/en'
import { tr } from './dictionaries/tr'
import {
  DEFAULT_LANG,
  isDayId,
  isLang,
  LANG_QUERY_PARAM,
  LANGS,
  STORAGE_KEY,
  type Dictionary,
  type Dir,
  type Lang,
  type DayId,
} from './types'

export { LANGS, DEFAULT_LANG, STORAGE_KEY, LANG_QUERY_PARAM, isLang, isDayId }
export type { Dictionary, Dir, Lang, DayId }

const DICTIONARIES: Record<Lang, Dictionary> = { ar, en, tr }

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang]
}

export function readLangFromUrl(search = window.location.search): Lang | null {
  const value = new URLSearchParams(search).get(LANG_QUERY_PARAM)
  return isLang(value) ? value : null
}

export function writeLangToUrl(lang: Lang) {
  const url = new URL(window.location.href)
  url.searchParams.set(LANG_QUERY_PARAM, lang)
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export function detectInitialLang(): Lang {
  if (typeof window === 'undefined') {
    return DEFAULT_LANG
  }

  const fromUrl = readLangFromUrl()
  if (fromUrl) {
    return fromUrl
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLang(stored)) {
    return stored
  }

  const browser = window.navigator.language.toLowerCase()
  if (browser.startsWith('ar')) return 'ar'
  if (browser.startsWith('tr')) return 'tr'
  return DEFAULT_LANG
}

export function applyDocumentLocale(lang: Lang, dir: Dir) {
  const root = document.documentElement
  root.lang = lang
  root.dir = dir
  root.classList.toggle('font-arabic', lang === 'ar')
}
