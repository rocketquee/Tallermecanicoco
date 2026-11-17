import { ArrowRight } from 'lucide-react'
import { FECHA_REFERENCIA, POLIZA } from '../../lib/mock-dashboard'
import {
  estadoPoliza,
  formatearFechaCorta,
  type EstadoPoliza,
} from '../../lib/formato'

const ESTILO_ESTADO: Record<EstadoPoliza, string> = {
  Vigente: 'border-positive/25 bg-positive/10 text-positive',
  'Por vencer': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Vencida: 'border-negative/30 bg-negative/10 text-negative',
}

export function PolicyCard() {
  const estado = estadoPoliza(POLIZA.fechaVencimiento, FECHA_REFERENCIA)

  const filas = [
    { clave: 'Fecha', valor: formatearFechaCorta(POLIZA.fechaVencimiento) },
    { clave: 'Aseguradora', valor: POLIZA.aseguradora },
    { clave: 'Póliza', valor: POLIZA.numero },
  ]

  return (
    <section
      className="flex flex-col gap-4 px-4 py-4 xl:px-6 xl:py-6"
      aria-label="Próxima póliza por vencer"
    >
      <h2 className="text-[12px] font-semibold tracking-wide text-foreground">
        Próxima póliza por vencer
      </h2>

      <dl className="flex flex-col gap-2.5">
        {filas.map((fila) => (
          <div
            key={fila.clave}
            className="flex items-center justify-between gap-2"
          >
            <dt className="text-[11px] text-muted">{fila.clave}</dt>
            <dd className="truncate text-[12px] font-medium text-foreground tabular-nums">
              {fila.valor}
            </dd>
          </div>
        ))}

        <div className="flex items-center justify-between gap-2">
          <dt className="text-[11px] text-muted">Estado</dt>
          <dd>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${ESTILO_ESTADO[estado]}`}
            >
              {estado}
            </span>
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-panel bg-white/[0.06] text-[12px] font-medium text-foreground transition hover:bg-white/[0.09]"
      >
        Ver detalles
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  )
}
