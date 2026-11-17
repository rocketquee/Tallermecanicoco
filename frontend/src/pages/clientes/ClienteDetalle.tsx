import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Boton } from '../../components/Boton'
import { clasesBoton } from '../../components/estilosBoton'
import {
  EtiquetaCategoria,
  EtiquetaConfidencial,
  EtiquetaEstado,
} from '../../components/clientes/EtiquetasCliente'
import { FormularioCliente } from '../../components/clientes/FormularioCliente'
import { actualizarCliente, obtenerCliente } from '../../services/clientes'
import { mensajeDeError } from '../../services/errores'
import { obtenerUsuario } from '../../services/sesion'
import type {
  ClienteConVehiculos,
  ClientePayload,
  VehiculoResumen,
} from '../../types/clientes'

interface EstadoUbicacion {
  mensaje?: string
}

function formatearFecha(valor: string): string {
  // El backend guarda fechas naive en UTC; se marca la zona si no viene.
  const normalizado = /(Z|[+-]\d{2}:?\d{2})$/i.test(valor) ? valor : `${valor}Z`
  const fecha = new Date(normalizado)
  if (Number.isNaN(fecha.getTime())) {
    return valor
  }
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha)
}

function formatearPorcentaje(valor: string): string {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return valor
  }
  return `${new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 2,
  }).format(numero)}%`
}

function formatearMoneda(valor: string): string {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return valor
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(numero)
}

function formatearKilometraje(valor: number): string {
  return `${new Intl.NumberFormat('es-MX').format(valor)} km`
}

