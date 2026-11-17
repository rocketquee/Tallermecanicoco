import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  EyeOff,
  Gauge,
  LoaderCircle,
  RefreshCw,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { Boton } from '../../components/Boton'
import { clasesBoton } from '../../components/estilosBoton'
import { EncabezadoPagina } from '../../components/panel/EncabezadoPagina'
import { EtiquetaOrden } from '../../components/panel/EtiquetaOrden'
import { Panel, PanelCabecera } from '../../components/panel/Panel'
import { useAuth } from '../../context/useAuth'
import { formatearFechaCorta } from '../../lib/formato'
import {
  BARRA_POR_ETAPA,
  ETAPAS_FLUJO,
  PROGRESO_POR_ETAPA,
  TOTAL_BAHIAS,
  estaEnBahia,
  etiquetaEtapa,
  ordenarParaBahia,
  siguienteEtapa,
} from '../../lib/ordenes-taller'
import { mensajeDeError } from '../../services/errores'
import { avanzarEtapa, listarOrdenes } from '../../services/ordenes'
import type { Orden } from '../../types/ordenes'

const numeroOrden = (id: number) => `ORD-${String(id).padStart(4, '0')}`
const numeroBahia = (numero: number) => String(numero).padStart(2, '0')

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-panel border border-line bg-white/[0.02] px-3 py-2.5">
      <dt className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
        {etiqueta}
      </dt>
      <dd
        className="mt-1 truncate text-[12px] font-medium text-foreground"
        title={valor}
      >
        {valor}
      </dd>
    </div>
  )
}

interface TarjetaProps {
  numero: number
  orden: Orden
  esPropia: boolean
  onAbrir: (orden: Orden) => void
}

