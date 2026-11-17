import { createContext } from 'react'
import type { UsuarioSesion } from '../types/auth'

export interface AuthContextValue {
  usuario: UsuarioSesion | null
  sessionError: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (
    correo: string,
    password: string,
    mantenerSesion: boolean,
  ) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
