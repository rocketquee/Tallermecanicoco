import type { KpiDashboard } from '../../lib/mock-dashboard'
import { TrendBadge } from './TrendBadge'

interface Props {
  kpi: KpiDashboard
}

export function KpiCard({ kpi }: Props) {
  return (
    <div className="flex min-w-0 flex-col px-4 py-4 xl:px-6 xl:py-6">
      <p className="truncate text-[12px] font-medium tracking-wide text-muted">
        {kpi.etiqueta}
      </p>

      <p className="mt-2 text-[24px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
        {kpi.valor}
      </p>

      <div className="mt-4">
        <TrendBadge
          valor={kpi.variacion}
          tendencia={kpi.tendencia}
          sufijo="vs. 30 días previos"
        />
      </div>
    </div>
  )
}
