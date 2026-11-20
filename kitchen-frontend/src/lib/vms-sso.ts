const DEFAULT_VMS_LOGIN = 'https://vms.ibtikar.tr/login'

export function getVmsLoginUrl(): string {
  return (import.meta.env.VITE_VMS_LOGIN_URL as string | undefined)?.trim() || DEFAULT_VMS_LOGIN
}

/** VMS member profile page — edit skills/interests there, not in Kitchen. */
export function getVmsProfileUrl(): string {
  const login = new URL(getVmsLoginUrl())
  login.pathname = '/profile'
  login.search = ''
  login.hash = ''
  return login.toString()
}

export function getKitchenAuthCallbackUrl(nextPath = '/'): string {
  if (typeof window === 'undefined') {
    return '/auth/callback'
  }
  const url = new URL('/auth/callback', window.location.origin)
  const next = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/'
  url.searchParams.set('next', next)
  return url.toString()
}

/** Build VMS login URL that returns to Kitchen after successful auth. */
export function buildVmsSsoLoginUrl(nextPath?: string): string {
  const login = new URL(getVmsLoginUrl())
  login.searchParams.set('client', 'kitchen')
  login.searchParams.set('redirect_uri', getKitchenAuthCallbackUrl(nextPath))
  return login.toString()
}

export function startVmsSsoLogin(nextPath?: string): void {
  window.location.assign(buildVmsSsoLoginUrl(nextPath))
}
