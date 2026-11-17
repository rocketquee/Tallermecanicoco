import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ETIQUETAS_EJE_X,
  FACTURACION,
  PUNTOS_FACTURACION,
} from '../../lib/mock-dashboard'
import { formatearCompacto, formatearDiaMes } from '../../lib/formato'
import { TrendBadge } from './TrendBadge'

interface PropsTooltip {
  active?: boolean
  payload?: Array<{ value?: number | string }>
  label?: string | number
}

function TooltipFacturacion({ active, payload, label }: PropsTooltip) {
  if (!active || !payload?.length) {
    return null
  }

  const valor = Number(payload[0].value ?? 0)

  return (
    <div className="rounded-panel border border-line bg-panel px-3 py-2">
      <p className="text-[10px] text-muted">
        {typeof label === 'string' ? label : ''}
      </p>
      <p className="mt-0.5 text-[12px] font-semibold text-foreground tabular-nums">
        {formatearCompacto(valor)} MXN
      </p>
    </div>
  )
}

export function AreaRevenueChart() {
  return (
    <section
      className="border-b border-line px-4 pt-4 pb-3 xl:px-6 xl:pt-6 xl:pb-5"
      aria-label={FACTURACION.etiqueta}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[24px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
            {FACTURACION.totalCompacto}
          </p>
          <p className="mt-1.5 text-[12px] text-muted">{FACTURACION.etiqueta}</p>
        </div>

        <TrendBadge
          valor={FACTURACION.cambio}
          sufijo="en los últimos 30 días"
          colorSufijo="verde"
        />
      </div>

      <div className="mt-5 h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={PUNTOS_FACTURACION}
            margin={{ top: 8, right: 30, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient
                id="degradadoFacturacion"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              stroke="var(--chart-grid)"
            />

            <XAxis
              dataKey="etiqueta"
              ticks={ETIQUETAS_EJE_X}
              tickLine={false}
              axisLine={false}
              interval={0}
              padding={{ left: 0, right: 0 }}
              tickMargin={9}
              tick={{ fill: '#737373', fontSize: 10 }}
            />

            <YAxis
              domain={[0, 2_000_000]}
              ticks={[0, 400_000, 800_000, 1_200_000, 1_600_000, 2_000_000]}
              tickLine={false}
              axisLine={false}
              width={46}
              tickMargin={6}
              tickFormatter={(valor: number) =>
                valor === 0 ? '$0' : formatearCompacto(valor)
              }
              tick={{ fill: '#737373', fontSize: 10 }}
            />

            <Tooltip
              content={<TooltipFacturacion />}
              cursor={{ stroke: 'rgba(255,255,255,0.14)', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="monto"
              stroke="var(--chart-line)"
              strokeWidth={1.5}
              fill="url(#degradadoFacturacion)"
              activeDot={{ r: 3, fill: '#f5f5f5', stroke: '#0a0a0a' }}
              dot={false}
              isAnimationActive={false}
              name="Facturación"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="sr-only">
        Del {formatearDiaMes(PUNTOS_FACTURACION[0].fecha)} al{' '}
        {formatearDiaMes(
          PUNTOS_FACTURACION[PUNTOS_FACTURACION.length - 1].fecha,
        )}
        .
      </p>
    </section>
  )
}
