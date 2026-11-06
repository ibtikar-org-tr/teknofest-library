import type { Lang } from '@/i18n/types'

export type ArchiveTrack = {
  title: string
  desc: string
  tags?: string[]
}

export type ArchiveProgramItem = {
  time: string
  title: string
  body?: string
}

export type ArchiveSpeaker = {
  name: string
  role: string
  org?: string
  tags?: string[]
}

export type ArchiveDict = {
  documentTitle: string
  metaDescription: string
  nav: {
    about: string
    program: string
    highlights: string
    speakers: string
    gallery: string
    backTo2026: string
    edition: string
  }
  hero: {
    badge: string
    archived: string
    titleTop: string
    titleBottom: string
    subtitle: string
    viewHighlights: string
    viewProgram: string
    viewGallery: string
    city: string
    cityValue: string
    dates: string
    datesValue: string
    attendees: string
    attendeesValue: string
    days: string
    daysValue: string
  }
  about: {
    label: string
    title: string
    body: string
    stats: { value: string; label: string }[]
  }
  program: {
    label: string
    title: string
    subtitle: string
    items: ArchiveProgramItem[]
  }
  highlights: {
    label: string
    title: string
    subtitle: string
    items: ArchiveTrack[]
  }
  speakers: {
    label: string
    title: string
    subtitle: string
    items: ArchiveSpeaker[]
  }
  gallery: {
    label: string
    title: string
    subtitle: string
  }
  cta: {
    title: string
    subtitle: string
    button: string
  }
  footer: {
    dates: string
  }
}

export type ArchiveDictionaries = Record<Lang, ArchiveDict>
