import { Activity } from 'lucide-react'

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-panel border border-line bg-white/[0.03]">
        <Activity className="h-4 w-4 text-foreground" strokeWidth={1.7} />
      </span>
      <span className="text-[13px] font-semibold tracking-tight text-foreground">
        AutoPulse Elite
      </span>
    </div>
  )
}

const TOTAL_MARCAS = 60

function GaugeDecoration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 300"
      className="pointer-events-none absolute -right-36 top-1/2 h-[520px] w-[520px] -translate-y-1/2 opacity-[0.12]"
    >
      {Array.from({ length: TOTAL_MARCAS }, (_, indice) => {
        const angulo = 135 + (indice / (TOTAL_MARCAS - 1)) * 270
        const radianes = (angulo * Math.PI) / 180
        const centro = 150
        const radioInterior = 116
        const radioExterior = 128

        return (
          <line
            key={indice}
            x1={centro + radioInterior * Math.cos(radianes)}
            y1={centro + radioInterior * Math.sin(radianes)}
            x2={centro + radioExterior * Math.cos(radianes)}
            y2={centro + radioExterior * Math.sin(radianes)}
            stroke="var(--gauge-filled)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )
      })}
      <defs>
        <radialGradient id="degradadoMarcasLogin">
          <stop offset="35%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="150" r="148" fill="url(#degradadoMarcasLogin)" />
    </svg>
  )
}

export function BrandPanel() {
  return (
    <aside className="relative hidden min-h-[calc(100svh-2rem)] flex-col justify-between overflow-hidden rounded-panel border border-line bg-surface p-8 lg:flex xl:p-10">
      <GaugeDecoration />
      <div className="relative z-10">
        <BrandMark />
      </div>

      <div className="relative z-10 -mt-10 max-w-xl">
        <h1 className="text-[30px] leading-[1.25] font-semibold tracking-tight text-foreground xl:text-[32px]">
          Control total de cada auto,{' '}
          <span className="text-muted">pieza y peso.</span>
        </h1>
      </div>

      <div className="relative z-10 max-w-sm rounded-panel border border-line bg-surface/80 px-4 py-3">
        <p className="text-[11px] font-semibold text-foreground">Novedades</p>
        <p className="mt-1 text-[11px] leading-4 text-muted">
          Pizarro Performance Garage · Ciudad Juárez
        </p>
      </div>
    </aside>
  )
}

export function MobileBrand() {
  return (
    <div className="mb-9 flex justify-center lg:hidden">
      <BrandMark />
    </div>
  )
}
