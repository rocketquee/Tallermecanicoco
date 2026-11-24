import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Crown,
  Inbox,
  PackageX,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardHeader } from '../../components/dashboard/DashboardHeader'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EtiquetaOrden } from '../../components/ui/EtiquetaOrden'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { useAuth } from '../../context/useAuth'
import { diasEntre, formatearFechaCorta, formatearMoneda } from '../../lib/formato'
import { listarClientes } from '../../services/clientes'
import { obtenerValorCustodia } from '../../services/dashboard'
import { listarRefacciones } from '../../services/refacciones'
import { listarOrdenes } from '../../services/ordenes'
import { listarVehiculos } from '../../services/vehiculos'
import type { Cliente } from '../../types/clientes'
import type { RefaccionDisponible } from '../../types/inventario'
import type { EstadoOrden, Orden } from '../../types/ordenes'
import type { Vehiculo } from '../../types/vehiculos'

interface ContextoLayout {
  abrirMenu?: () => void
}

/** Etapas que ocupan una bahía del taller. */
const ESTADOS_EN_TALLER: ReadonlyArray<EstadoOrden> = [
  'Recibido',
  'Diagnostico',
  'Reparacion',
]

const ETAPAS_VISIBLES: ReadonlyArray<EstadoOrden> = [
  'Recibido',
  'Diagnostico',
  'Reparacion',
  'Listo',
  'Entregado',
  'Cancelado',
]

const COLOR_ETAPA: Record<EstadoOrden, string> = {
  Recibido: 'bg-sky-400',
  Diagnostico: 'bg-violet-400',
  Reparacion: 'bg-amber-400',
  Listo: 'bg-positive',
  Entregado: 'bg-white/35',
  Cancelado: 'bg-negative',
}

interface Indicador {
  id: string
  etiqueta: string
  valor: string
  detalle: string
  icono: LucideIcon
  tono?: 'positivo' | 'alerta'
}

