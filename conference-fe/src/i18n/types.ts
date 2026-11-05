export type Lang = 'ar' | 'en' | 'tr'
export type Dir = 'rtl' | 'ltr'
export type DayId = 'day1' | 'day2'
export type ProgramId = 'stars' | 'panels' | 'exhibition' | 'kitchen'
export type AgendaKind =
  | 'network'
  | 'talk'
  | 'panel'
  | 'break'
  | 'video'
  | 'workshop'
  | 'ceremony'
  | 'admin'
  | 'formation'
  | 'submit'

export const LANGS: { code: Lang; label: string; dir: Dir }[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'EN', dir: 'ltr' },
  { code: 'tr', label: 'TR', dir: 'ltr' },
]

export const DEFAULT_LANG: Lang = 'ar'
export const STORAGE_KEY = 'teknefest-landing-lang'
export const LANG_QUERY_PARAM = 'lang'

export type AgendaTopic = {
  title: string
  tr?: string
}

export type AgendaItem = {
  time: string
  title: string
  body?: string
  kind: AgendaKind
  topics?: AgendaTopic[]
}

export type AgendaDay = {
  id: DayId
  kicker: string
  title: string
  subtitle: string
  hours: string
  items: AgendaItem[]
}

export type ProgramItem = {
  id: ProgramId
  kicker: string
  title: string
  body: string
  points: string[]
}

export type Dictionary = {
  dir: Dir
  locale: string
  brand: string
  techLogoAlt: string
  documentTitle: string
  metaDescription: string
  nav: {
    about: string
    facts: string
    program: string
    agenda: string
    exhibition: string
    kitchen: string
    registerNow: string
    homeAria: string
    primaryNav: string
    mobileNav: string
    openMenu: string
    closeMenu: string
  }
  hero: {
    eyebrow: string
    brandTitle: string
    titleLine1: string
    titleLine2Before: string
    titleLine2Accent: string
    body: string
    registerNow: string
    exploreAgenda: string
    aboutProgram: string
    stats: { value: string; label: string }[]
  }
  registerPaths: {
    label: string
    title: string
    body: string
    studentStartups: string
    teknofestTeams: string
  }
  about: {
    label: string
    title: string
    body: string
    vision: string
    visionBody: string
    mission: string
    missionBody: string
  }
  facts: {
    label: string
    title: string
    items: { value: string; label: string; body: string }[]
  }
  values: {
    label: string
    items: { title: string }[]
  }
  benefits: {
    label: string
    items: { title: string; body: string }[]
  }
  program: {
    label: string
    title: string
    items: ProgramItem[]
  }
  agenda: {
    label: string
    title: string
    kindLabel: Record<AgendaKind, string>
    days: AgendaDay[]
  }
  exhibition: {
    label: string
    title: string
    body: string
    items: { title: string; body: string }[]
    cornersLabel: string
    cornersTitle: string
    corners: { title: string; body: string }[]
    registerCta: string
  }
  kitchen: {
    label: string
    kicker: string
    title: string
    body: string
    stats: { value: string; label: string }[]
    stepsLabel: string
    steps: { title: string; body: string }[]
    mentorsTitle: string
    mentorsBody: string
    registerCta: string
  }
  footer: {
    blurb: string
    getInTouch: string
    connect: string
    partners: string
    rights: string
    location: string
    instagram: string
    linkedin: string
    telegramChannel: string
    telegramContact: string
    whatsapp: string
    email: string
    github: string
    bylaws: string
    lms: string
  }
}

export function isLang(value: string | null | undefined): value is Lang {
  return value === 'ar' || value === 'en' || value === 'tr'
}

export function isDayId(value: string | null | undefined): value is DayId {
  return value === 'day1' || value === 'day2'
}
