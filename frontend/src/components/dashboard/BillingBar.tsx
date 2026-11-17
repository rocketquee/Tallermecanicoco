import { Layers } from 'lucide-react'
import { COBRANZA, type TonoBarra } from '../../lib/mock-dashboard'
import { formatearMoneda } from '../../lib/formato'

const RELLENO: Record<TonoBarra, string> = {
  claro: 'bg-white/80',
  medio: 'bg-white/45',
  oscuro: 'bg-white/20',
}

const PUNTO: Record<TonoBarra, string> = {
  claro: 'bg-white/80',
  medio: 'bg-white/45',
  oscuro: 'bg-white/20',
}

export function BillingBar() {
  return (
    <section
      className="flex flex-col gap-4 px-4 py-4 xl:px-6 xl:py-6"
      aria-label={COBRANZA.etiqueta}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-medium tracking-wide text-muted">
            {COBRANZA.etiqueta}
          </p>
          <p className="mt-1.5 text-[24px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
            {formatearMoneda(COBRANZA.total)}
          </p>
        </div>

        <button
          type="button"
          className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted transition hover:text-foreground"
        >
          <Layers className="h-3.5 w-3.5" strokeWidth={1.7} />
          Administrar pagos
        </button>
      </div>

      <div className="flex items-end gap-2">
        {COBRANZA.segmentos.map((segmento) => (
          <div
            key={segmento.etiqueta}
            className="min-w-0"
            style={{ flex: `${segmento.porcentaje} 1 0%` }}
          >
            <div className="flex h-3 items-center gap-1">
              <span className="h-2 w-px bg-white/30" />
              <span className="text-[11px] leading-none text-faint tabular-nums">
                {segmento.porcentaje}%
              </span>
            </div>
            <div
              className={`mt-1 h-2 w-full rounded-full ${RELLENO[segmento.tono]}`}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {COBRANZA.segmentos.map((segmento) => (
          <span
            key={segmento.etiqueta}
            className="flex items-center gap-1.5 text-[11px] text-muted"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${PUNTO[segmento.tono]}`}
            />
            <span
              className={
                segmento.subrayado
                  ? 'underline decoration-dotted underline-offset-2'
                  : undefined
              }
            >
              {segmento.etiqueta}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
