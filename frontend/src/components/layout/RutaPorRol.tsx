import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import type { RolUsuario } from '../../types/auth'

interface Props {
  /** Roles con permiso para entrar a la ruta. */
  roles: RolUsuario[]
}

/**
 * Protege una ruta por rol, además de la autenticación que ya valida
 * `RutaProtegida`. Si el usuario no tiene permiso se le manda al panel
 * principal en lugar de mostrar una pantalla vacía.
 *
 * Esto es solo la barrera visual: el backend vuelve a validar cada endpoint.
 */
export function RutaPorRol({ roles }: Props) {
  const { usuario, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface text-[12px] text-muted">
        Verificando sesión…
      </div>
    )
  }

  if (!usuario || !roles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