function TarjetaBahia({ numero, orden, esPropia, onAbrir }: TarjetaProps) {
  const progreso = PROGRESO_POR_ETAPA[orden.estado]
  const siguiente = siguienteEtapa(orden.estado)

  return (
    <button
      type="button"
      onClick={() => onAbrir(orden)}
      className="group relative flex min-h-[260px] w-full flex-col overflow-hidden rounded-panel border border-line bg-panel p-4 text-left transition hover:border-line-strong hover:bg-white/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-line-strong focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      aria-label={`Abrir orden ${numeroOrden(orden.id)} de la bahía ${numero}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
          Bahía {numeroBahia(numero)}
        </span>
        <EtiquetaOrden estado={orden.estado} />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[15px] font-semibold tracking-wider text-foreground">
            {orden.vehiculo_placas}
          </p>
          <p className="mt-1 truncate text-[12px] text-muted">
            {orden.vehiculo_marca} {orden.vehiculo_modelo}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel border border-line bg-white/[0.03] text-faint transition group-hover:text-foreground">
          <Wrench className="h-4 w-4" strokeWidth={1.7} />
        </span>
      </div>

      <div className="mt-3 space-y-1">
        <p className="flex items-center gap-1.5 truncate text-[11px] text-muted">
          <User className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={1.7} />
          <span className="truncate">{orden.mecanico_nombre ?? 'Sin asignar'}</span>
          {esPropia && (
            <span className="rounded-full border border-line bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-muted uppercase">
              Tú
            </span>
          )}
        </p>
        <p className="truncate text-[11px] text-faint">
          {numeroOrden(orden.id)} · {orden.cliente_nombre}
        </p>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3 w-3" strokeWidth={1.8} />
            Avance
          </span>
          <span className="text-muted tabular-nums">{progreso}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full ${BARRA_POR_ETAPA[orden.estado]} transition-[width] duration-500`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate text-faint">
            {siguiente
              ? `Siguiente: ${etiquetaEtapa(siguiente)}`
              : 'Etapa final'}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-muted transition group-hover:text-foreground">
            Ver orden
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  )
}

function BahiaLibre({ numero }: { numero: number }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-panel border border-dashed border-line bg-white/[0.01] p-6 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/[0.02] text-faint">
        <Wrench className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <p className="mt-3 text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
        Bahía {numeroBahia(numero)}
      </p>
      <p className="mt-1.5 text-[12px] font-medium text-muted">
        Bahía disponible
      </p>
      <p className="mt-1 max-w-[180px] text-[11px] leading-5 text-faint">
        Lista para recibir la siguiente unidad.
      </p>
    </div>
  )
}

function EsqueletoBahias() {
  return (
    <>
      {Array.from({ length: TOTAL_BAHIAS }, (_, indice) => (
        <div
          key={indice}
          className="min-h-[260px] animate-pulse rounded-panel border border-line bg-panel p-4"
        >
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="mt-6 h-5 w-28 rounded bg-white/[0.08]" />
          <div className="mt-2 h-3 w-32 rounded bg-white/[0.05]" />
          <div className="mt-8 h-3 w-24 rounded bg-white/[0.05]" />
          <div className="mt-4 h-1.5 w-full rounded bg-white/[0.06]" />
        </div>
      ))}
    </>
  )
}

function FilaEspera({
  orden,
  onAbrir,
}: {
  orden: Orden
  onAbrir: (orden: Orden) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(orden)}
      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] sm:px-5"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel border border-line bg-white/[0.03] text-faint">
          <Clock3 className="h-3.5 w-3.5" strokeWidth={1.7} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-medium text-foreground">
            {orden.vehiculo_placas} · {orden.vehiculo_marca}{' '}
            {orden.vehiculo_modelo}
          </span>
          <span className="block truncate text-[11px] text-faint">
            {numeroOrden(orden.id)} · {orden.cliente_nombre}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <EtiquetaOrden estado={orden.estado} />
        <ChevronRight className="h-4 w-4 text-faint" />
      </span>
    </button>
  )
}

function Seccion({ children, titulo }: { children: ReactNode; titulo: string }) {
  return (
    <div>
      <h3 className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
        {titulo}
      </h3>
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

export function TableroBahias() {
  const { usuario } = useAuth()

  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)
  const [avanzando, setAvanzando] = useState(false)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    listarOrdenes({ limit: 200 })
      .then((datos) => {
        if (vigente) {
          setOrdenes(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return
        }
        setOrdenes([])
        setError(mensajeDeError(fallo, 'No se pudieron cargar las órdenes.'))
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

  const enBahia = useMemo(
    () => ordenes.filter(estaEnBahia).sort(ordenarParaBahia),
    [ordenes],
  )
  const bahiasOcupadas = enBahia.slice(0, TOTAL_BAHIAS)
  const enEspera = enBahia.slice(TOTAL_BAHIAS)
  const listas = useMemo(
    () => ordenes.filter((orden) => orden.estado === 'Listo'),
    [ordenes],
  )

  const seleccionada = useMemo(
    () => ordenes.find((orden) => orden.id === seleccionadaId) ?? null,
    [ordenes, seleccionadaId],
  )

  const posicionBahia = seleccionada
    ? bahiasOcupadas.findIndex((orden) => orden.id === seleccionada.id) + 1
    : 0

  function abrirPanel(orden: Orden) {
    setSeleccionadaId(orden.id)
    setErrorAccion(null)
    setMensaje(null)
  }

  function cerrarPanel() {
    setSeleccionadaId(null)
    setErrorAccion(null)
  }

  // Cierra con Escape y bloquea el scroll de la página mientras el panel
  // lateral está abierto.
  useEffect(() => {
    if (seleccionadaId === null) {
      return
    }

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setSeleccionadaId(null)
      }
    }

    document.addEventListener('keydown', alPresionarTecla)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = overflowPrevio
    }
  }, [seleccionadaId])

  async function alAvanzar() {
    if (!seleccionada) {
      return
    }

    setAvanzando(true)
    setErrorAccion(null)
    setMensaje(null)

    try {
      const actualizada = await avanzarEtapa(seleccionada.id)
      setOrdenes((actuales) =>
        actuales.map((orden) =>
          orden.id === actualizada.id ? actualizada : orden,
        ),
      )
      setMensaje(
        `Orden ${numeroOrden(actualizada.id)} movida a ${etiquetaEtapa(
          actualizada.estado,
        )}.`,
      )
    } catch (fallo) {
      setErrorAccion(
        mensajeDeError(fallo, 'No se pudo avanzar la etapa de la orden.'),
      )
    } finally {
      setAvanzando(false)
    }
  }

  const progreso = seleccionada
    ? PROGRESO_POR_ETAPA[seleccionada.estado]
    : 0
  const siguiente = seleccionada ? siguienteEtapa(seleccionada.estado) : null
  const indiceActual = seleccionada
    ? ETAPAS_FLUJO.indexOf(seleccionada.estado)
    : -1

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Operación del taller"
        titulo="Bahías de trabajo"
        descripcion="Las unidades que tienes asignadas, su avance y la etapa que sigue. Toca una bahía para ver la orden completa."
        acciones={
          <>
            <Link to="/dashboard" className={clasesBoton('secundario')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a Principal
            </Link>
            <Boton
              variante="secundario"
              onClick={() => setRecarga((valor) => valor + 1)}
              disabled={cargando}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Boton>
          </>
        }
      />

      <div className="flex gap-3 rounded-panel border border-sky-400/20 bg-sky-400/5 px-4 py-3.5 text-[12px] leading-6 text-sky-100">
        <Wrench className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
        <p>
          <strong className="font-semibold">Vista de mecánico.</strong> Solo
          aparecen las órdenes donde participas. Puedes avanzar la etapa de
          diagnóstico a reparación y a lista para entrega; los importes se
          mantienen ocultos para tu rol.
        </p>
      </div>

      {mensaje && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start justify-between gap-4 rounded-panel border border-positive/30 bg-positive/10 px-4 py-3.5 text-[12px] leading-5 text-foreground"
        >
          <p>{mensaje}</p>
          <button
            type="button"
            onClick={() => setMensaje(null)}
            aria-label="Cerrar aviso"
            className="rounded-md px-1.5 text-lg leading-none text-positive/70 transition hover:text-positive"
          >
            ×
          </button>
        </div>
      )}

      {error && !cargando && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-panel border border-negative/30 bg-negative/10 px-4 py-3.5 text-[12px] text-negative sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRecarga((valor) => valor + 1)}
            className="rounded-panel border border-negative/30 px-3 py-2 font-medium transition hover:border-negative/60"
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cargando ? (
          <EsqueletoBahias />
        ) : (
          Array.from({ length: TOTAL_BAHIAS }, (_, indice) => {
            const orden = bahiasOcupadas[indice]
            return orden ? (
              <TarjetaBahia
                key={orden.id}
                numero={indice + 1}
                orden={orden}
                esPropia={orden.mecanico_id === usuario?.mecanico_id}
                onAbrir={abrirPanel}
              />
            ) : (
              <BahiaLibre key={`libre-${indice}`} numero={indice + 1} />
            )
          })
        )}
      </section>

      {enEspera.length > 0 && (
        <Panel>
          <PanelCabecera
            titulo="En espera de bahía"
            descripcion="Unidades asignadas que todavía no ocupan una de las cuatro bahías."
            extra={
              <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
                {enEspera.length} en cola
              </span>
            }
          />
          <div className="divide-y divide-line">
            {enEspera.map((orden) => (
              <FilaEspera key={orden.id} orden={orden} onAbrir={abrirPanel} />
            ))}
          </div>
        </Panel>
      )}

      {listas.length > 0 && (
        <Panel>
          <PanelCabecera
            titulo="Listas para entrega"
            descripcion="Trabajos terminados que esperan la salida del vehículo."
            extra={
              <span className="self-start rounded-full border border-positive/30 bg-positive/10 px-2.5 py-1 text-[11px] font-medium text-positive tabular-nums sm:self-auto">
                {listas.length} listas
              </span>
            }
          />
          <div className="divide-y divide-line">
            {listas.map((orden) => (
              <FilaEspera key={orden.id} orden={orden} onAbrir={abrirPanel} />
            ))}
          </div>
        </Panel>
      )}

      {!cargando && !error && enBahia.length === 0 && listas.length === 0 && (
        <p className="rounded-panel border border-line bg-white/[0.02] px-4 py-4 text-center text-[12px] text-muted">
          No tienes órdenes asignadas en este momento. Cuando recepción te
          asigne una unidad, aparecerá en la primera bahía libre.
        </p>
      )}

      {seleccionada && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar detalle de la orden"
            onClick={cerrarPanel}
            className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-orden-detalle"
            className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
                  Orden de servicio
                </p>
                <h2
                  id="titulo-orden-detalle"
                  className="mt-1 text-[18px] font-semibold tracking-tight text-foreground tabular-nums"
                >
                  {numeroOrden(seleccionada.id)}
                </h2>
                <p className="mt-1 text-[11px] text-faint">
                  {posicionBahia > 0
                    ? `Bahía ${numeroBahia(posicionBahia)}`
                    : seleccionada.estado === 'Listo'
                      ? 'Lista para entrega'
                      : 'En espera de bahía'}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarPanel}
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div className="rounded-panel border border-line bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[17px] font-semibold tracking-wider text-foreground">
                      {seleccionada.vehiculo_placas}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-muted">
                      {seleccionada.vehiculo_marca}{' '}
                      {seleccionada.vehiculo_modelo}
                    </p>
                  </div>
                  <EtiquetaOrden estado={seleccionada.estado} />
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                    <span>Avance estimado</span>
                    <span className="text-muted tabular-nums">
                      {progreso}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${BARRA_POR_ETAPA[seleccionada.estado]} transition-[width] duration-500`}
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3">
                <Dato
                  etiqueta="Cliente"
                  valor={seleccionada.cliente_nombre}
                />
                <Dato
                  etiqueta="Responsable"
                  valor={seleccionada.mecanico_nombre ?? 'Sin asignar'}
                />
                <Dato
                  etiqueta="Ingreso"
                  valor={formatearFechaCorta(
                    seleccionada.created_at.slice(0, 10),
                  )}
                />
                <Dato
                  etiqueta="Etapa"
                  valor={etiquetaEtapa(seleccionada.estado)}
                />
              </dl>

              <Seccion titulo="Flujo de la orden">
                <ol>
                  {ETAPAS_FLUJO.map((etapa, indice) => {
                    const completada = indice < indiceActual
                    const actual = indice === indiceActual

                    return (
                      <li key={etapa} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                              actual
                                ? 'border-foreground bg-foreground text-surface'
                                : completada
                                  ? 'border-positive/40 bg-positive/10 text-positive'
                                  : 'border-line bg-white/[0.02] text-faint'
                            }`}
                          >
                            {completada ? (
                              <Check className="h-3 w-3" strokeWidth={2.5} />
                            ) : (
                              indice + 1
                            )}
                          </span>
                          {indice < ETAPAS_FLUJO.length - 1 && (
                            <span
                              className={`my-1 w-px flex-1 ${
                                completada ? 'bg-positive/30' : 'bg-line'
                              }`}
                            />
                          )}
                        </div>
                        <div className={indice === ETAPAS_FLUJO.length - 1 ? '' : 'pb-4'}>
                          <p
                            className={`text-[12px] ${
                              actual
                                ? 'font-semibold text-foreground'
                                : completada
                                  ? 'text-muted'
                                  : 'text-faint'
                            }`}
                          >
                            {etiquetaEtapa(etapa)}
                          </p>
                          <p className="text-[10px] text-faint">
                            {actual
                              ? 'Etapa actual'
                              : completada
                                ? 'Completada'
                                : 'Pendiente'}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>

                {indiceActual < 0 && (
                  <p className="mt-1 rounded-panel border border-line bg-white/[0.02] px-3 py-2 text-[11px] text-muted">
                    La orden está en una etapa fuera del flujo de taller (
                    {etiquetaEtapa(seleccionada.estado)}).
                  </p>
                )}
              </Seccion>

              <Seccion titulo="Trabajo reportado">
                <p className="rounded-panel border border-line bg-white/[0.02] px-3.5 py-3 text-[12px] leading-6 text-muted">
                  {seleccionada.falla_reportada ?? (
                    <span className="text-faint">
                      Sin descripción registrada.
                    </span>
                  )}
                </p>
              </Seccion>

              <p className="flex items-start gap-2 text-[11px] leading-5 text-faint">
                <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Los importes de la orden no están disponibles para el rol
                Mecánico.
              </p>
            </div>

            <footer className="space-y-3 border-t border-line px-5 py-4">
              {mensaje && (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-panel border border-positive/30 bg-positive/10 px-3.5 py-2.5 text-[12px] text-positive"
                >
                  {mensaje}
                </p>
              )}

              {errorAccion && (
                <p
                  role="alert"
                  className="rounded-panel border border-negative/30 bg-negative/10 px-3.5 py-2.5 text-[12px] text-negative"
                >
                  {errorAccion}
                </p>
              )}

              {siguiente ? (
                <button
                  type="button"
                  onClick={alAvanzar}
                  disabled={avanzando}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-panel bg-foreground px-4 text-[13px] font-semibold text-surface transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-line-strong focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {avanzando ? (
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      strokeWidth={2}
                    />
                  ) : (
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  )}
                  {avanzando
                    ? 'Actualizando…'
                    : `Avanzar a ${etiquetaEtapa(siguiente)}`}
                </button>
              ) : (
                <p className="rounded-panel border border-line bg-white/[0.02] px-4 py-3 text-center text-[11px] text-muted">
                  {seleccionada.estado === 'Listo'
                    ? 'El trabajo terminó: la unidad espera la entrega.'
                    : `La orden está en la etapa ${etiquetaEtapa(
                        seleccionada.estado,
                      )} y no tiene una siguiente.`}
                </p>
              )}

              <Link
                to={`/ordenes/${seleccionada.id}`}
                onClick={cerrarPanel}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-panel border border-line bg-white/[0.02] px-4 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-foreground"
              >
                Ver detalle de la orden
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              <p className="text-center text-[10px] text-faint">
                Cada cambio queda registrado en el historial de la orden.
              </p>
            </footer>
          </aside>
        </div>
      )}
    </div>
  )
}
