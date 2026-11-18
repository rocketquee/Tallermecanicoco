import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  EyeOff,
  Gauge,
  RefreshCw,
  User,
  Wrench,
} from 'lucide-react'
import { Boton } from '../../components/Boton'
import { clasesBoton } from '../../components/estilosBoton'
import { EncabezadoPagina } from '../../components/panel/EncabezadoPagina'
import { EtiquetaOrden } from '../../components/panel/EtiquetaOrden'
import { formatearFechaCorta } from '../../lib/formato'
import {
  BARRA_POR_ETAPA,
  ETAPAS_FLUJO,
  PROGRESO_POR_ETAPA,
} from '../../lib/ordenes-taller'
import { mensajeDeError } from '../../services/errores'
import { listarOrdenes } from '../../services/ordenes'
import type { EstadoOrden, Orden } from '../../types/ordenes'
import { RegistrarAvanceModal } from './RegistrarAvanceModal'

const numeroOrden = (id: number) => `ORD-${String(id).padStart(4, '0')}`

/** Prioridad de las etapas activas: primero lo que está en reparación. */
const PRIORIDAD_ETAPA: Record<EstadoOrden, number> = {
  Recibido: 0,
  Diagnostico: 1,
  Reparacion: 2,
  Listo: 3,
  Entregado: 4,
  Cancelado: 5,
}

function Resumen({
  etiqueta,
  valor,
}: {
  etiqueta: string
  valor: number
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-[10px] font-medium tracking-[0.14em] text-faint uppercase">
        {etiqueta}
      </p>
      <p className="mt-1.5 text-[22px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
        {valor}
      </p>
    </div>
  )
}

function TarjetaOrden({
  orden,
  onRegistrar,
}: {
  orden: Orden
  onRegistrar: (orden: Orden) => void
}) {
  const progreso = PROGRESO_POR_ETAPA[orden.estado]

  return (
    <article className="flex flex-col overflow-hidden rounded-panel border border-line bg-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-medium tracking-wider text-faint">
          {numeroOrden(orden.id)}
        </span>
        <EtiquetaOrden estado={orden.estado} />
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[17px] font-semibold tracking-wider text-foreground">
            {orden.vehiculo_placas}
          </p>
          <p className="mt-1 truncate text-[12px] text-muted">
            {orden.vehiculo_marca} {orden.vehiculo_modelo}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel border border-line bg-white/[0.03] text-faint">
          <Wrench className="h-4 w-4" strokeWidth={1.7} />
        </span>
      </div>

      <div className="mt-3 space-y-1">
        <p className="flex items-center gap-1.5 truncate text-[11px] text-muted">
          <User className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={1.7} />
          <span className="truncate">
            {orden.mecanico_nombre ?? 'Asignada a ti'}
          </span>
        </p>
        <p className="truncate text-[11px] text-faint">
          {orden.cliente_nombre} · Ingreso{' '}
          {formatearFechaCorta(orden.created_at.slice(0, 10))}
        </p>
      </div>

      {orden.falla_reportada && (
        <div className="mt-3 rounded-panel border border-line bg-white/[0.02] px-3 py-2">
          <p className="text-[9px] font-medium tracking-[0.12em] text-faint uppercase">
            Reporte del cliente
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">
            {orden.falla_reportada}
          </p>
        </div>
      )}

      {orden.diagnostico && (
        <div className="mt-2 rounded-panel border border-violet-400/20 bg-violet-400/5 px-3 py-2">
          <p className="text-[9px] font-medium tracking-[0.12em] text-violet-300/80 uppercase">
            Último diagnóstico
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">
            {orden.diagnostico}
          </p>
        </div>
      )}

      <div className="mt-4">
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
      </div>

      <button
        type="button"
        onClick={() => onRegistrar(orden)}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-panel bg-foreground px-4 text-[13px] font-semibold text-surface transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-line-strong focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
      >
        <ClipboardList className="h-4 w-4" strokeWidth={2} />
        Registrar Avance
      </button>

      <Link
        to={`/ordenes/${orden.id}`}
        className="mt-2 flex min-h-9 items-center justify-center gap-1.5 rounded-panel border border-line bg-white/[0.02] px-4 text-[11px] font-medium text-muted transition hover:border-line-strong hover:text-foreground"
      >
        Ver detalle
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  )
}

