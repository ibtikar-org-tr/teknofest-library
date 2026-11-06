export type Page = 'home' | 'tac-2023' | 'tac-2024'

export type ArchiveYear = 2023 | 2024

const ARCHIVE_PAGES: Record<Exclude<Page, 'home'>, ArchiveYear> = {
  'tac-2023': 2023,
  'tac-2024': 2024,
}

function pathParts(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

export function isArchivePage(page: Page): page is 'tac-2023' | 'tac-2024' {
  return page === 'tac-2023' || page === 'tac-2024'
}

export function archiveYearForPage(page: Page): ArchiveYear | null {
  if (!isArchivePage(page)) return null
  return ARCHIVE_PAGES[page]
}

export function readPageFromUrl(pathname = window.location.pathname): Page {
  const parts = pathParts(pathname)
  if (parts.includes('2023')) return 'tac-2023'
  if (parts.includes('2024')) return 'tac-2024'
  return 'home'
}

export function pagePath(page: Page): string {
  if (page === 'tac-2023') return '/2023'
  if (page === 'tac-2024') return '/2024'
  return '/'
}

export function buildPageHref(page: Page, search = window.location.search, hash = ''): string {
  const params = new URLSearchParams(search)
  const query = params.toString()
  const path = pagePath(page)
  return `${path}${query ? `?${query}` : ''}${hash}`
}

export function pushPage(page: Page, replace = false) {
  const next = buildPageHref(page, window.location.search)
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method](window.history.state, '', next)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function navigateToPage(
  event: { defaultPrevented: boolean; button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; preventDefault: () => void },
  page: Page,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  event.preventDefault()
  pushPage(page)
}
