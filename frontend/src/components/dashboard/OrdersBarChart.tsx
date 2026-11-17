import { ORDENES_RESUMEN, PUNTOS_ORDENES } from '../../lib/mock-dashboard'
import { TrendBadge } from './TrendBadge'

/** Etiquetas cada 5 días, incluida la fecha final del periodo. */
const INDICES_ETIQUETAS = new Set([0, 5, 10, 15, 20, 25, 29])

function ticksEscala(maximo: number): number[] {
  if (maximo <= 5) {
    return Array.from({ length: maximo + 1 }, (_, indice) => indice)
  }
  const paso = Math.ceil(maximo / 4 / 25) * 25
  return [0, paso, paso * 2, paso * 3, paso * 4]
}

export function OrdersBarChart() {
  const maximo = Math.max(...PUNTOS_ORDENES.map((punto) => punto.ordenes), 1)
  const ticks = ticksEscala(maximo)
  const topeEscala = ticks[ticks.length - 1]

  return (
    <section
      className="flex flex-1 flex-col px-4 py-4 xl:px-6 xl:py-6"
      aria-label="Órdenes en los últimos 30 días"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[24px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
            {ORDENES_RESUMEN.total}
          </p>
          <p className="mt-1.5 text-[12px] text-muted">
            Órdenes en los últimos 30 días
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <p className="text-[11px] text-muted">
            Pico:{' '}
            <span className="font-medium text-foreground tabular-nums">
              {ORDENES_RESUMEN.pico} el {ORDENES_RESUMEN.picoFecha}
            </span>
          </p>
          <TrendBadge
            valor={ORDENES_RESUMEN.cambio}
            sufijo="en los últimos 30 días"
            colorSufijo="verde"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex min-h-[210px] flex-1 gap-2">
          <div
            className="flex w-4 shrink-0 flex-col justify-between text-right text-[10px] text-faint tabular-nums"
            aria-hidden="true"
          >
            {[...ticks].reverse().map((tick) => (
              <span key={tick} className="leading-none">
                {tick}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            <div
              className="pointer-events-none absolute inset-0 flex flex-col justify-between"
              aria-hidden="true"
            >
              {[...ticks].reverse().map((tick) => (
                <span
                  key={tick}
                  className="block w-full border-t border-dashed border-white/[0.07]"
                />
              ))}
            </div>

            <div className="absolute inset-0 flex items-end">
              {PUNTOS_ORDENES.map((punto, indice) => {
                const altura = Math.max(
                  (punto.ordenes / topeEscala) * 100,
                  punto.ordenes > 0 ? 3 : 1.5,
                )
                const esPico = indice === ORDENES_RESUMEN.picoIndice

                return (
                  <div
                    key={punto.fecha}
                    className="group relative flex h-full min-w-0 flex-1 items-end justify-center"
                    title={`${punto.etiqueta}: ${punto.ordenes} órdenes`}
                  >
                    {esPico ? (
                      <span
                        className="pointer-events-none absolute inset-x-0 text-center text-[9px] leading-none font-medium whitespace-nowrap text-foreground"
                        style={{ bottom: `calc(${altura}% + 6px)` }}
                      >
                        {punto.etiqueta}
                      </span>
                    ) : null}
                    <div
                      className={`w-[38%] min-w-[3px] max-w-[13px] rounded-t-[3px] ${
                        esPico
                          ? 'bg-gradient-to-t from-white/30 to-white/80'
                          : 'bg-gradient-to-t from-white/[0.04] to-white/[0.42]'
                      }`}
                      style={{ height: `${altura}%` }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-2 pl-6 text-[10px] text-faint">
          <div className="relative h-3">
            {PUNTOS_ORDENES.map((punto, indice) => {
              if (!INDICES_ETIQUETAS.has(indice)) {
                return null
              }

              const esUltimo = indice === PUNTOS_ORDENES.length - 1

              return (
                <span
                  key={punto.fecha}
                  className="absolute top-0 whitespace-nowrap"
                  style={{
                    left: esUltimo
                      ? '100%'
                      : `${((indice + 0.5) / PUNTOS_ORDENES.length) * 100}%`,
                    transform: esUltimo ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                >
                  {punto.etiqueta}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
