import axios from 'axios'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { iniciarSesion, obtenerUsuarioActual } from '../services/auth'
import {
  cerrarSesion,
  guardarSesion,
  obtenerToken,
} from '../services/sesion'
import type { UsuarioSesion } from '../types/auth'

interface Props {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(obtenerToken()))

  useEffect(() => {
    const token = obtenerToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    let activo = true
    obtenerUsuarioActual()
      .then((usuarioActual) => {
        if (activo) {
          guardarSesion(token, usuarioActual, true)
          setUsuario(usuarioActual)
        }
      })
      .catch((fallo: unknown) => {
        if (activo) {
          const tokenRechazado =
            axios.isAxiosError(fallo) &&
            (fallo.response?.status === 401 || fallo.response?.status === 403)
          if (tokenRechazado) {
            cerrarSesion()
          } else {
            setSessionError(
              'No se pudo verificar la sesión guardada. Inicia sesión para continuar.',
            )
          }
          setUsuario(null)
        }
      })
      .finally(() => {
        if (activo) {
          setIsLoading(false)
        }
      })

    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(
    async (correo: string, password: string, mantenerSesion: boolean) => {
      const respuesta = await iniciarSesion(correo, password)
      guardarSesion(
        respuesta.access_token,
        respuesta.usuario,
        mantenerSesion,
      )
      setUsuario(respuesta.usuario)
      setSessionError(null)
    },
    [],
  )

  const logout = useCallback(() => {
    cerrarSesion()
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      sessionError,
      isAuthenticated: Boolean(usuario && obtenerToken()),
      isLoading,
      login,
      logout,
    }),
    [usuario, sessionError, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
