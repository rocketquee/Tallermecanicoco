import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { EstadoTabla } from '../../components/ui/EstadoTabla'
import { EtiquetaOrden } from '../../components/ui/EtiquetaOrden'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { formatearFechaCorta, formatearMoneda } from '../../lib/formato'
import { useAuth } from '../../context/useAuth'
import { listarAutorizaciones } from '../../services/autorizaciones'
import { mensajeDeError } from '../../services/errores'
import type {
  AutorizacionOrden,
  EstadoAutorizacion,
  ListaAutorizaciones,
} from '../../types/autorizaciones'
import { ResolverAutorizacionModal } from './ResolverAutorizacionModal'

type Filtro = 'Todas' | EstadoAutorizacion

const ESTILOS_AUTORIZACION: Record<EstadoAutorizacion, string> = {
  Pendiente: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Aprobada: 'border-positive/30 bg-positive/10 text-positive',
  Rechazada: 'border-negative/30 bg-negative/10 text-negative',
}

function aNumero(valor: string): number {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

function ResumenCelda({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string
  valor: string | number
  detalle: string
}) {
  return (
    <div className="px-4 py-4 transition-colors hover:bg-white/[0.02] sm:px-5">
      <p className="text-[10px] font-medium tracking-[0.14em] text-faint uppercase">
        {etiqueta}
      </p>
      <p className="mt-1.5 text-[22px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
        {valor}
      </p>
      <p className="mt-1.5 truncate text-[10.5px] text-faint">{detalle}</p>
    </div>
  )
}

/**
 * Autorizaciones por monto (AUT-01 a AUT-08).
 *
 * Lista las órdenes que superan el umbral configurado. El Administrador
 * aprueba o rechaza; Recepción solo consulta. Cada decisión queda en la
 * bitácora con el usuario y el motivo.
 */
export function Autorizaciones() {
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === 'Administrador'

  const [datos, setDatos] = useState<ListaAutorizaciones | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [revisando, setRevisando] = useState<AutorizacionOrden | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    listarAutorizaciones({ limit: 200 })
      .then((respuesta) => {
        if (vigente) {
          setDatos(respuesta)
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setDatos(null)
          setError(
            mensajeDeError(
              fallo,
              'No se pudieron cargar las autorizaciones.',
            ),
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
  }, [recarga])

  // El aviso de éxito desaparece solo para no ocupar espacio permanente.
  useEffect(() => {
    if (!aviso) {
      return
    }
    const temporizador = window.setTimeout(() => setAviso(null), 7000)
    return () => window.clearTimeout(temporizador)
  }, [aviso])

  const items = datos?.items ?? []

  const conteos = useMemo(
    () => ({
      Pendiente: items.filter((item) => item.estado === 'Pendiente').length,
      Aprobada: items.filter((item) => item.estado === 'Aprobada').length,
      Rechazada: items.filter((item) => item.estado === 'Rechazada').length,
    }),
    [items],
  )

  const filtrados = useMemo(
    () =>
      filtro === 'Todas'
        ? items
        : items.filter((item) => item.estado === filtro),
    [items, filtro],
  )

  const montoUmbral = datos?.monto_umbral ?? '0.00'

  function alResolver(mensaje: string) {
    setRevisando(null)
    setAviso(mensaje)
    setRecarga((valor) => valor + 1)
  }

  const pestanas: ReadonlyArray<{ valor: Filtro; etiqueta: string; total: number }> =
    [
      { valor: 'Todas', etiqueta: 'Todas', total: items.length },
      { valor: 'Pendiente', etiqueta: 'Pendientes', total: conteos.Pendiente },
      { valor: 'Aprobada', etiqueta: 'Aprobadas', total: conteos.Aprobada },
      { valor: 'Rechazada', etiqueta: 'Rechazadas', total: conteos.Rechazada },
    ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Control de gastos"
        titulo="Autorizaciones"
        descripcion="Órdenes que superan el monto autorizado y necesitan la aprobación del Administrador antes de continuar. Cada decisión queda registrada en la bitácora."
        acciones={
          <Boton
            variante="secundario"
            onClick={() => setRecarga((valor) => valor + 1)}
            disabled={cargando}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Boton>
        }
      />

      {aviso && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-panel border border-positive/25 bg-positive/5 px-4 py-3 text-[12px] leading-5 text-positive"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{aviso}</p>
        </div>
      )}

      <section className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <ResumenCelda
          etiqueta="Pendientes"
          valor={conteos.Pendiente}
          detalle="Esperando la decisión del Administrador"
        />
        <ResumenCelda
          etiqueta="Aprobadas"
          valor={conteos.Aprobada}
          detalle="Órdenes autorizadas para continuar"
        />
        <ResumenCelda
          etiqueta="Rechazadas"
          valor={conteos.Rechazada}
          detalle="Órdenes que siguen bloqueadas"
        />
      </section>

      <div className="flex flex-wrap items-center gap-1 rounded-panel border border-line bg-panel p-1 sm:w-fit">
        {pestanas.map((pestana) => (
          <button
            key={pestana.valor}
            type="button"
            onClick={() => setFiltro(pestana.valor)}
            aria-pressed={filtro === pestana.valor}
            className={`inline-flex min-h-9 items-center gap-2 rounded-[6px] px-3 text-[12px] font-medium transition ${
              filtro === pestana.valor
                ? 'bg-white/[0.07] text-foreground'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {pestana.etiqueta}
            <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] tabular-nums text-faint">
              {pestana.total}
            </span>
          </button>
        ))}
      </div>

      <Panel>
        <PanelCabecera
          titulo="Órdenes que requieren autorización"
          descripcion={
            esAdministrador
              ? 'Revisa el importe y aprueba o rechaza cada solicitud.'
              : 'Consulta las solicitudes; solo el Administrador puede resolverlas.'
          }
          extra={
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
              <SlidersHorizontal className="h-3 w-3" />
              Monto a partir de {formatearMoneda(aNumero(montoUmbral))}
            </span>
          }
        />

        <EstadoTabla
          cargando={cargando}
          error={error}
          vacio={items.length === 0}
          tituloVacio="No hay órdenes que requieran autorización"
          detalleVacio={`Ninguna orden supera el umbral de ${formatearMoneda(
            aNumero(montoUmbral),
          )} ni tiene la bandera de autorización encendida.`}
          onReintentar={() => setRecarga((valor) => valor + 1)}
          filasEsqueleto={4}
        >
          {filtrados.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <ShieldCheck
                className="mx-auto h-5 w-5 text-faint"
                strokeWidth={1.7}
              />
              <p className="mt-3 text-[14px] font-semibold text-foreground">
                Sin solicitudes en este estado
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Cambia el filtro para ver el resto de las órdenes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[13px]">
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
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Solicitud
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Resolución
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium sm:px-5"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtrados.map((item) => (
                    <tr
                      key={item.orden_id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <p className="font-medium text-foreground tabular-nums">
                          ORD-{String(item.orden_id).padStart(4, '0')}
                        </p>
                        <div className="mt-1.5">
                          <EtiquetaOrden estado={item.estado_orden} />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[200px] truncate text-muted">
                          {item.cliente_nombre}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[200px] truncate text-muted">
                          {item.vehiculo_descripcion}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-faint tabular-nums">
                          {item.vehiculo_placas}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <p className="font-semibold text-foreground tabular-nums">
                          {formatearMoneda(aNumero(item.total))}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-faint tabular-nums">
                          Saldo {formatearMoneda(aNumero(item.saldo))}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${ESTILOS_AUTORIZACION[item.estado]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {item.estado}
                        </span>
                        <p className="mt-1.5 text-[10.5px] text-faint">
                          {item.tipo === 'Monto_Alto'
                            ? 'Monto alto'
                            : item.tipo === 'Saldo_Pendiente'
                              ? 'Saldo pendiente'
                              : item.tipo === 'Reautorizacion'
                                ? 'Reautorización'
                                : 'Sin solicitud registrada'}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {item.fecha_resolucion ? (
                          <>
                            <p className="max-w-[180px] truncate text-muted">
                              {item.aprobado_por ?? 'Administrador'}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-faint">
                              {formatearFechaCorta(
                                item.fecha_resolucion.slice(0, 10),
                              )}
                            </p>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
                            <Clock className="h-3 w-3" />
                            Sin resolver
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right sm:px-5">
                        <button
                          type="button"
                          onClick={() => setRevisando(item)}
                          className={clasesBoton(
                            item.estado === 'Pendiente' && esAdministrador
                              ? 'primario'
                              : 'secundario',
                            'px-3 py-1.5 text-[11px]',
                          )}
                        >
                          {item.estado === 'Pendiente' && esAdministrador ? (
                            <>
                              <ShieldCheck className="h-3 w-3" />
                              Revisar
                            </>
                          ) : (
                            <>
                              {item.estado === 'Rechazada' ? (
                                <ShieldX className="h-3 w-3" />
                              ) : (
                                <ShieldCheck className="h-3 w-3" />
                              )}
                              Ver
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </EstadoTabla>
      </Panel>

      <p className="px-1 text-[11px] leading-5 text-faint">
        El umbral se configura en el backend. Al aprobar se apaga la bandera de
        autorización de la orden; al rechazar se conserva para que siga
        bloqueada.
      </p>

      {revisando && (
        <ResolverAutorizacionModal
          item={revisando}
          montoUmbral={montoUmbral}
          soloLectura={
            !esAdministrador || revisando.estado !== 'Pendiente'
          }
          onCerrar={() => setRevisando(null)}
          onResuelto={alResolver}
        />
      )}
    </div>
  )
}
