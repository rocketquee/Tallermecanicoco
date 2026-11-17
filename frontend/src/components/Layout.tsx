import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Menu } from 'lucide-react'
import { Sidebar } from './dashboard/Sidebar'
import { useAuth } from '../context/useAuth'

const CLAVE_COLAPSADO = 'autopulse-sidebar-colapsado'

export function Layout() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const { logout } = useAuth()
  const [colapsado, setColapsado] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.localStorage.getItem(CLAVE_COLAPSADO) === '1'
  })
  const [movilAbierto, setMovilAbierto] = useState(false)

  const esDashboard = ubicacion.pathname === '/dashboard'

  useEffect(() => {
    setMovilAbierto(false)
  }, [ubicacion.pathname])

  useEffect(() => {
    window.localStorage.setItem(CLAVE_COLAPSADO, colapsado ? '1' : '0')
  }, [colapsado])

  useEffect(() => {
    if (!movilAbierto) {
      return
    }

    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflowPrevio
    }
  }, [movilAbierto])

  function salir() {
    logout()
    navegar('/login', { replace: true })
  }

  function abrirMenu() {
    setMovilAbierto(true)
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <Sidebar
        colapsado={colapsado}
        movilAbierto={movilAbierto}
        onAlternar={() => setColapsado((valor) => !valor)}
        onCerrarMovil={() => setMovilAbierto(false)}
        onSalir={salir}
      />

      {movilAbierto ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMovilAbierto(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-out ${
          colapsado
            ? 'lg:pl-[var(--shell-offset-collapsed)]'
            : 'lg:pl-[var(--shell-offset)]'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-panel border border-line bg-white/[0.03]">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <span className="text-[12px] font-semibold tracking-tight">
              AutoPulse Elite
            </span>
          </div>

          <button
            type="button"
            onClick={abrirMenu}
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-panel border border-line text-muted transition hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <main
          className={
            esDashboard
              ? 'min-w-0 flex-1 bg-surface'
              : 'min-w-0 flex-1 bg-surface px-4 py-6 sm:px-6 lg:px-8'
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