function EsqueletoTarjetas() {
  return (
    <>
      {Array.from({ length: 3 }, (_, indice) => (
        <div
          key={indice}
          className="min-h-[300px] animate-pulse rounded-panel border border-line bg-panel p-4"
        >
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="mt-5 h-5 w-28 rounded bg-white/[0.08]" />
          <div className="mt-2 h-3 w-32 rounded bg-white/[0.05]" />
          <div className="mt-6 h-14 w-full rounded bg-white/[0.04]" />
          <div className="mt-4 h-1.5 w-full rounded bg-white/[0.06]" />
          <div className="mt-4 h-11 w-full rounded bg-white/[0.08]" />
        </div>
      ))}
    </>
  )
}

export function TableroBahias() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  const [seleccionada, setSeleccionada] = useState<Orden | null>(null)
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

  const activas = useMemo(
    () =>
      ordenes.filter((orden) =>
        ETAPAS_FLUJO.includes(orden.estado),
      ),
    [ordenes],
  )

  const enTaller = useMemo(
    () =>
      activas
        .filter((orden) => orden.estado !== 'Listo')
        .sort(
          (a, b) =>
            PRIORIDAD_ETAPA[b.estado] - PRIORIDAD_ETAPA[a.estado] ||
            a.id - b.id,
        ),
    [activas],
  )

  const listas = useMemo(
    () =>
      activas
        .filter((orden) => orden.estado === 'Listo')
        .sort((a, b) => a.id - b.id),
    [activas],
  )

  function alGuardar(texto: string) {
    setSeleccionada(null)
    setMensaje(texto)
    setRecarga((valor) => valor + 1)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Operación del taller"
        titulo="Mis órdenes asignadas"
        descripcion="Las unidades que tienes asignadas, su avance y el registro de tu trabajo. Usa Registrar Avance para dejar diagnóstico, refacciones usadas y la nueva etapa."
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
          aparecen las órdenes donde participas. Puedes dejar diagnóstico,
          consumir refacciones y avanzar la orden dentro del flujo del taller;
          los importes y los datos de clientes confidenciales permanecen
          ocultos para tu rol.
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

      <section className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Resumen etiqueta="Órdenes asignadas" valor={activas.length} />
        <Resumen etiqueta="En el taller" valor={enTaller.length} />
        <Resumen etiqueta="Listas para entrega" valor={listas.length} />
      </section>

      {cargando ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <EsqueletoTarjetas />
        </section>
      ) : (
        <>
          {enTaller.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-medium tracking-[0.16em] text-faint uppercase">
                  En el taller
                </h2>
                <span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums">
                  {enTaller.length} unidad(es)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {enTaller.map((orden) => (
                  <TarjetaOrden
                    key={orden.id}
                    orden={orden}
                    onRegistrar={setSeleccionada}
                  />
                ))}
              </div>
            </section>
          )}

          {listas.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-medium tracking-[0.16em] text-faint uppercase">
                  Listas para entrega
                </h2>
                <span className="rounded-full border border-positive/30 bg-positive/10 px-2.5 py-1 text-[11px] font-medium text-positive tabular-nums">
                  {listas.length} lista(s)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {listas.map((orden) => (
                  <TarjetaOrden
                    key={orden.id}
                    orden={orden}
                    onRegistrar={setSeleccionada}
                  />
                ))}
              </div>
            </section>
          )}

          {!error && activas.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-line bg-white/[0.01] px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white/[0.02] text-faint">
                <Wrench className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <p className="mt-3 text-[13px] font-semibold text-foreground">
                No tienes órdenes activas asignadas
              </p>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-faint">
                Cuando recepción te asigne una unidad aparecerá aquí con su
                botón para registrar el avance. Las órdenes entregadas o
                canceladas ya no se muestran en esta vista.
              </p>
            </div>
          )}

          <p className="flex items-start gap-2 text-[11px] leading-5 text-faint">
            <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Los importes, los datos de contacto y los nombres de clientes
            confidenciales no están disponibles para el rol Mecánico.
          </p>
        </>
      )}

      {seleccionada && (
        <RegistrarAvanceModal
          orden={seleccionada}
          onCerrar={() => setSeleccionada(null)}
          onGuardado={alGuardar}
        />
      )}
    </div>
  )
}
