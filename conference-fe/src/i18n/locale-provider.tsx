import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getArchiveDictionary, type ArchiveDict } from '@/i18n/archives'
import {
  applyDocumentLocale,
  detectInitialLang,
  getDictionary,
  LANGS,
  STORAGE_KEY,
  readLangFromUrl,
  writeLangToUrl,
  type Dictionary,
  type Dir,
  type Lang,
} from '@/i18n'
import {
  archiveYearForPage,
  isArchivePage,
  readPageFromUrl,
  type Page,
} from '@/lib/page-url'

interface LocaleContextValue {
  lang: Lang
  dir: Dir
  page: Page
  t: Dictionary
  archive: ArchiveDict | null
  setLang: (lang: Lang) => void
  langs: typeof LANGS
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitialLang())
  const [page, setPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'home' : readPageFromUrl(),
  )
  const t = getDictionary(lang)
  const dir = t.dir
  const year = archiveYearForPage(page)
  const archive = year ? getArchiveDictionary(year, lang) : null

  const syncFromUrl = useCallback(() => {
    const fromUrl = readLangFromUrl()
    if (fromUrl) {
      setLangState(fromUrl)
    }
    setPage(readPageFromUrl())
  }, [])

  useEffect(() => {
    applyDocumentLocale(lang, dir)
    window.localStorage.setItem(STORAGE_KEY, lang)
    writeLangToUrl(lang)

    const title = archive?.documentTitle ?? t.documentTitle
    const description = archive?.metaDescription ?? t.metaDescription
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute('content', description)
    }
  }, [lang, dir, t.documentTitle, t.metaDescription, archive])

  useEffect(() => {
    function onPopState() {
      syncFromUrl()
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [syncFromUrl])

  useEffect(() => {
    if (isArchivePage(page)) {
      window.scrollTo(0, 0)
    }
  }, [page])

  function setLang(next: Lang) {
    setLangState(next)
  }

  return (
    <LocaleContext.Provider value={{ lang, dir, page, t, archive, setLang, langs: LANGS }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (!value) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return value
}
