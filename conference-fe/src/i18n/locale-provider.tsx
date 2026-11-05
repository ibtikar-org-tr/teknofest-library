import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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

interface LocaleContextValue {
  lang: Lang
  dir: Dir
  t: Dictionary
  setLang: (lang: Lang) => void
  langs: typeof LANGS
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitialLang())
  const t = getDictionary(lang)
  const dir = t.dir

  useEffect(() => {
    applyDocumentLocale(lang, dir)
    window.localStorage.setItem(STORAGE_KEY, lang)
    writeLangToUrl(lang)
    document.title = t.documentTitle
    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute('content', t.metaDescription)
    }
  }, [lang, dir, t.documentTitle, t.metaDescription])

  useEffect(() => {
    function onPopState() {
      const fromUrl = readLangFromUrl()
      if (fromUrl) {
        setLangState(fromUrl)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function setLang(next: Lang) {
    setLangState(next)
  }

  return (
    <LocaleContext.Provider value={{ lang, dir, t, setLang, langs: LANGS }}>
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
