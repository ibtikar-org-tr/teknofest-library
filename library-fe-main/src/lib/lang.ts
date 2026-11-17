import type { Language } from "@/lib/translations";

export const LANG_PARAM = "lang";
export const DEFAULT_LANGUAGE: Language = "ar";

export const isLanguage = (value: string | null | undefined): value is Language =>
  value === "en" || value === "tr" || value === "ar";

/** Keep (or set) `lang` on an internal href while preserving other query params. */
export const withLang = (href: string, lang: Language): string => {
  if (
    !href ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }

  const [pathAndQuery, hash = ""] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  params.set(LANG_PARAM, lang);
  const q = params.toString();
  return `${path}?${q}${hash ? `#${hash}` : ""}`;
};
