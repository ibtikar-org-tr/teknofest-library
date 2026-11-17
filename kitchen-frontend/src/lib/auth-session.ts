const TOKEN_KEY = 'kitchen_token'
const SESSION_KEY = 'kitchen_session'
const LEGACY_TOKEN_KEY = 'admin_token'

export type KitchenSessionUser = {
  membershipNumber: string
  email: string
  role: string
}

export type KitchenSession = {
  user: KitchenSessionUser
  /** Can manage kitchens for at least one VMS event (event creator/admin/project manager). */
  is_staff: boolean
  is_event_manager: boolean
  is_superadmin: boolean
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    window.localStorage.getItem(TOKEN_KEY)?.trim() ||
    window.localStorage.getItem(LEGACY_TOKEN_KEY)?.trim() ||
    null
  )
}

export function getSession(): KitchenSession | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as KitchenSession
    if (!parsed?.user?.membershipNumber || !parsed?.user?.email) return null
    return parsed
  } catch {
    return null
  }
}

export function setSession(token: string, session: KitchenSession) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(SESSION_KEY)
  window.localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken())
}

export function isStaffSession(): boolean {
  const session = getSession()
  return Boolean(session?.is_event_manager || session?.is_staff)
}

export function isEventManagerSession(): boolean {
  return isStaffSession()
}
