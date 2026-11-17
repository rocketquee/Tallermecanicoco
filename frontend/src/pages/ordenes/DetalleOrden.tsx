import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Car,
  Check,
  CircleAlert,
  EyeOff,
  FileText,
  Fuel,
  Gauge,
  Mail,
  Phone,
  Printer,
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
import { formatearFechaCorta, formatearMoneda } from '../../lib/formato'
import {
  etiquetaCombustible,
  inspeccionProvisional,
} from '../../lib/inspeccion-vehiculo'
import type { InspeccionVehiculo } from '../../lib/inspeccion-vehiculo'
import { etiquetaEtapa } from '../../lib/ordenes-taller'
import { mensajeDeError } from '../../services/errores'
import { obtenerOrden } from '../../services/ordenes'
import type { ClienteOrden, OrdenDetalle, VehiculoOrden } from '../../types/ordenes'

const numeroOrden = (id: number) => `ORD-${String(id).padStart(4, '0')}`

function aNumero(valor: string | null): number | null {
  if (valor === null) {
    return null
  }
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function fechaDe(iso: string): string {
  return formatearFechaCorta(iso.slice(0, 10))
}

function DatoFicha({
  icono,
  etiqueta,
  valor,
  mono = false,
}: {
  icono: ReactNode
  etiqueta: string
  valor: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-faint">{icono}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
          {etiqueta}
        </p>
        <p
          className={`mt-0.5 truncate text-[12px] text-foreground ${
            mono ? 'font-mono tracking-wide' : ''
          }`}
          title={valor}
        >
          {valor}
        </p>
      </div>
    </div>
  )
}

function TarjetaCliente({ cliente }: { cliente: ClienteOrden }) {
  return (
    <Panel className="h-full">
      <PanelCabecera
        titulo="Cliente"
        descripcion="Datos de contacto registrados en la ficha."
        extra={
          <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted uppercase sm:self-auto">
            {cliente.categoria}
          </span>
        }
      />

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04]">
            <User className="h-4 w-4 text-muted" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {cliente.nombre}
            </p>
            <p className="mt-0.5 text-[11px] text-faint">
              Cliente #{String(cliente.id).padStart(3, '0')}
              {cliente.confidencial ? ' · Ficha confidencial' : ''}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DatoFicha
            icono={<Phone className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="Teléfono"
            valor={cliente.telefono1 ?? 'Dato reservado'}
            mono
          />
          <DatoFicha
            icono={<Mail className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="Correo"
            valor={cliente.correo ?? 'Dato reservado'}
          />
          <DatoFicha
            icono={<FileText className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="RFC"
            valor={cliente.rfc ?? 'No registrado'}
            mono
          />
          <DatoFicha
            icono={<Wrench className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="Atención"
            valor={
              cliente.confidencial
                ? 'Identidad protegida'
                : 'Servicio general'
            }
          />
        </div>
      </div>
    </Panel>
  )
}

function TarjetaVehiculo({ vehiculo }: { vehiculo: VehiculoOrden }) {
  return (
    <Panel className="h-full">
      <PanelCabecera
        titulo="Vehículo"
        descripcion="Unidad recibida en el taller."
        extra={
          <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium tracking-wide text-muted uppercase sm:self-auto">
            {vehiculo.anio}
          </span>
        }
      />

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/[0.04]">
            <Car className="h-4 w-4 text-muted" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[15px] font-semibold tracking-wider text-foreground">
              {vehiculo.placas}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-muted">
              {vehiculo.marca} {vehiculo.modelo}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DatoFicha
            icono={<Car className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="Año / Color"
            valor={`${vehiculo.anio} · ${vehiculo.color ?? 'Sin color'}`}
          />
          <DatoFicha
            icono={<FileText className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="VIN"
            valor={vehiculo.vin ?? 'No registrado'}
            mono
          />
          <DatoFicha
            icono={<Gauge className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="Kilometraje de entrada"
            valor={
              vehiculo.kilometraje_entrada === null
                ? 'No registrado'
                : `${vehiculo.kilometraje_entrada.toLocaleString('es-MX')} km`
            }
            mono
          />
          <DatoFicha
            icono={<User className="h-3.5 w-3.5" strokeWidth={1.7} />}
            etiqueta="Propietario"
            valor={`Cliente #${String(vehiculo.id).padStart(3, '0')}`}
            mono
          />
        </div>
      </div>
    </Panel>
  )
}

function EtiquetaEstadoGeneral({ estado }: { estado: string }) {
  const estilo =
    estado === 'Muy bueno' || estado === 'Bueno'
      ? 'border-positive/30 bg-positive/10 text-positive'
      : estado === 'Regular'
        ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
        : 'border-negative/30 bg-negative/10 text-negative'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${estilo}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {estado}
    </span>
  )
}

function PanelEstadoVehiculo({
  inspeccion,
}: {
  inspeccion: InspeccionVehiculo
}) {
  return (
    <Panel>
      <PanelCabecera
        titulo="Estado del vehículo"
        descripcion="Registro de recepción al ingresar al taller."
        extra={
          <span
            className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium tracking-wide text-faint uppercase sm:self-auto"
            title="Los datos de inspección aún no se guardan en la base; se muestran valores provisionales."
          >
            Provisional
          </span>
        }
      />

      <div className="space-y-5 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-panel border border-line bg-white/[0.02] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
              <Gauge className="h-3 w-3" strokeWidth={1.8} />
              Kilometraje
            </p>
            <p className="mt-1.5 text-[15px] font-semibold text-foreground tabular-nums">
              {inspeccion.kilometraje === null
                ? '—'
                : `${inspeccion.kilometraje.toLocaleString('es-MX')} km`}
            </p>
          </div>
          <div className="rounded-panel border border-line bg-white/[0.02] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
              <CircleAlert className="h-3 w-3" strokeWidth={1.8} />
              Estado general
            </p>
            <div className="mt-1.5">
              <EtiquetaEstadoGeneral estado={inspeccion.estadoGeneral} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="h-3 w-3" strokeWidth={1.8} />
              Combustible
            </span>
            <span className="text-muted normal-case">
              {etiquetaCombustible(inspeccion.nivelCombustible)} ·{' '}
              <span className="tabular-nums">
                {inspeccion.nivelCombustible}%
              </span>
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                inspeccion.nivelCombustible <= 25
                  ? 'bg-negative'
                  : inspeccion.nivelCombustible <= 50
                    ? 'bg-amber-400'
                    : 'bg-positive'
              }`}
              style={{ width: `${inspeccion.nivelCombustible}%` }}
            />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
            Inventario del vehículo
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {inspeccion.inventario.map((item) => (
              <li
                key={item.nombre}
                className={`flex items-center gap-1.5 text-[11px] ${
                  item.presente ? 'text-muted' : 'text-faint'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    item.presente
                      ? 'border-positive/30 bg-positive/10 text-positive'
                      : 'border-line bg-white/[0.02] text-faint'
                  }`}
                >
                  {item.presente ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : (
                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                  )}
                </span>
                <span className="truncate">{item.nombre}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
            Observaciones
          </p>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            {inspeccion.observaciones}
          </p>
        </div>
      </div>
    </Panel>
  )
}

function PanelTotales({ orden }: { orden: OrdenDetalle }) {
  const piezas = aNumero(orden.total_piezas)
  const manoObra = aNumero(orden.total_mano_obra)
  const subtotal = aNumero(orden.subtotal)
  const iva = aNumero(orden.iva)
  const total = aNumero(orden.total)

  return (
    <Panel>
      <PanelCabecera
        titulo="Totales"
        descripcion="Subtotal, IVA y total de la orden."
      />

      {subtotal === null || iva === null || total === null ? (
        <div className="flex items-start gap-2.5 px-4 py-4 text-[11px] leading-5 text-faint sm:px-5">
          <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Los importes no están disponibles para el rol Mecánico. Pide a
            recepción o al administrador el resumen de cobranza.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
          <div className="text-[10px] leading-5 text-faint">
            <p className="font-medium tracking-[0.12em] uppercase">
              Resumen de cobranza
            </p>
            <p className="mt-1">
              Precios en pesos mexicanos. El IVA se calcula sobre el subtotal
              de servicios y refacciones.
            </p>
            <p className="mt-3">
              {orden.detalles.length}{' '}
              {orden.detalles.length === 1 ? 'concepto' : 'conceptos'} en esta
              orden.
            </p>
          </div>

          <dl className="space-y-2 text-[12px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Refacciones</dt>
              <dd className="text-foreground tabular-nums">
                {formatearMoneda(piezas ?? 0)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Mano de obra</dt>
              <dd className="text-foreground tabular-nums">
                {formatearMoneda(manoObra ?? 0)}
              </dd>
            </div>
            <div className="my-1 border-t border-line" />
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Subtotal</dt>
              <dd className="text-foreground tabular-nums">
                {formatearMoneda(subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">IVA (16%)</dt>
              <dd className="text-foreground tabular-nums">
                {formatearMoneda(iva)}
              </dd>
            </div>
            <div className="my-1 border-t border-line" />
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[11px] font-medium tracking-[0.12em] text-faint uppercase">
                Total
              </dt>
              <dd className="text-[20px] font-semibold tracking-tight text-foreground tabular-nums">
                {formatearMoneda(total)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Panel>
  )
}

function PanelDatosOrden({ orden }: { orden: OrdenDetalle }) {
  return (
    <Panel>
      <PanelCabecera titulo="Datos de la orden" />

      <dl className="space-y-3 px-4 py-4 text-[12px] sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Etapa</dt>
          <dd>
            <EtiquetaOrden estado={orden.estado} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Responsable</dt>
          <dd className="min-w-0 truncate text-foreground">
            {orden.mecanico_nombre ?? 'Sin asignar'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Ingreso</dt>
          <dd className="text-foreground">{fechaDe(orden.created_at)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Última actualización</dt>
          <dd className="text-foreground">{fechaDe(orden.updated_at)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <dt className="text-muted">Conceptos</dt>
          <dd className="text-foreground tabular-nums">
            {orden.detalles.length}
          </dd>
        </div>
      </dl>
    </Panel>
  )
}

function HojaImpresion({
  orden,
  inspeccion,
}: {
  orden: OrdenDetalle
  inspeccion: InspeccionVehiculo
}) {
  const subtotal = aNumero(orden.subtotal)
  const iva = aNumero(orden.iva)
  const total = aNumero(orden.total)
  const moneda = (valor: number | null) =>
    valor === null ? '—' : formatearMoneda(valor)

  return createPortal(
    <div id="orden-impresion" className="bg-white text-neutral-900">
      <header className="flex items-start justify-between gap-8 border-b-2 border-neutral-900 pb-4">
        <div>
          <p className="text-[18px] font-bold tracking-tight">
            PIZARRO PERFORMANCE GARAGE
          </p>
          <p className="mt-0.5 text-[9px] tracking-[0.18em] text-neutral-600 uppercase">
            Servicio automotriz de alto desempeño
          </p>
          <p className="mt-2 text-[10px] text-neutral-600">
            AutoPulse Elite · Gestión del taller
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-[0.18em] text-neutral-600 uppercase">
            Orden de servicio
          </p>
          <p className="text-[22px] leading-tight font-bold tabular-nums">
            {numeroOrden(orden.id)}
          </p>
          <p className="text-[10px] text-neutral-600">
            {fechaDe(orden.created_at)} · {etiquetaEtapa(orden.estado)}
          </p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-8 text-[10px]">
        <div>
          <p className="mb-1 text-[9px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Cliente
          </p>
          <p className="text-[12px] font-semibold">{orden.cliente.nombre}</p>
          <p className="mt-1 text-neutral-700">
            Tel. {orden.cliente.telefono1 ?? '—'}
          </p>
          <p className="text-neutral-700">
            Correo {orden.cliente.correo ?? '—'}
          </p>
          <p className="text-neutral-700">
            RFC {orden.cliente.rfc ?? '—'} · {orden.cliente.categoria}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Vehículo
          </p>
          <p className="text-[12px] font-semibold">
            {orden.vehiculo.marca} {orden.vehiculo.modelo} {orden.vehiculo.anio}
          </p>
          <p className="mt-1 text-neutral-700">
            Placas {orden.vehiculo.placas} · Color{' '}
            {orden.vehiculo.color ?? '—'}
          </p>
          <p className="text-neutral-700">
            VIN {orden.vehiculo.vin ?? '—'}
          </p>
          <p className="text-neutral-700">
            Kilometraje{' '}
            {orden.vehiculo.kilometraje_entrada === null
              ? '—'
              : `${orden.vehiculo.kilometraje_entrada.toLocaleString('es-MX')} km`}
          </p>
        </div>
      </section>

      <p className="mt-4 text-[10px] text-neutral-700">
        <span className="font-semibold text-neutral-900">
          Trabajo reportado:
        </span>{' '}
        {orden.falla_reportada ?? 'Sin descripción registrada.'}
      </p>

      <table className="mt-4 w-full border-collapse text-[10px]">
        <thead>
          <tr className="border-y border-neutral-300 bg-neutral-100 text-left">
            <th className="py-1.5 pr-2 font-semibold">Concepto</th>
            <th className="px-2 py-1.5 text-right font-semibold">Cant.</th>
            <th className="px-2 py-1.5 text-right font-semibold">
              Precio unit.
            </th>
            <th className="py-1.5 pl-2 text-right font-semibold">Importe</th>
          </tr>
        </thead>
        <tbody>
          {orden.detalles.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="py-3 text-center text-neutral-500"
              >
                Sin servicios ni refacciones registrados.
              </td>
            </tr>
          ) : (
            orden.detalles.map((linea) => (
              <tr key={linea.id} className="border-b border-neutral-200">
                <td className="py-1.5 pr-2">
                  <span className="mr-1.5 text-[8px] tracking-wide text-neutral-500 uppercase">
                    {linea.tipo === 'Servicio' ? 'Serv.' : 'Ref.'}
                  </span>
                  {linea.descripcion}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {linea.cantidad}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {moneda(aNumero(linea.precio_unitario))}
                </td>
                <td className="py-1.5 pl-2 text-right tabular-nums">
                  {moneda(aNumero(linea.importe))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-3 flex justify-end">
        <table className="w-64 text-[10px]">
          <tbody>
            <tr>
              <td className="py-0.5 text-neutral-600">Subtotal</td>
              <td className="py-0.5 text-right tabular-nums">
                {moneda(subtotal)}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 text-neutral-600">IVA (16%)</td>
              <td className="py-0.5 text-right tabular-nums">
                {moneda(iva)}
              </td>
            </tr>
            <tr className="border-t border-neutral-900">
              <td className="pt-1 text-[11px] font-semibold">Total</td>
              <td className="pt-1 text-right text-[13px] font-bold tabular-nums">
                {moneda(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="mt-5 border-t border-neutral-300 pt-3 text-[10px]">
        <p className="text-[9px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
          Recepción del vehículo
        </p>
        <p className="mt-1 text-neutral-700">
          Kilometraje{' '}
          {inspeccion.kilometraje === null
            ? '—'
            : `${inspeccion.kilometraje.toLocaleString('es-MX')} km`}{' '}
          · Combustible {etiquetaCombustible(inspeccion.nivelCombustible)} (
          {inspeccion.nivelCombustible}%) · Estado {inspeccion.estadoGeneral}
        </p>
        <p className="mt-0.5 text-neutral-700">
          Inventario:{' '}
          {inspeccion.inventario
            .map((item) => `${item.nombre} ${item.presente ? 'sí' : 'no'}`)
            .join(' · ')}
        </p>
      </section>

      <div className="mt-14 grid grid-cols-2 gap-10 text-center text-[9px] text-neutral-600">
        <div className="border-t border-neutral-400 pt-1">
          Firma del cliente
        </div>
        <div className="border-t border-neutral-400 pt-1">
          Recibido por el taller
        </div>
      </div>

      <p className="mt-6 text-center text-[8px] text-neutral-500">
        Documento generado por AutoPulse Elite · {numeroOrden(orden.id)} ·{' '}
        {fechaDe(orden.created_at)}
      </p>
    </div>,
    document.body,
  )
}

function EsqueletoDetalle() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-24 rounded-panel border border-line bg-panel" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-56 rounded-panel border border-line bg-panel" />
            <div className="h-56 rounded-panel border border-line bg-panel" />
          </div>
          <div className="h-72 rounded-panel border border-line bg-panel" />
        </div>
        <div className="space-y-5">
          <div className="h-80 rounded-panel border border-line bg-panel" />
          <div className="h-44 rounded-panel border border-line bg-panel" />
        </div>
      </div>
    </div>
  )
}

export function DetalleOrden() {
  const { id } = useParams<{ id: string }>()
  const ordenId = Number(id)
  const idValido = Number.isInteger(ordenId) && ordenId > 0

  const [orden, setOrden] = useState<OrdenDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    if (!idValido) {
      setCargando(false)
      setError('El identificador de la orden no es válido.')
      return
    }

    let vigente = true
    setCargando(true)
    setError(null)

    obtenerOrden(ordenId)
      .then((datos) => {
        if (vigente) {
          setOrden(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return
        }
        setOrden(null)
        setError(mensajeDeError(fallo, 'No se pudo cargar la orden.'))
      })
      .finally(() => {
        if (vigente) {
          setCargando(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [ordenId, idValido, recarga])

  const inspeccion = useMemo(
    () =>
      inspeccionProvisional(
        orden?.id ?? 0,
        orden?.vehiculo.kilometraje_entrada ?? null,
      ),
    [orden],
  )

  const totalConceptos = orden
    ? new Set(orden.detalles.map((linea) => linea.tipo)).size
    : 0

  if (cargando) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <EncabezadoPagina
          etiqueta="Orden de servicio"
          titulo={`ORD-${String(ordenId).padStart(4, '0')}`}
          descripcion="Cargando el detalle de la orden…"
        />
        <EsqueletoDetalle />
      </div>
    )
  }

  if (error || !orden) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <EncabezadoPagina
          etiqueta="Orden de servicio"
          titulo="Detalle de orden"
          descripcion="No pudimos mostrar esta orden."
          acciones={
            <Link to="/ordenes" className={clasesBoton('secundario')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Regresar
            </Link>
          }
        />
        <Panel className="px-5 py-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-negative/30 bg-negative/10 text-negative">
            <CircleAlert className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-4 text-[13px] font-medium text-foreground">
            {error ?? 'La orden no existe o no tienes acceso a ella.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Boton
              variante="secundario"
              onClick={() => setRecarga((valor) => valor + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Boton>
            <Link to="/ordenes" className={clasesBoton('primario')}>
              Ir a órdenes
            </Link>
          </div>
        </Panel>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Orden de servicio"
        titulo={numeroOrden(orden.id)}
        descripcion={`${orden.cliente.nombre} · ${orden.vehiculo.marca} ${orden.vehiculo.modelo} ${orden.vehiculo.anio} · ${orden.vehiculo.placas}`}
        acciones={
          <>
            <Link to="/ordenes" className={clasesBoton('secundario')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Regresar
            </Link>
            <Boton
              variante="secundario"
              onClick={() => setRecarga((valor) => valor + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Boton>
            <Boton onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Imprimir Orden
            </Boton>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaOrden estado={orden.estado} />
        <span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted">
          Ingreso {fechaDe(orden.created_at)}
        </span>
        <span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted">
          Responsable: {orden.mecanico_nombre ?? 'Sin asignar'}
        </span>
        {!orden.activo && (
          <span className="rounded-full border border-negative/30 bg-negative/10 px-2.5 py-1 text-[11px] font-medium text-negative">
            Orden dada de baja
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <TarjetaCliente cliente={orden.cliente} />
            <TarjetaVehiculo vehiculo={orden.vehiculo} />
          </section>

          <Panel>
            <PanelCabecera
              titulo="Falla reportada"
              descripcion="Motivo de ingreso descrito por el cliente al dejar la unidad."
              extra={
                <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium tracking-wide text-faint uppercase sm:self-auto">
                  Recepción
                </span>
              }
            />
            <p className="border-l-2 border-line-strong px-4 py-4 text-[12px] leading-6 text-muted sm:px-5">
              {orden.falla_reportada ?? (
                <span className="text-faint">Sin descripción registrada.</span>
              )}
            </p>
          </Panel>

          <Panel>
            <PanelCabecera
              titulo="Servicios y refacciones"
              descripcion="Conceptos cargados a la orden con su cantidad y precio."
              extra={
                <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
                  {orden.detalles.length} conceptos
                </span>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                      Concepto
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Cant.
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium"
                    >
                      Precio unit.
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium sm:px-5"
                    >
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orden.detalles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-[12px] text-faint sm:px-5"
                      >
                        Aún no hay servicios ni refacciones cargados en esta
                        orden.
                      </td>
                    </tr>
                  ) : (
                    orden.detalles.map((linea) => {
                      const precio = aNumero(linea.precio_unitario)
                      const importe = aNumero(linea.importe)

                      return (
                        <tr
                          key={linea.id}
                          className="transition hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-4 sm:px-5">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-0.5 inline-flex shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${
                                  linea.tipo === 'Servicio'
                                    ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                                    : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                                }`}
                              >
                                {linea.tipo === 'Servicio' ? 'Serv.' : 'Ref.'}
                              </span>
                              <p className="text-[13px] font-medium text-foreground">
                                {linea.descripcion}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right text-muted tabular-nums">
                            {linea.cantidad}
                          </td>
                          <td className="px-4 py-4 text-right tabular-nums">
                            {precio === null ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
                                <EyeOff className="h-3.5 w-3.5" />
                                No visible
                              </span>
                            ) : (
                              <span className="text-muted">
                                {formatearMoneda(precio)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-foreground tabular-nums sm:px-5">
                            {importe === null ? (
                              <span className="text-[11px] font-normal text-faint">
                                No visible
                              </span>
                            ) : (
                              formatearMoneda(importe)
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p className="border-t border-line px-4 py-3 text-[11px] text-faint sm:px-5">
              {totalConceptos > 0
                ? 'Los importes se calculan con el precio pactado al momento de cargar el concepto.'
                : 'Los conceptos se agregan desde el módulo de órdenes del administrador.'}
            </p>
          </Panel>

          <PanelTotales orden={orden} />
        </div>

        <aside className="min-w-0 space-y-5">
          <PanelEstadoVehiculo inspeccion={inspeccion} />
          <PanelDatosOrden orden={orden} />
        </aside>
      </div>

      <HojaImpresion orden={orden} inspeccion={inspeccion} />
    </div>
  )
}
