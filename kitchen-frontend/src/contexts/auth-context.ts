import { createContext } from 'react'
import type { Admin } from '../types'

export interface AuthContextType {
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
