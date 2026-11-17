import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings,
  SlidersHorizontal,
} from 'lucide-react'
import { FECHA_REFERENCIA, PERIODO } from '../../lib/mock-dashboard'
import { formatearFechaSinAnio } from '../../lib/formato'
import { etiquetaRol } from '../../lib/roles'
import { useAuth } from '../../context/useAuth'

const PERIODOS = ['Últimos 7 días', 'Últimos 30 días', 'Últimos 90 días']

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

interface Props {
  onAbrirMenu?: () => void
}

const ESTILO_BOTON =
  'flex h-10 items-center gap-1.5 rounded-panel border border-line px-3 text-[12px] font-medium text-muted transition outline-none select-none hover:border-line-strong hover:text-foreground focus-visible:border-line-strong xl:h-9'

export function DashboardHeader({ onAbrirMenu }: Props) {
  const navegar = useNavigate()
  const { usuario, logout } = useAuth()
  const [periodo, setPeriodo] = useState(PERIODO)
  const [desde, setDesde] = useState('2026-10-17')
  const [hasta, setHasta] = useState(FECHA_REFERENCIA)

  const anio = new Date(`${hasta}T12:00:00Z`).getUTCFullYear()
  const rango = `${formatearFechaSinAnio(desde)} - ${formatearFechaSinAnio(hasta)} ${anio}`

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

        <h1 className="truncate text-[20px] font-semibold tracking-tight text-foreground xl:text-[22px]">
          {obtenerSaludo()}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            aria-label="Periodo"
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value)}
            className={`${ESTILO_BOTON} appearance-none pr-8 pl-3`}
          >
            {PERIODOS.map((opcion) => (
              <option key={opcion} value={opcion} className="bg-panel">
                {opcion}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
        </div>

        <details className="relative">
          <summary className={`${ESTILO_BOTON} cursor-pointer`}>
            <CalendarDays className="h-3.5 w-3.5 text-faint" />
            <span className="tabular-nums">{rango}</span>
          </summary>
          <div className="absolute right-0 z-30 mt-1.5 w-[min(17rem,calc(100vw-2rem))] rounded-panel border border-line bg-panel p-3">
            <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
              Rango de fechas
            </p>
            <label className="mt-2 block text-[10px] text-faint">
              Desde
              <input
                type="date"
                value={desde}
                onChange={(evento) => setDesde(evento.target.value)}
                className="mt-1 h-9 w-full rounded-panel border border-line bg-transparent px-2 text-[12px] text-foreground outline-none focus:border-line-strong"
              />
            </label>
            <label className="mt-2 block text-[10px] text-faint">
              Hasta
              <input
                type="date"
                value={hasta}
                onChange={(evento) => setHasta(evento.target.value)}
                className="mt-1 h-9 w-full rounded-panel border border-line bg-transparent px-2 text-[12px] text-foreground outline-none focus:border-line-strong"
              />
            </label>
          </div>
        </details>

        <button type="button" className={ESTILO_BOTON}>
          <SlidersHorizontal className="h-3.5 w-3.5 text-faint" />
          Personalizar
        </button>

        <details className="relative">
          <summary
            aria-label="Más opciones"
            className={`${ESTILO_BOTON} w-10 cursor-pointer justify-center xl:w-9`}
          >
            <MoreHorizontal className="h-4 w-4" />
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
            <Link
              to="/configuracion"
              className="flex min-h-10 items-center gap-2 rounded-panel px-2 text-[12px] text-muted transition hover:bg-white/[0.04] hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              Configuración
            </Link>
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
