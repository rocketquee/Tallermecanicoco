import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, EyeOff, Plus, RefreshCw } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { EstadoTabla } from '../../components/ui/EstadoTabla'
import { EtiquetaOrden } from '../../components/ui/EtiquetaOrden'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { useAuth } from '../../context/useAuth'
import { formatearFechaCorta, formatearMoneda } from '../../lib/formato'
import { listarOrdenes } from '../../services/ordenes'
import { mensajeDeError } from '../../services/errores'
import { ESTADOS_ORDEN } from '../../types/ordenes'
import type { EstadoOrden, Orden } from '../../types/ordenes'
import { TableroBahias } from './TableroBahias'

function convertirMonto(valor: string | null): number | null {
  if (valor === null) {
    return null
  }
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function Resumen({
  etiqueta,
  valor,
}: {
  etiqueta: string
  valor: string | number
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

/**
 * El rol Mecánico entra directo al tablero de bahías; Administrador y
 * Recepción conservan la tabla con filtros y totales.
 */
export function OrdenesServicio() {
  const { usuario } = useAuth()

  if (usuario?.rol === 'Mecanico') {
    return <TableroBahias />
  }

  return <VistaOrdenes />
}

function VistaOrdenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [estado, setEstado] = useState<'' | EstadoOrden>('')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    listarOrdenes({ estado: estado || undefined, limit: 200 })
      .then((datos) => {
        if (vigente) {
          setOrdenes(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setOrdenes([])
          setError(
            mensajeDeError(fallo, 'No se pudieron cargar las órdenes.'),
          )
        }
      })
      .finally(() => {
        if (vigente) {
          setCargando(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [estado, recarga])

  const ordenesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) {
      return ordenes
    }
    return ordenes.filter((orden) =>
      [
        String(orden.id),
        orden.cliente_nombre,
        orden.vehiculo_placas,
        orden.mecanico_nombre ?? '',
      ].some((valor) => valor.toLowerCase().includes(texto)),
    )
  }, [ordenes, busqueda])

  const enTaller = useMemo(
    () =>
      ordenesFiltradas.filter((orden) =>
        ['Recibido', 'Diagnostico', 'Reparacion'].includes(orden.estado),
      ).length,
    [ordenesFiltradas],
  )
  const listas = useMemo(
    () => ordenesFiltradas.filter((orden) => orden.estado === 'Listo').length,
    [ordenesFiltradas],
  )

  const hayFiltros = Boolean(estado || busqueda.trim())

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Operación del taller"
        titulo="Órdenes de servicio"
        descripcion="Consulta el vehículo, la etapa actual, el responsable y el total de cada orden. El mecánico solo ve las órdenes donde participa."
        acciones={
          <>
            <Link to="/ordenes/nuevo" className={clasesBoton('primario')}>
              <Plus className="h-3.5 w-3.5" />
              Nueva orden
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

      <section className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Resumen etiqueta="En esta vista" valor={ordenesFiltradas.length} />
        <Resumen etiqueta="En taller" valor={enTaller} />
        <Resumen etiqueta="Listas para entrega" valor={listas} />
      </section>

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
          <CampoTexto
            id="buscar-ordenes"
            etiqueta="Buscar"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="ID, cliente, placas o responsable"
            autoComplete="off"
          />

          <CampoSelect
            id="filtrar-estado-orden"
            etiqueta="Etapa"
            value={estado}
            onChange={(evento) =>
              setEstado(evento.target.value as '' | EstadoOrden)
            }
          >
            <option value="">Todas las etapas</option>
            {ESTADOS_ORDEN.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </CampoSelect>

          <button
            type="button"
            onClick={() => {
              setBusqueda('')
              setEstado('')
            }}
            disabled={!hayFiltros}
            className="min-h-11 rounded-panel border border-line px-4 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 md:mb-0.5"
          >
            Limpiar filtros
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelCabecera
          titulo="Órdenes registradas"
          descripcion="Ordenadas por fecha de ingreso, de la más reciente a la más antigua."
          extra={
            <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
              {cargando ? 'Cargando…' : `${ordenesFiltradas.length} órdenes`}
            </span>
          }
        />

        <EstadoTabla
          cargando={cargando}
          error={error}
          vacio={ordenesFiltradas.length === 0}
          tituloVacio={hayFiltros ? 'Sin resultados' : 'Aún no hay órdenes'}
          detalleVacio={
            hayFiltros
              ? 'Prueba con otra búsqueda o cambia la etapa seleccionada.'
              : 'Cuando se abra la primera orden de servicio aparecerá en esta tabla.'
          }
          onReintentar={() => setRecarga((valor) => valor + 1)}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-[13px]">
              <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                    Orden
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Vehículo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Responsable
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Etapa
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium sm:px-5"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="py-3 pr-3 text-right font-medium sm:pr-4"
                  >
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ordenesFiltradas.map((orden) => {
                  const total = convertirMonto(orden.total)
                  return (
                    <tr
                      key={orden.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <Link
                          to={`/ordenes/${orden.id}`}
                          className="font-medium text-foreground underline decoration-line-strong underline-offset-4 tabular-nums transition hover:text-white"
                        >
                          ORD-{String(orden.id).padStart(4, '0')}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-faint">
                          {formatearFechaCorta(orden.created_at.slice(0, 10))}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[220px] truncate font-medium text-foreground">
                          {orden.cliente_nombre}
                        </p>
                        {orden.falla_reportada && (
                          <p
                            className="mt-0.5 max-w-[240px] truncate text-[11px] text-faint"
                            title={orden.falla_reportada}
                          >
                            {orden.falla_reportada}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-md border border-line bg-white/[0.03] px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-foreground">
                          {orden.vehiculo_placas}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-muted">
                        {orden.mecanico_nombre ?? (
                          <span className="text-[11px] text-faint">
                            Sin asignar
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <EtiquetaOrden estado={orden.estado} />
                      </td>

                      <td className="px-4 py-4 text-right sm:px-5">
                        {total === null ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] text-faint"
                            title="Los importes no están disponibles para el rol Mecánico"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            No visible
                          </span>
                        ) : (
                          <span className="font-medium text-foreground tabular-nums">
                            {formatearMoneda(total)}
                          </span>
                        )}
                      </td>

                      <td className="py-4 pr-3 pl-1 text-right sm:pr-4">
                        <Link
                          to={`/ordenes/${orden.id}`}
                          className="inline-flex items-center gap-1.5 rounded-panel border border-line bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-muted transition hover:border-line-strong hover:text-foreground"
                        >
                          Ver detalle
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </EstadoTabla>

        {!cargando && !error && ordenesFiltradas.length > 0 && (
          <p className="border-t border-line px-4 py-3 text-[11px] text-faint sm:px-5">
            Se muestran hasta 200 órdenes. Usa la búsqueda o la etapa para
            acotar el resultado.
          </p>
        )}
      </Panel>
    </div>
  )
}
