import { ArrowRight, Wallet } from 'lucide-react'
import { CUSTODIA, type TonoBarra } from '../../lib/mock-dashboard'
import { formatearMoneda } from '../../lib/formato'

const PUNTO: Record<TonoBarra, string> = {
  claro: 'bg-white/80',
  medio: 'bg-white/45',
  oscuro: 'bg-white/20',
}

const TOTAL_MARCAS = 60
const CENTRO = 150
const RADIO_INTERIOR = 116
const RADIO_EXTERIOR = 128
const ANGULO_INICIAL = 135
const BARRIDO = 270

export function RadialGauge() {
  const marcasLlenas = Math.round((CUSTODIA.porcentaje / 100) * TOTAL_MARCAS)

  return (
    <section
      className="flex flex-col items-center px-4 py-5 xl:px-6"
      aria-label="Valor total en custodia"
    >
      <div className="relative h-[268px] w-[268px] 2xl:h-[288px] 2xl:w-[288px]">
        <svg
          viewBox="0 0 300 300"
          className="h-full w-full"
          role="img"
          aria-label={`${CUSTODIA.porcentaje}% del valor total en custodia`}
        >
          {Array.from({ length: TOTAL_MARCAS }, (_, indice) => {
            const angulo =
              ANGULO_INICIAL + (indice / (TOTAL_MARCAS - 1)) * BARRIDO
            const radianes = (angulo * Math.PI) / 180
            const x1 = CENTRO + RADIO_INTERIOR * Math.cos(radianes)
            const y1 = CENTRO + RADIO_INTERIOR * Math.sin(radianes)
            const x2 = CENTRO + RADIO_EXTERIOR * Math.cos(radianes)
            const y2 = CENTRO + RADIO_EXTERIOR * Math.sin(radianes)

            return (
              <line
                key={indice}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={
                  indice < marcasLlenas
                    ? 'var(--gauge-filled)'
                    : 'var(--gauge-empty)'
                }
                strokeWidth={5}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/[0.04]">
            <Wallet className="h-4 w-4 text-muted" strokeWidth={1.7} />
          </span>
          <p className="mt-3 text-[11px] text-muted">Valor total en custodia</p>
          <p className="mt-1 text-[17px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
            {formatearMoneda(CUSTODIA.total)}
          </p>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-4">
        {CUSTODIA.leyendas.map((leyenda) => (
          <span
            key={leyenda.etiqueta}
            className="flex items-center gap-1.5 text-[11px] text-muted"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${PUNTO[leyenda.tono]}`}
            />
            {leyenda.etiqueta}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-panel bg-white/[0.06] text-[12px] font-medium text-foreground transition hover:bg-white/[0.09]"
      >
        Ver detalle
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  )
}
