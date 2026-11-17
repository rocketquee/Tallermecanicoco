import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/**
 * Envuelve las rutas privadas. Si no hay token, manda a /login recordando
 * la ruta original para volver despues de iniciar sesion.
 */
export function RutaProtegida() {
  const ubicacion = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-surface text-[12px] text-muted">
        Verificando sesión…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${ubicacion.pathname}${ubicacion.search}` }}
      />
    )
  }

  return <Outlet />
}
