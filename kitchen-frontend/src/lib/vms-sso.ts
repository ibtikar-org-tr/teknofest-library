const DEFAULT_VMS_LOGIN = 'https://vms.ibtikar.tr/login'

export function getVmsLoginUrl(): string {
  return (import.meta.env.VITE_VMS_LOGIN_URL as string | undefined)?.trim() || DEFAULT_VMS_LOGIN
}

export function getKitchenAuthCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return '/auth/callback'
  }
  return `${window.location.origin}/auth/callback`
}

/** Build VMS login URL that returns to Kitchen after successful auth. */
export function buildVmsSsoLoginUrl(callbackUrl = getKitchenAuthCallbackUrl()): string {
  const login = new URL(getVmsLoginUrl())
  login.searchParams.set('client', 'kitchen')
  login.searchParams.set('redirect_uri', callbackUrl)
  return login.toString()
}

export function startVmsSsoLogin(): void {
  window.location.assign(buildVmsSsoLoginUrl())
}
