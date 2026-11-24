import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Cog,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { NOMBRE_TALLER } from '../../lib/taller'
import { etiquetaRol } from '../../lib/roles'
import { useAuth } from '../../context/useAuth'

const ESTILO_BOTON =
  'flex h-10 items-center gap-1.5 rounded-panel border border-line px-3 text-[12px] font-medium text-muted transition outline-none select-none hover:border-line-strong hover:text-foreground focus-visible:border-line-strong xl:h-9'

function obtenerSaludo(): string {
  const hora = new Date().getHours()
  if (hora < 12) {
    return 'Buenos días'
  }
  if (hora < 19) {
    return 'Buenas tardes'
  }
  return 'Buenas noches'
}

function fechaDeHoy(): string {
  const texto = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

interface Props {
  onAbrirMenu?: () => void
  /** Vuelve a pedir los datos del tablero. */
  onActualizar?: () => void
  actualizando?: boolean
}

/**
 * Encabezado del panel: saludo, fecha real y acciones que sí existen
 * (actualizar, configuración y cerrar sesión). Antes tenía filtros de
 * periodo y un botón "Personalizar" que no hacían nada.
 */
export function DashboardHeader({
  onAbrirMenu,
  onActualizar,
  actualizando = false,
}: Props) {
  const navegar = useNavigate()
  const { usuario, logout } = useAuth()
  const esAdministrador = usuario?.rol === 'Administrador'

  function salir() {
    logout()
    navegar('/login', { replace: true })
  }

  return (
    <header className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between xl:px-6 xl:py-5">
      <div className="flex min-w-0 items-center gap-2">
        {onAbrirMenu ? (
          <button
            type="button"
            onClick={onAbrirMenu}
            aria-label="Abrir menú"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel border border-line text-muted transition hover:text-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-panel border border-line bg-white/[0.03] sm:flex"
            >
              <Cog
                className="engranaje-lento h-4 w-4 text-faint"
                strokeWidth={1.6}
              />
            </span>
            <h1 className="truncate text-[20px] font-semibold tracking-tight text-foreground xl:text-[22px]">
              {obtenerSaludo()}, {usuario?.nombre?.split(' ')[0] ?? 'Usuario'}
            </h1>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-faint">
            {fechaDeHoy()} · {NOMBRE_TALLER}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onActualizar ? (
          <button
            type="button"
            onClick={onActualizar}
            disabled={actualizando}
            className={`${ESTILO_BOTON} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-faint ${
                actualizando ? 'animate-spin' : ''
              }`}
            />
            {actualizando ? 'Actualizando…' : 'Actualizar'}
          </button>
        ) : null}

        <details className="relative">
          <summary
            aria-label="Menú de la cuenta"
            className={`${ESTILO_BOTON} w-10 cursor-pointer justify-center xl:w-9`}
          >
            <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="absolute right-0 z-30 mt-1.5 w-60 rounded-panel border border-line bg-panel p-1.5">
            <div className="px-2 py-2">
              <p className="truncate text-[12px] font-medium text-foreground">
                {usuario?.nombre ?? 'Usuario'}
              </p>
              <p className="truncate text-[10px] text-faint">
                {usuario?.correo ?? 'Sin correo'} · {etiquetaRol(usuario?.rol)}
              </p>
            </div>
            <div className="my-1 h-px bg-white/10" />

            {esAdministrador ? (
              <Link
                to="/configuracion"
                className="flex min-h-10 items-center gap-2 rounded-panel px-2 text-[12px] text-muted transition hover:bg-white/[0.04] hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
                Configuración
              </Link>
            ) : null}

            <button
              type="button"
              onClick={salir}
              className="flex min-h-10 w-full items-center gap-2 rounded-panel px-2 text-left text-[12px] text-muted transition hover:bg-white/[0.04] hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>
        </details>
      </div>
    </header>
  )
}
