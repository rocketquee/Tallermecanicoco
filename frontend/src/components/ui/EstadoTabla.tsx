import type { ReactNode } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'
import { CargadorTaller } from './CargadorTaller'
import { clasesBoton } from './estilosBoton'

interface Props {
  cargando: boolean
  error: string | null
  vacio: boolean
  tituloVacio: string
  detalleVacio?: string
  onReintentar?: () => void
  children: ReactNode
  filasEsqueleto?: number
}

/**
 * Estados compartidos de una tabla: carga, error, sin resultados o contenido.
 * Mantiene el mismo alto y los mismos tokens en las tres vistas.
 */
export function EstadoTabla({
  cargando,
  error,
  vacio,
  tituloVacio,
  detalleVacio,
  onReintentar,
  children,
  filasEsqueleto = 5,
}: Props) {
  if (cargando) {
    return (
      <div aria-busy="true">
        <CargadorTaller
          etiqueta="Cargando datos…"
          className="border-b border-line"
        />
        <div className="divide-y divide-line">
          {Array.from({ length: filasEsqueleto }, (_, fila) => (
            <div
              key={fila}
              className="flex animate-pulse items-center gap-5 px-4 py-4 sm:px-5"
            >
              <div className="h-3.5 w-24 rounded bg-white/[0.06]" />
              <div className="hidden h-3.5 w-40 rounded bg-white/[0.06] sm:block" />
              <div className="ml-auto h-7 w-24 rounded-full bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-negative" />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              No se pudieron cargar los datos
            </p>
            <p className="mt-1 text-[12px] leading-5 text-muted">{error}</p>
          </div>
        </div>
        {onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className={clasesBoton('secundario', 'px-3 py-2 text-xs')}
          >
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (vacio) {
    return (
      <div className="px-6 py-14 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-panel border border-line bg-white/[0.03]">
          <Inbox className="h-4 w-4 text-faint" strokeWidth={1.7} />
        </span>
        <h3 className="mt-4 text-[14px] font-semibold text-foreground">
          {tituloVacio}
        </h3>
        {detalleVacio && (
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-muted">
            {detalleVacio}
          </p>
        )}
      </div>
    )
  }

  return <>{children}</>
}