function Tarjeta({
  titulo,
  descripcion,
  children,
  className = '',
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-panel border border-line bg-panel p-5 sm:p-6 ${className}`}
    >
      <h2 className="text-sm font-semibold text-foreground">{titulo}</h2>
      {descripcion && (
        <p className="mt-1 text-xs leading-5 text-faint">{descripcion}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Dato({
  etiqueta,
  valor,
  className = '',
}: {
  etiqueta: string
  valor: ReactNode
  className?: string
}) {
  const vacio = valor === null || valor === undefined || valor === ''
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold tracking-wider text-faint uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-foreground">
        {vacio ? <span className="text-faint">—</span> : valor}
      </dd>
    </div>
  )
}

function VehiculosCliente({
  vehiculos,
  esMecanico,
}: {
  vehiculos: VehiculoResumen[]
  esMecanico: boolean
}) {
  return (
    <section className="overflow-hidden rounded-panel border border-line bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Vehículos</h2>
          <p className="mt-0.5 text-xs text-faint">
            Unidades vigentes registradas a nombre del cliente.
          </p>
        </div>
        <span className="rounded-full border border-line bg-panel px-2.5 py-1 text-xs font-medium text-muted">
          {vehiculos.length}
        </span>
      </div>

      {vehiculos.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-muted">
            Este cliente todavía no tiene vehículos registrados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/[0.02] text-[11px] tracking-wider text-faint uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                  Placas
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Vehículo
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Año
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Kilometraje
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right font-semibold sm:px-5"
                >
                  Valor aprox.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {vehiculos.map((vehiculo) => (
                <tr
                  key={vehiculo.id}
                  className="transition hover:bg-white/[0.025]"
                >
                  <td className="px-4 py-3.5 sm:px-5">
                    <span className="inline-flex rounded-md border border-line bg-white/[0.03] px-2 py-1 font-mono text-xs font-semibold tracking-wider text-foreground">
                      {vehiculo.placas}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-foreground">
                      {vehiculo.marca} {vehiculo.modelo}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {vehiculo.color ? `${vehiculo.color} · ` : ''}
                      {vehiculo.vin ? `VIN ${vehiculo.vin}` : 'Sin VIN'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {vehiculo.anio}
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {vehiculo.kilometraje_entrada == null
                      ? '—'
                      : formatearKilometraje(vehiculo.kilometraje_entrada)}
                  </td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    {vehiculo.valor_aproximado == null ? (
                      esMecanico ? (
                        <span className="text-xs font-medium text-faint">
                          Oculto para tu rol
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )
                    ) : (
                      <span className="font-medium text-foreground">
                        {formatearMoneda(vehiculo.valor_aproximado)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function ClienteDetalle() {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const usuario = obtenerUsuario()
  const esMecanico = usuario?.rol === 'Mecanico'

  const clienteId = Number(id)
  const idValido = Number.isInteger(clienteId) && clienteId > 0

  const [cliente, setCliente] = useState<ClienteConVehiculos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(
    () => (ubicacion.state as EstadoUbicacion | null)?.mensaje ?? null,
  )

  // El aviso de "cliente creado" viaja en el state de la ruta; se consume una
  // sola vez para que no reaparezca al recargar.
  useEffect(() => {
    if ((ubicacion.state as EstadoUbicacion | null)?.mensaje) {
      navegar(ubicacion.pathname, { replace: true, state: null })
    }
  }, [ubicacion.state, ubicacion.pathname, navegar])

  const cargar = useCallback(async () => {
    if (!idValido) {
      setError('El identificador del cliente no es válido.')
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)
    try {
      const datos = await obtenerCliente(clienteId)
      setCliente(datos)
    } catch (fallo) {
      setCliente(null)
      setError(mensajeDeError(fallo, 'No se pudo cargar la ficha del cliente.'))
    } finally {
      setCargando(false)
    }
  }, [clienteId, idValido])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function guardar(payload: ClientePayload) {
    setGuardando(true)
    setErrorGuardado(null)
    try {
      const actualizado = await actualizarCliente(clienteId, payload)
      setCliente((previo) =>
        previo ? { ...previo, ...actualizado } : previo,
      )
      setEditando(false)
      setMensaje('Cambios guardados correctamente.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (fallo) {
      setErrorGuardado(
        mensajeDeError(fallo, 'No se pudieron guardar los cambios.'),
      )
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="space-y-5" aria-busy="true">
        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="rounded-panel border border-line bg-panel p-6">
          <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-4 h-8 w-72 max-w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-panel border border-line bg-panel" />
          <div className="h-48 animate-pulse rounded-panel border border-line bg-panel" />
        </div>
      </div>
    )
  }

  if (error || !cliente) {
    return (
      <div className="space-y-5">
        <Link
          to="/clientes"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
        >
          <span aria-hidden="true">←</span> Volver a clientes
        </Link>
        <div
          role="alert"
          className="rounded-panel border border-red-500/30 bg-red-500/5 p-6"
        >
          <h1 className="text-lg font-semibold text-foreground">
            No se pudo abrir la ficha
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {error ?? 'El cliente solicitado no existe.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Boton onClick={() => void cargar()}>Reintentar</Boton>
            <Link to="/clientes" className={clasesBoton('secundario')}>
              Ir al directorio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const vehiculos = cliente.vehiculos ?? []
  const puedeEditar = !esMecanico
  const enmascarado = esMecanico && cliente.confidencial
  const visible = (valor: string | null) =>
    enmascarado ? 'Oculto para tu rol' : valor

  return (
    <div className="space-y-5">
      <Link
        to="/clientes"
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
      >
        <span aria-hidden="true">←</span> Volver a clientes
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.2em] text-faint uppercase">
            Ficha del cliente · #{cliente.id}
          </p>
          <h1 className="mt-2 truncate text-3xl font-semibold text-foreground sm:text-4xl">
            {cliente.nombre}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <EtiquetaCategoria categoria={cliente.categoria} />
            <EtiquetaEstado activo={cliente.activo} />
            {cliente.confidencial && <EtiquetaConfidencial />}
          </div>
        </div>

        {puedeEditar && !editando && (
          <Boton onClick={() => setEditando(true)}>Editar datos</Boton>
        )}
      </div>

      {mensaje && (
        <div
          role="status"
          className="flex items-start justify-between gap-4 rounded-panel border border-positive/30 bg-positive/10 px-4 py-3.5 text-sm text-foreground"
        >
          <p className="leading-6">{mensaje}</p>
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

      {enmascarado && (
        <div className="flex gap-3 rounded-panel border border-line-strong bg-white/[0.03] px-4 py-3.5 text-sm text-muted">
          <span aria-hidden="true" className="text-base">
            🔒
          </span>
          <p className="leading-6">
            <strong className="font-semibold">Ficha confidencial.</strong> Los
            datos personales y fiscales están ocultos para tu rol. Solo se
            muestran las placas y el trabajo asignado (SEG-17).
          </p>
        </div>
      )}

      {esMecanico && !enmascarado && (
        <div className="flex gap-3 rounded-panel border border-sky-400/20 bg-sky-400/5 px-4 py-3.5 text-sm text-sky-100">
          <span aria-hidden="true" className="text-base">
            👁️
          </span>
          <p className="leading-6">
            <strong className="font-semibold">Modo consulta.</strong> Tu rol no
            puede editar clientes y no muestra descuentos, condiciones de pago
            ni valores de vehículos (SEG-18).
          </p>
        </div>
      )}

      {!cliente.activo && puedeEditar && (
        <div className="rounded-panel border border-line bg-panel px-4 py-3.5 text-sm text-muted">
          Este cliente está dado de baja lógica. Puedes reactivarlo desde
          «Editar datos» marcando «Cliente activo».
        </div>
      )}

      {editando && puedeEditar ? (
        <FormularioCliente
          cliente={cliente}
          modo="editar"
          guardando={guardando}
          error={errorGuardado}
          onGuardar={guardar}
          onCancelar={() => {
            setEditando(false)
            setErrorGuardado(null)
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta
              titulo="Contacto"
              descripcion="Datos para localizar al cliente y coordinar entregas."
            >
              <dl className="grid gap-4 sm:grid-cols-2">
                <Dato
                  etiqueta="Teléfono principal"
                  valor={visible(cliente.telefono1)}
                />
                <Dato
                  etiqueta="Teléfono alterno"
                  valor={visible(cliente.telefono2)}
                />
                <Dato etiqueta="Correo" valor={visible(cliente.correo)} />
                <Dato
                  etiqueta="Asistente / chofer"
                  valor={visible(cliente.nombre_asistente)}
                />
                <Dato
                  className="sm:col-span-2"
                  etiqueta="Dirección"
                  valor={visible(cliente.direccion)}
                />
              </dl>
            </Tarjeta>

            <Tarjeta
              titulo="Clasificación y pagos"
              descripcion="Condiciones comerciales registradas para el cliente."
            >
              <dl className="grid gap-4 sm:grid-cols-2">
                <Dato
                  etiqueta="Categoría"
                  valor={
                    <EtiquetaCategoria categoria={cliente.categoria} />
                  }
                />
                <Dato
                  etiqueta="Descuento mano de obra"
                  valor={
                    esMecanico
                      ? 'No disponible para tu rol'
                      : formatearPorcentaje(cliente.descuento_mano_obra)
                  }
                />
                <Dato
                  etiqueta="Pagos parciales"
                  valor={
                    esMecanico
                      ? 'No disponible para tu rol'
                      : cliente.permite_pagos_parciales
                        ? 'Sí'
                        : 'No'
                  }
                />
                <Dato
                  etiqueta="Confidencialidad"
                  valor={
                    cliente.confidencial
                      ? 'Restringida para Mecánicos'
                      : 'Datos visibles'
                  }
                />
              </dl>
            </Tarjeta>

            <Tarjeta
              titulo="Datos fiscales"
              descripcion="Información para facturación CFDI 4.0."
            >
              <dl className="grid gap-4 sm:grid-cols-2">
                <Dato etiqueta="RFC" valor={visible(cliente.rfc)} />
                <Dato
                  etiqueta="Código postal"
                  valor={visible(cliente.codigo_postal)}
                />
                <Dato
                  className="sm:col-span-2"
                  etiqueta="Razón social"
                  valor={visible(cliente.razon_social)}
                />
                <Dato
                  className="sm:col-span-2"
                  etiqueta="Régimen fiscal"
                  valor={visible(cliente.regimen_fiscal)}
                />
              </dl>
            </Tarjeta>

            <Tarjeta
              titulo="Notas internas"
              descripcion="Solo visibles para Administrador y Recepción."
            >
              {enmascarado ? (
                <p className="text-sm text-faint">Oculto para tu rol.</p>
              ) : cliente.notas ? (
                <p className="whitespace-pre-line text-sm leading-6 text-muted">
                  {cliente.notas}
                </p>
              ) : (
                <p className="text-sm text-faint">Sin notas registradas.</p>
              )}
            </Tarjeta>
          </div>

          <VehiculosCliente
            vehiculos={vehiculos}
            esMecanico={esMecanico}
          />

          <p className="text-xs leading-5 text-faint">
            Cliente #{cliente.id} · Alta: {formatearFecha(cliente.created_at)} ·
            Última actualización: {formatearFecha(cliente.updated_at)}
          </p>
        </>
      )}

      {editando && puedeEditar && (
        <VehiculosCliente vehiculos={vehiculos} esMecanico={esMecanico} />
      )}
    </div>
  )
}
