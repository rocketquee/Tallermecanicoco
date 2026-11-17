import { CLIENTES_ACTIVOS } from '../../lib/mock-dashboard'

export function TickBars() {
  const { total, vip, regulares, porcentajeActivo, alturas } = CLIENTES_ACTIVOS
  const corte = Math.round((porcentajeActivo / 100) * alturas.length)

  return (
    <section
      className="flex flex-col gap-3 px-4 py-4 xl:px-6 xl:py-6"
      aria-label="Clientes activos"
    >
      <div>
        <p className="text-[12px] font-medium tracking-wide text-muted">
          Clientes activos
        </p>
        <p className="mt-1.5 text-[24px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
          {total}
        </p>
      </div>

      <div className="relative pt-5">
        <span
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 text-[11px] font-medium text-foreground tabular-nums"
          style={{ left: `${porcentajeActivo}%` }}
        >
          {porcentajeActivo}%
        </span>

        <div className="relative flex h-7 items-end">
          <span
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-white/35"
            style={{ left: `${porcentajeActivo}%` }}
            aria-hidden="true"
          />
          {alturas.map((altura, indice) => (
            <div
              key={indice}
              className="flex min-w-0 flex-1 items-end justify-center"
            >
              <span
                className={`block w-px rounded-full ${
                  indice < corte ? 'bg-white/75' : 'bg-white/15'
                }`}
                style={{ height: `${altura}px` }}
              />
            </div>
          ))}
        </div>

        <div className="mt-1 h-px w-full bg-white/[0.06]" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-white/75" />
          Regulares
          <span className="text-faint tabular-nums">{regulares}</span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          VIP
          <span className="text-faint tabular-nums">{vip}</span>
        </span>
      </div>
    </section>
  )
}
