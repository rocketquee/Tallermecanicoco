import { NavLink } from 'react-router-dom'
import { Activity, LogOut, PanelLeft, X } from 'lucide-react'
import { navegacionParaRol } from '../../lib/navegacion-dashboard'
import { NOMBRE_TALLER } from '../../lib/taller'
import { etiquetaRol } from '../../lib/roles'
import { useAuth } from '../../context/useAuth'

interface Props {
  colapsado: boolean
  movilAbierto: boolean
  onAlternar: () => void
  onCerrarMovil: () => void
  onSalir: () => void
}

export function Sidebar({
  colapsado,
  movilAbierto,
  onAlternar,
  onCerrarMovil,
  onSalir,
}: Props) {
  const { usuario } = useAuth()
  const navegacion = navegacionParaRol(usuario?.rol)
  const nombre = usuario?.nombre ?? 'Usuario'
  const iniciales = nombre
    .split(' ')
    .map((parte) => parte[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-line bg-surface transition-[width,transform] duration-200 ease-out lg:translate-x-0 lg:border-r-0 ${
        movilAbierto ? 'translate-x-0' : '-translate-x-full'
      } ${
        colapsado
          ? 'lg:w-[var(--sidebar-collapsed)]'
          : 'lg:w-[var(--sidebar-width)]'
      }`}
    >
      {/* Marca y control para colapsar. */}
      <div
        className={`flex h-12 shrink-0 items-center gap-1 border-b border-line px-2 ${
          colapsado ? 'lg:justify-center' : ''
        }`}
      >
        <div
          className={`flex min-w-0 flex-1 items-center gap-1.5 ${
            colapsado ? 'lg:hidden' : ''
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-panel border border-line bg-white/[0.03]">
            <Activity className="h-3 w-3 text-foreground" />
          </span>
          <span className="truncate text-[10.5px] font-semibold tracking-tight text-foreground">
            AutoPulse Elite
          </span>
        </div>

        <button
          type="button"
          onClick={onAlternar}
          aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground lg:flex"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onCerrarMovil}
          aria-label="Cerrar menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Identidad del taller (solo lectura: no hay multi-sucursal). */}
      <div
        className={`mx-2 mt-3 flex min-h-12 items-center gap-1.5 rounded-panel border border-line px-1.5 py-1.5 ${
          colapsado ? 'lg:justify-center lg:px-0' : ''
        }`}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-[8px] font-bold text-slate-950">
          PP
        </span>
        <span
          className={`min-w-0 flex-1 text-[8.5px] leading-[1.15] font-medium text-foreground ${
            colapsado ? 'lg:hidden' : ''
          }`}
        >
          {NOMBRE_TALLER}
        </span>
      </div>

      <p
        className={`px-3 pt-4 pb-1 text-[9px] font-medium tracking-[0.16em] text-faint uppercase ${
          colapsado ? 'lg:hidden' : ''
        }`}
      >
        Plataforma
      </p>

      <nav
        aria-label="Navegación principal"
        className="flex-1 overflow-y-auto px-2 pb-3"
      >
        <div className="space-y-0.5">
          {navegacion.map(({ etiqueta, ruta, icono: Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/dashboard'}
              onClick={onCerrarMovil}
              title={etiqueta}
              className={({ isActive }) =>
                `group flex min-h-11 items-center gap-1.5 rounded-panel px-2 py-1.5 text-[10px] font-medium tracking-tight no-underline transition xl:min-h-8 ${
                  colapsado ? 'lg:justify-center lg:px-0' : ''
                } ${
                  isActive
                    ? 'bg-white/[0.07] text-foreground'
                    : 'text-muted hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icono
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive
                        ? 'text-foreground'
                        : 'text-faint group-hover:text-muted'
                    }`}
                  />
                  <span
                    className={`min-w-0 truncate ${
                      colapsado ? 'lg:hidden' : ''
                    }`}
                  >
                    {etiqueta}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-line p-2">
        <div
          className={`flex items-center gap-2 rounded-panel px-1 py-1.5 ${
            colapsado ? 'lg:justify-center' : ''
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04] text-[9px] font-semibold text-foreground">
            {iniciales || 'AP'}
          </span>
          <div className={`min-w-0 flex-1 ${colapsado ? 'lg:hidden' : ''}`}>
            <p className="truncate text-[9.5px] font-medium text-foreground">
              {nombre}
            </p>
            <p className="truncate text-[9px] text-faint">
              {etiquetaRol(usuario?.rol)}
            </p>
          </div>
          <button
            type="button"
            onClick={onSalir}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground ${
              colapsado ? 'lg:hidden' : ''
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
