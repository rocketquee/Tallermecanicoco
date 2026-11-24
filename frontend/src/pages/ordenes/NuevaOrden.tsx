import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CarFront, ClipboardPlus, RefreshCw } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoAreaTexto } from '../../components/formularios/CampoAreaTexto'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { formatearMoneda } from '../../lib/formato'
import { listarClientes } from '../../services/clientes'
import { mensajeDeError } from '../../services/errores'
import { crearOrden } from '../../services/ordenes'
import { listarVehiculos } from '../../services/vehiculos'
import type { Cliente } from '../../types/clientes'
import type { Vehiculo } from '../../types/vehiculos'

/**
 * Alta de una orden de servicio. La orden nace en estado Recibido y el
 * mecánico responsable se puede asignar después desde el flujo de trabajo.
 */
export function NuevaOrden() {
  const navegar = useNavigate()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  const [clienteId, setClienteId] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [falla, setFalla] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setErrorCarga(null)

    Promise.all([listarClientes({ limit: 200 }), listarVehiculos({ limit: 200 })])
      .then(([listaClientes, listaVehiculos]) => {
        if (!vigente) {
          return
        }
        setClientes(listaClientes)
        setVehiculos(listaVehiculos)
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setErrorCarga(
            mensajeDeError(fallo, 'No se pudieron cargar clientes y vehículos.'),
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

  const vehiculosDelCliente = useMemo(() => {
    if (!clienteId) {
      return []
    }
    return vehiculos.filter(
      (vehiculo) => vehiculo.cliente_id === Number(clienteId),
    )
  }, [vehiculos, clienteId])

  const vehiculoSeleccionado = useMemo(
    () => vehiculos.find((vehiculo) => vehiculo.id === Number(vehiculoId)),
    [vehiculos, vehiculoId],
  )

  function cambiarCliente(valor: string) {
    setClienteId(valor)
    setVehiculoId('')
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    if (!clienteId || !vehiculoId) {
      setError('Selecciona el cliente y el vehículo que ingresa al taller.')
      return
    }

    setGuardando(true)
    try {
      const orden = await crearOrden({
        cliente_id: Number(clienteId),
        vehiculo_id: Number(vehiculoId),
        falla_reportada: falla.trim() || null,
      })
      navegar(`/ordenes/${orden.id}`, {
        replace: true,
        state: { mensaje: 'Orden creada correctamente en estado Recibido.' },
      })
    } catch (fallo: unknown) {
      setError(mensajeDeError(fallo, 'No se pudo crear la orden.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Link
        to="/ordenes"
        className="inline-flex items-center gap-2 text-[12px] text-muted transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a órdenes de servicio
      </Link>

      <EncabezadoPagina
        etiqueta="Órdenes · Alta"
        titulo="Nueva orden de servicio"
        descripcion="Registra el ingreso de una unidad. La orden queda en estado Recibido y aparece de inmediato en el tablero del taller."
      />

      {errorCarga ? (
        <Panel className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-5 text-negative">{errorCarga}</p>
          <Boton
            variante="secundario"
            className="px-3 py-2 text-xs"
            onClick={() => setRecarga((valor) => valor + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Boton>
        </Panel>
      ) : null}

      <form onSubmit={guardar} className="space-y-5">
        <Panel>
          <PanelCabecera
            titulo="Cliente y vehículo"
            descripcion="Solo se listan los vehículos que pertenecen al cliente seleccionado."
          />

          <div className="space-y-4 px-4 py-4 sm:px-5">
            <CampoSelect
              etiqueta="Cliente"
              id="cliente"
              required
              value={clienteId}
              disabled={cargando || guardando}
              onChange={(evento) => cambiarCliente(evento.target.value)}
            >
              <option value="" className="bg-panel">
                {cargando ? 'Cargando clientes…' : 'Selecciona un cliente'}
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id} className="bg-panel">
                  {cliente.nombre}
                  {cliente.categoria === 'VIP' ? ' · VIP' : ''}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              etiqueta="Vehículo"
              id="vehiculo"
              required
              value={vehiculoId}
              disabled={
                cargando || guardando || !clienteId || vehiculosDelCliente.length === 0
              }
              onChange={(evento) => setVehiculoId(evento.target.value)}
            >
              <option value="" className="bg-panel">
                {!clienteId
                  ? 'Primero selecciona un cliente'
                  : vehiculosDelCliente.length === 0
                    ? 'El cliente no tiene vehículos registrados'
                    : 'Selecciona un vehículo'}
              </option>
              {vehiculosDelCliente.map((vehiculo) => (
                <option
                  key={vehiculo.id}
                  value={vehiculo.id}
                  className="bg-panel"
                >
                  {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio} ·{' '}
                  {vehiculo.placas}
                </option>
              ))}
            </CampoSelect>

            {clienteId && vehiculosDelCliente.length === 0 ? (
              <p className="rounded-panel border border-amber-400/30 bg-amber-400/5 px-3 py-2.5 text-[11.5px] leading-5 text-amber-200">
                Este cliente todavía no tiene vehículos. Registra la unidad
                desde{' '}
                <Link
                  to="/vehiculos/nuevo"
                  className="font-medium underline underline-offset-2"
                >
                  Vehículos · Alta
                </Link>{' '}
                y vuelve a esta pantalla.
              </p>
            ) : null}
          </div>
        </Panel>

        {vehiculoSeleccionado ? (
          <Panel>
            <PanelCabecera
              titulo="Unidad que ingresa"
              descripcion="Datos del vehículo seleccionado."
              extra={
                <CarFront className="h-4 w-4 text-faint" strokeWidth={1.7} />
              }
            />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 text-[12px] sm:grid-cols-3 sm:px-5">
              <div>
                <dt className="text-[10px] tracking-wide text-faint uppercase">
                  Placas
                </dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {vehiculoSeleccionado.placas}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wide text-faint uppercase">
                  Marca y modelo
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wide text-faint uppercase">
                  Año
                </dt>
                <dd className="mt-0.5 text-foreground tabular-nums">
                  {vehiculoSeleccionado.anio}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wide text-faint uppercase">
                  Color
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {vehiculoSeleccionado.color ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wide text-faint uppercase">
                  Kilometraje
                </dt>
                <dd className="mt-0.5 text-foreground tabular-nums">
                  {vehiculoSeleccionado.kilometraje_entrada === null
                    ? '—'
                    : `${vehiculoSeleccionado.kilometraje_entrada.toLocaleString('es-MX')} km`}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wide text-faint uppercase">
                  Valor aproximado
                </dt>
                <dd className="mt-0.5 text-foreground tabular-nums">
                  {vehiculoSeleccionado.valor_aproximado === null
                    ? 'No visible'
                    : formatearMoneda(
                        Number(vehiculoSeleccionado.valor_aproximado),
                      )}
                </dd>
              </div>
            </dl>
          </Panel>
        ) : null}

        <Panel>
          <PanelCabecera
            titulo="Motivo de ingreso"
            descripcion="Describe la falla o el servicio solicitado por el cliente."
          />
          <div className="px-4 py-4 sm:px-5">
            <CampoAreaTexto
              etiqueta="Falla reportada (opcional)"
              id="falla"
              rows={4}
              maxLength={2000}
              placeholder="Ej. Ruido en la suspensión delantera al pasar topes."
              value={falla}
              disabled={guardando}
              onChange={(evento) => setFalla(evento.target.value)}
            />
            <p className="mt-1.5 text-right text-[10px] text-faint tabular-nums">
              {falla.length}/2000
            </p>
          </div>
        </Panel>

        {error ? (
          <p
            role="alert"
            className="rounded-panel border border-negative/30 bg-negative/5 px-3 py-2.5 text-[12px] leading-5 text-negative"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Boton type="submit" disabled={guardando || cargando}>
            <ClipboardPlus className="h-3.5 w-3.5" />
            {guardando ? 'Registrando…' : 'Registrar orden'}
          </Boton>
          <Link to="/ordenes" className={clasesBoton('secundario')}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
