import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { Tendencia } from '../../lib/mock-dashboard'

interface Props {
  /** Variación porcentual; el signo se resuelve con `tendencia` o con el valor. */
  valor: number
  tendencia?: Tendencia
  sufijo?: string
  /** En las gráficas el sufijo también va en verde, como en la referencia. */
  colorSufijo?: 'verde' | 'muted'
}

/**
 * Insignia circular + porcentaje usada por los KPI y las gráficas.
 * El círculo es sólido (verde o rojo) para replicar la referencia.
 */
export function TrendBadge({
  valor,
  tendencia,
  sufijo,
  colorSufijo = 'muted',
}: Props) {
  const sube = tendencia ? tendencia === 'sube' : valor >= 0
  const Icono = sube ? ArrowUpRight : ArrowDownRight

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] leading-none whitespace-nowrap">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          sube ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      >
        <Icono className="h-2.5 w-2.5 text-white" strokeWidth={3} />
      </span>
      <span className={sube ? 'text-positive' : 'text-negative'}>
        {Math.abs(valor).toFixed(1)}%
      </span>
      {sufijo ? (
        <span className={colorSufijo === 'verde' && sube ? 'text-positive' : 'text-muted'}>
          {sufijo}
        </span>
      ) : null}
    </span>
  )
}
