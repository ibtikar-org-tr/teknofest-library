import { useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/api'
import type { Admin } from '../types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
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
      localStorage.removeItem('admin_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = (token: string) => {
    localStorage.setItem('admin_token', token)
    fetchAdmin()
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
