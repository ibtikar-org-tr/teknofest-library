import { useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/api'
import type { Admin } from '../types'
import { AuthContext } from './auth-context'
import { clearSession, getAccessToken, getSession, isStaffSession } from '../lib/auth-session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    if (token && isStaffSession()) {
      fetchAdmin()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchAdmin = async () => {
    try {
      const data = await authService.getCurrentAdmin()
      setAdmin(data)
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }

  const login = (_token: string) => {
    // Session is established via VMS SSO callback (setSession).
    if (isStaffSession()) {
      fetchAdmin()
    }
  }

  const logout = () => {
    clearSession()
    setAdmin(null)
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: Boolean(getAccessToken() || getSession()),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
