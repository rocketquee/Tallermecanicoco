import { useOutletContext } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { KpiCard } from '../components/dashboard/KpiCard'
import { AreaRevenueChart } from '../components/dashboard/AreaRevenueChart'
import { AiInsights } from '../components/dashboard/AiInsights'
import { BillingBar } from '../components/dashboard/BillingBar'
import { OrdersBarChart } from '../components/dashboard/OrdersBarChart'
import { RadialGauge } from '../components/dashboard/RadialGauge'
import { TickBars } from '../components/dashboard/TickBars'
import { PolicyCard } from '../components/dashboard/PolicyCard'
import { AttentionList } from '../components/dashboard/AttentionList'
import { ATENCION, KPIS } from '../lib/mock-dashboard'
import { useAuth } from '../context/useAuth'

interface ContextoLayout {
  abrirMenu?: () => void
}

export function Dashboard() {
  const contexto = useOutletContext<ContextoLayout | null>()
  const { usuario } = useAuth()
  const rol = usuario?.rol ?? 'Recepcion'
  const esAdministrador = rol === 'Administrador'
  const esMecanico = rol === 'Mecanico'
  const kpis = esAdministrador
    ? KPIS
    : KPIS.filter((kpi) => kpi.id !== 'promedio')
  const alertas = esMecanico
    ? ATENCION.filter((item) =>
        ['detenidos', 'piezas', 'consumibles'].includes(item.id),
      )
    : ATENCION

  return (
    <div className="flex min-h-full flex-col border-line bg-surface lg:rounded-tl-panel lg:border-t lg:border-l">
      {/* El encabezado ocupa todo el ancho, incluido el panel derecho. */}
      <DashboardHeader onAbrirMenu={contexto?.abrirMenu} />

      <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <section
            aria-label="Indicadores del periodo"
            className={`grid grid-cols-1 divide-y divide-line border-b border-line ${
              esAdministrador ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            } sm:divide-x sm:divide-y-0`}
          >
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </section>

          {esAdministrador ? <AreaRevenueChart /> : null}

          <div
            className={`grid grid-cols-1 divide-y divide-line border-b border-line sm:min-h-[248px] ${
              esAdministrador ? 'sm:grid-cols-2 sm:divide-x sm:divide-y-0' : ''
            }`}
          >
            <AiInsights />
            {esAdministrador ? <BillingBar /> : null}
          </div>

          <OrdersBarChart />
        </div>

        <aside
          aria-label="Resumen operativo y financiero"
          className="w-full divide-y divide-line border-t border-line xl:w-[var(--panel-width)] xl:shrink-0 xl:border-t-0 xl:border-l 2xl:w-[var(--panel-width-wide)]"
        >
          {esAdministrador ? <RadialGauge /> : null}
          {!esMecanico ? <TickBars /> : null}
          {!esMecanico ? <PolicyCard /> : null}
          <AttentionList items={alertas} />
        </aside>
      </div>
    </div>
  )
}