interface Alerta {
  id: string
  titulo: string
  detalle: string
  ruta: string
  tono: 'alerta' | 'info'
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function diasEnTaller(orden: Orden): number {
  return Math.max(diasEntre(orden.created_at.slice(0, 10), hoyIso()), 0)
}

/**
 * Tablero principal con datos reales de la API.
 *
 * Antes esta pantalla mostraba cifras inventadas (facturación, pólizas y
 * "perspectivas de IA"). Ahora resume lo que existe en la base: órdenes por
 * etapa, clientes, valor en custodia e inventario bajo.
 */
export function Dashboard() {
  const contexto = useOutletContext<ContextoLayout | null>()
  const { usuario } = useAuth()
  const rol = usuario?.rol ?? 'Recepcion'
  const esAdministrador = rol === 'Administrador'
  const puedeGestionar = rol === 'Administrador' || rol === 'Recepcion'

  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [refacciones, setRefacciones] = useState<RefaccionDisponible[]>([])
  const [valorCustodia, setValorCustodia] = useState<number | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    Promise.allSettled([
      listarOrdenes({ limit: 200 }),
      listarClientes({ limit: 200 }),
      listarVehiculos({ limit: 200 }),
      listarRefacciones({ disponibles: false, limit: 200 }),
    ])
      .then(([resOrdenes, resClientes, resVehiculos, resRefacciones]) => {
        if (!vigente) {
          return
        }

        if (resOrdenes.status === 'fulfilled') {
          setOrdenes(resOrdenes.value)
        } else {
          setError(
            'No se pudieron cargar las órdenes. Revisa que la API esté en línea y vuelve a intentar.',
          )
        }

        setClientes(
          resClientes.status === 'fulfilled' ? resClientes.value : [],
        )
        setVehiculos(
          resVehiculos.status === 'fulfilled' ? resVehiculos.value : [],
        )
        setRefacciones(
          resRefacciones.status === 'fulfilled' ? resRefacciones.value : [],
        )
      })
      .finally(() => {
        if (vigente) {
          setCargando(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [recarga])

  // VEH-07: el valor en custodia lo calcula MySQL con
  // fn_valor_en_custodia(); el frontend solo lo presenta. Se consulta aparte
  // porque el endpoint es exclusivo del Administrador (SEG-18).
  useEffect(() => {
    if (!esAdministrador) {
      setValorCustodia(null)
      return
    }

    let vigente = true
    obtenerValorCustodia()
      .then((respuesta) => {
        if (vigente) {
          setValorCustodia(Number(respuesta.valor))
        }
      })
      .catch(() => {
        if (vigente) {
          setValorCustodia(null)
        }
      })

    return () => {
      vigente = false
    }
  }, [esAdministrador, recarga])

  const actualizar = useCallback(() => setRecarga((valor) => valor + 1), [])

  const resumen = useMemo(() => {
    const enTaller = ordenes.filter((orden) =>
      ESTADOS_EN_TALLER.includes(orden.estado),
    )
    const listas = ordenes.filter((orden) => orden.estado === 'Listo')
    const vip = clientes.filter((cliente) => cliente.categoria === 'VIP')
    const stockBajo = refacciones.filter(
      (refaccion) => refaccion.stock_actual <= refaccion.stock_minimo,
    )

    return { enTaller, listas, vip, stockBajo }
  }, [ordenes, clientes, refacciones])

  const indicadores = useMemo<Indicador[]>(() => {
    const base: Indicador[] = [
      {
        id: 'taller',
        etiqueta: 'Autos en taller',
        valor: String(resumen.enTaller.length),
        detalle: 'Recibidos, en diagnóstico o reparación',
        icono: Wrench,
      },
      {
        id: 'listas',
        etiqueta: 'Listos para entrega',
        valor: String(resumen.listas.length),
        detalle: 'Esperando que el cliente recoja',
        icono: CheckCircle2,
        tono: resumen.listas.length > 0 ? 'positivo' : undefined,
      },
      {
        id: 'ordenes',
        etiqueta: 'Órdenes registradas',
        valor: String(ordenes.length),
        detalle: 'Visibles para tu rol',
        icono: ClipboardList,
      },
       {
        id: 'clientes',
        etiqueta: 'Clientes activos',
        valor: String(clientes.length),
        detalle: `${resumen.vip.length} con categoría VIP`,
        icono: Users,
      },
      {
        id: 'vehiculos',
        etiqueta: 'Vehículos registrados',
        valor: String(vehiculos.length),
        detalle: 'Flotilla dada de alta en el taller',
        icono: CarFront,
      },
    ]

    if (puedeGestionar) {
      base.push({
        id: 'stock',
        etiqueta: 'Refacciones por reponer',
        valor: String(resumen.stockBajo.length),
        detalle: 'Con existencia en el mínimo o menos',
        icono: PackageX,
        tono: resumen.stockBajo.length > 0 ? 'alerta' : undefined,
      })
    }

    if (esAdministrador) {
      base.push({
        id: 'custodia',
        etiqueta: 'Valor en custodia',
        valor:
          valorCustodia === null ? '—' : formatearMoneda(valorCustodia),
        detalle: 'Calculado con fn_valor_en_custodia()',
        icono: Wallet,
      })
    }

    return base
  }, [
    resumen,
    ordenes.length,
    clientes.length,
    vehiculos.length,
    valorCustodia,
    puedeGestionar,
    esAdministrador,
  ])

  const alertas = useMemo<Alerta[]>(() => {
    const lista: Alerta[] = []

    ordenes
      .filter(
        (orden) =>
          ESTADOS_EN_TALLER.includes(orden.estado) && diasEnTaller(orden) >= 5,
      )
      .sort((a, b) => diasEnTaller(b) - diasEnTaller(a))
      .slice(0, 3)
      .forEach((orden) => {
        const dias = diasEnTaller(orden)
        lista.push({
          id: `orden-${orden.id}`,
          titulo: `ORD-${String(orden.id).padStart(4, '0')} · ${orden.vehiculo_placas}`,
          detalle: `${dias} ${dias === 1 ? 'día' : 'días'} en taller · ${orden.estado === 'Diagnostico' ? 'Diagnóstico' : orden.estado === 'Reparacion' ? 'Reparación' : 'Recibido'}`,
          ruta: `/ordenes/${orden.id}`,
          tono: 'alerta',
        })
      })

    resumen.listas.slice(0, 3).forEach((orden) => {
      lista.push({
        id: `lista-${orden.id}`,
        titulo: `ORD-${String(orden.id).padStart(4, '0')} lista para entrega`,
        detalle: `${orden.vehiculo_marca} ${orden.vehiculo_modelo} · ${orden.vehiculo_placas}`,
        ruta: `/ordenes/${orden.id}`,
        tono: 'info',
      })
    })

    if (puedeGestionar) {
      resumen.stockBajo.slice(0, 3).forEach((refaccion) => {
        lista.push({
          id: `stock-${refaccion.id}`,
          titulo: refaccion.nombre,
          detalle: `${refaccion.stock_actual} en existencia · mínimo ${refaccion.stock_minimo}`,
          ruta: '/inventario',
          tono: 'alerta',
        })
      })
    }

    return lista
  }, [ordenes, resumen.listas, resumen.stockBajo, puedeGestionar])

  const recientes = useMemo(
    () =>
      [...ordenes]
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )
        .slice(0, 5),
    [ordenes],
  )

  const totalEtapas = Math.max(ordenes.length, 1)

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <DashboardHeader
        onAbrirMenu={contexto?.abrirMenu}
        onActualizar={actualizar}
        actualizando={cargando}
      />

      <div className="space-y-5 px-4 pb-8 xl:px-6">
        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-panel border border-negative/30 bg-negative/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-[12px] leading-5 text-negative">{error}</p>
            <button
              type="button"
              onClick={actualizar}
              className={clasesBoton('secundario', 'px-3 py-1.5 text-xs')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          </div>
        ) : null}

        {cargando && ordenes.length === 0 ? (
          <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, indice) => (
              <div
                key={indice}
                className="flex animate-pulse flex-col gap-3 bg-panel px-4 py-5"
              >
                <div className="h-3 w-24 rounded bg-white/[0.06]" />
                <div className="h-7 w-16 rounded bg-white/[0.06]" />
                <div className="h-3 w-32 rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : (
          <section
            aria-label="Indicadores del taller"
            className="grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 xl:grid-cols-4"
          >
            {indicadores.map(({ id, etiqueta, valor, detalle, icono: Icono, tono }) => (
              <div key={id} className="flex min-w-0 flex-col bg-panel px-4 py-4 transition-colors hover:bg-white/[0.025]">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-medium tracking-wide text-muted">
                    {etiqueta}
                  </p>
                  <Icono className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={1.7} />
                </div>
                <p
                  className={`mt-2 text-[24px] leading-none font-semibold tracking-tight tabular-nums ${
                    tono === 'alerta'
                      ? 'text-negative'
                      : tono === 'positivo'
                        ? 'text-positive'
                        : 'text-foreground'
                  }`}
                >
                  {valor}
                </p>
                <p className="mt-2 truncate text-[10.5px] text-faint">{detalle}</p>
              </div>
            ))}
          </section>
        )}

        {puedeGestionar ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/ordenes/nuevo" className={clasesBoton('primario', 'px-3 py-2 text-xs')}>
              <Plus className="h-3.5 w-3.5" />
              Nueva orden
            </Link>
            <Link to="/clientes/nuevo" className={clasesBoton('secundario', 'px-3 py-2 text-xs')}>
              <Users className="h-3.5 w-3.5" />
              Nuevo cliente
            </Link>
            <Link to="/ordenes" className={clasesBoton('secundario', 'px-3 py-2 text-xs')}>
              <ClipboardList className="h-3.5 w-3.5" />
              Ver todas las órdenes
            </Link>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel>
            <PanelCabecera
              titulo="Órdenes por etapa"
              descripcion="Distribución actual del flujo del taller."
              extra={
                <Link
                  to="/ordenes"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted transition hover:text-foreground"
                >
                  Ver tablero
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />

            {ordenes.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Inbox className="mx-auto h-5 w-5 text-faint" strokeWidth={1.7} />
                <p className="mt-3 text-[13px] font-medium text-foreground">
                  Todavía no hay órdenes registradas
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  {puedeGestionar
                    ? 'Crea la primera orden desde el botón "Nueva orden".'
                    : 'Cuando te asignen una orden aparecerá aquí.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 px-4 py-4 sm:px-5">
                {ETAPAS_VISIBLES.map((etapa) => {
                  const cantidad = ordenes.filter(
                    (orden) => orden.estado === etapa,
                  ).length
                  const porcentaje = Math.round((cantidad / totalEtapas) * 100)

                  return (
                    <div key={etapa}>
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="font-medium text-muted">
                          {etapa === 'Diagnostico'
                            ? 'Diagnóstico'
                            : etapa === 'Reparacion'
                              ? 'Reparación'
                              : etapa}
                        </span>
                        <span className="text-faint tabular-nums">
                          {cantidad} · {porcentaje}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full ${COLOR_ETAPA[etapa]}`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelCabecera
              titulo="Requiere atención"
              descripcion="Pendientes calculados con los datos actuales."
              extra={
                <AlertTriangle className="h-3.5 w-3.5 text-faint" strokeWidth={1.7} />
              }
            />

            {alertas.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ShieldCheck
                  className="mx-auto h-5 w-5 text-positive"
                  strokeWidth={1.7}
                />
                <p className="mt-3 text-[13px] font-medium text-foreground">
                  Todo en orden
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  No hay retrasos ni existencias críticas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {alertas.map((alerta) => (
                  <Link
                    key={alerta.id}
                    to={alerta.ruta}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.03] sm:px-5"
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        alerta.tono === 'alerta'
                          ? 'border-negative/30 bg-negative/10 text-negative'
                          : 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                      }`}
                    >
                      {alerta.tono === 'alerta' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Crown className="h-3 w-3" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-foreground">
                        {alerta.titulo}
                      </span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-faint">
                        {alerta.detalle}
                      </span>
                    </span>
                    <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-faint" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel>
          <PanelCabecera
            titulo="Últimas órdenes actualizadas"
            descripcion="Los movimientos más recientes del taller."
            extra={
              <Link
                to="/ordenes"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted transition hover:text-foreground"
              >
                Ver todas
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />

          {recientes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Inbox className="mx-auto h-5 w-5 text-faint" strokeWidth={1.7} />
              <p className="mt-3 text-[13px] font-medium text-foreground">
                Sin órdenes para mostrar
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Aquí verás el último movimiento de cada orden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[12px]">
                <thead className="border-b border-line text-[10px] tracking-[0.08em] text-faint uppercase">
                  <tr>
                    <th className="px-4 py-2.5 font-medium sm:px-5">Orden</th>
                    <th className="px-4 py-2.5 font-medium">Vehículo</th>
                    <th className="px-4 py-2.5 font-medium">Cliente</th>
                    <th className="px-4 py-2.5 font-medium">Etapa</th>
                    <th className="px-4 py-2.5 font-medium">Actualizada</th>
                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recientes.map((orden) => (
                    <tr key={orden.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3 sm:px-5">
                        <Link
                          to={`/ordenes/${orden.id}`}
                          className="font-medium text-foreground tabular-nums hover:underline"
                        >
                          ORD-{String(orden.id).padStart(4, '0')}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <span className="block text-foreground">
                          {orden.vehiculo_marca} {orden.vehiculo_modelo}
                        </span>
                        <span className="text-[10px] text-faint">
                          {orden.vehiculo_placas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{orden.cliente_nombre}</td>
                      <td className="px-4 py-3">
                        <EtiquetaOrden estado={orden.estado} />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatearFechaCorta(orden.updated_at.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted sm:px-5">
                        {orden.total === null ? 'No visible' : formatearMoneda(Number(orden.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
