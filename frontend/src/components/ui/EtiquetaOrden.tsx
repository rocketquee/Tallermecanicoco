import type { EstadoOrden } from '../../types/ordenes'

const ESTILOS: Record<EstadoOrden, string> = {
  Recibido: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  Diagnostico: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  Reparacion: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Listo: 'border-positive/30 bg-positive/10 text-positive',
  Entregado: 'border-line-strong bg-white/[0.06] text-muted',
  Cancelado: 'border-negative/30 bg-negative/10 text-negative',
}

const ETIQUETAS: Record<EstadoOrden, string> = {
  Recibido: 'Recibido',
  Diagnostico: 'Diagnóstico',
  Reparacion: 'Reparación',
  Listo: 'Listo',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
}

/** Badge de color por etapa de la orden. */
export function EtiquetaOrden({ estado }: { estado: EstadoOrden }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${ESTILOS[estado]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ETIQUETAS[estado]}
    </span>
  )
}
