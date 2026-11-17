import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSearchParams } from "wouter";
import { translations, type Language, type Direction } from "./translations";
import { DEFAULT_LANGUAGE, isLanguage, LANG_PARAM } from "./lang";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const langParam = searchParams.get(LANG_PARAM);
  const language: Language = isLanguage(langParam) ? langParam : DEFAULT_LANGUAGE;
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  // Persist language in the URL (default Arabic when missing / invalid)
  useEffect(() => {
    if (isLanguage(langParam)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(LANG_PARAM, DEFAULT_LANGUAGE);
        return next;
      },
      { replace: true },
    );
  }, [langParam, setSearchParams]);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(LANG_PARAM, lang);
        return next;
      },
      { replace: true },
    );
  };

  const t = (path: string) => {
    const keys = path.split(".");
    let current: any = translations[language];

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation missing for key: ${path} in language: ${language}`);
        return path;
      }
      current = current[key];
    }

    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
