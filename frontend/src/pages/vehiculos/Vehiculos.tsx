import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, RefreshCw } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { EstadoTabla } from '../../components/ui/EstadoTabla'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { useAuth } from '../../context/useAuth'
import { listarClientes } from '../../services/clientes'
import { mensajeDeError } from '../../services/errores'
import { listarVehiculos } from '../../services/vehiculos'
import type { Cliente } from '../../types/clientes'
import type { Vehiculo } from '../../types/vehiculos'
import { EditarVehiculoModal } from './EditarVehiculoModal'

interface EstadoUbicacion {
  mensaje?: string
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

export function Vehiculos() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcion'

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Record<number, Cliente>>({})
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)
  const [mensaje, setMensaje] = useState<string | null>(
    () => (ubicacion.state as EstadoUbicacion | null)?.mensaje ?? null,
  )
  const [editando, setEditando] = useState<Vehiculo | null>(null)

  // El aviso de "vehículo creado" viaja en el state de la ruta; se consume
  // una sola vez para que no reaparezca al recargar.
  useEffect(() => {
    if ((ubicacion.state as EstadoUbicacion | null)?.mensaje) {
      navegar(ubicacion.pathname, { replace: true, state: null })
    }
  }, [ubicacion.state, ubicacion.pathname, navegar])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    Promise.all([
      listarVehiculos({ limit: 200 }),
      // El endpoint de vehiculos devuelve cliente_id; se consulta el
      // directorio para resolver el nombre del dueño en la tabla.
      listarClientes({ incluir_inactivos: true, limit: 200 }),
    ])
      .then(([datosVehiculos, datosClientes]) => {
        if (!vigente) {
          return
        }

        const mapaClientes: Record<number, Cliente> = {}
        for (const cliente of datosClientes) {
          mapaClientes[cliente.id] = cliente
        }

        setVehiculos(datosVehiculos)
        setClientes(mapaClientes)
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return
        }
        setVehiculos([])
        setClientes({})
        setError(
          mensajeDeError(fallo, 'No se pudieron cargar los vehículos.'),
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

  const vehiculosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) {
      return vehiculos
    }

    return vehiculos.filter((vehiculo) => {
      const dueno = clientes[vehiculo.cliente_id]?.nombre ?? ''
      return [
        vehiculo.placas,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.vin ?? '',
        String(vehiculo.anio),
        dueno,
      ].some((valor) => valor.toLowerCase().includes(texto))
    })
  }, [vehiculos, clientes, busqueda])

  const totalMarcas = useMemo(
    () => new Set(vehiculos.map((vehiculo) => vehiculo.marca)).size,
    [vehiculos],
  )
  const totalDuenos = useMemo(
    () => new Set(vehiculos.map((vehiculo) => vehiculo.cliente_id)).size,
    [vehiculos],
  )

  const hayBusqueda = Boolean(busqueda.trim())

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Patrimonio del taller"
        titulo="Vehículos"
        descripcion="Unidades registradas, su dueño y los datos de identificación que usa el taller para recibirlas."
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
            {puedeGestionar && (
              <Link
                to="/vehiculos/nuevo"
                className={clasesBoton('primario')}
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo vehículo
              </Link>
            )}
          </>
        }
      />

      {mensaje && (
        <div
          role="status"
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

      <section className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Resumen
          etiqueta="En esta vista"
          valor={cargando ? '…' : vehiculosFiltrados.length}
        />
        <Resumen etiqueta="Marcas" valor={cargando ? '…' : totalMarcas} />
        <Resumen
          etiqueta="Clientes con unidad"
          valor={cargando ? '…' : totalDuenos}
        />
      </section>

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <CampoTexto
            id="buscar-vehiculos"
            etiqueta="Buscar"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Placas, marca, modelo, VIN o dueño"
            autoComplete="off"
          />

          <button
            type="button"
            onClick={() => setBusqueda('')}
            disabled={!hayBusqueda}
            className="min-h-11 rounded-panel border border-line px-4 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 md:mb-0.5"
          >
            Limpiar búsqueda
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelCabecera
          titulo="Flota registrada"
          descripcion="Placas, marca, modelo y dueño de cada unidad vigente."
          extra={
            <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
              {cargando
                ? 'Cargando…'
                : `${vehiculosFiltrados.length} vehículos`}
            </span>
          }
        />

        <EstadoTabla
          cargando={cargando}
          error={error}
          vacio={vehiculosFiltrados.length === 0}
          tituloVacio={hayBusqueda ? 'Sin resultados' : 'Aún no hay vehículos'}
          detalleVacio={
            hayBusqueda
              ? 'Prueba con otra placa, marca, modelo o nombre de dueño.'
              : 'Cuando registres la primera unidad aparecerá en esta tabla.'
          }
          onReintentar={() => setRecarga((valor) => valor + 1)}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-[13px]">
              <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                    Placas
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Marca
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Modelo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Dueño
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium sm:px-5"
                  >
                    Año
                  </th>
                  {puedeGestionar && (
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium sm:px-5"
                    >
                      <span className="sr-only">Acciones</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {vehiculosFiltrados.map((vehiculo) => {
                  const dueno = clientes[vehiculo.cliente_id]
                  const detalle = [
                    vehiculo.color,
                    vehiculo.vin ? `VIN ${vehiculo.vin}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')

                  return (
                    <tr
                      key={vehiculo.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <span className="inline-flex rounded-md border border-line bg-white/[0.03] px-2 py-1 font-mono text-[11px] font-semibold tracking-wider text-foreground">
                          {vehiculo.placas}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-foreground">
                        {vehiculo.marca}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">
                          {vehiculo.modelo}
                        </p>
                        <p
                          className="mt-0.5 max-w-[240px] truncate text-[11px] text-faint"
                          title={detalle || undefined}
                        >
                          {detalle || 'Sin datos adicionales'}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {dueno ? (
                          <Link
                            to={`/clientes/${dueno.id}`}
                            className="font-medium text-foreground underline decoration-line-strong underline-offset-4 transition hover:text-white"
                          >
                            {dueno.nombre}
                          </Link>
                        ) : (
                          <span className="text-[11px] text-faint">
                            Sin dueño registrado
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right text-muted tabular-nums sm:px-5">
                        {vehiculo.anio}
                      </td>

                      {puedeGestionar && (
                        <td className="px-4 py-4 text-right sm:px-5">
                          <Boton
                            variante="secundario"
                            onClick={() => setEditando(vehiculo)}
                            className="min-h-9 px-3 py-1.5 text-[11px]"
                            title="Editar vehículo"
                            aria-label={`Editar ${vehiculo.placas}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Boton>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </EstadoTabla>

        {!cargando && !error && vehiculosFiltrados.length > 0 && (
          <p className="border-t border-line px-4 py-3 text-[11px] text-faint sm:px-5">
            Se muestran hasta 200 vehículos. Usa la búsqueda para acotar el
            resultado.
          </p>
        )}
      </Panel>

      {editando && (
        <EditarVehiculoModal
          vehiculo={editando}
          clientes={Object.values(clientes)}
          onCerrar={() => setEditando(null)}
          onGuardado={(texto) => {
            setRecarga((valor) => valor + 1)
            setEditando(null)
            setMensaje(texto)
          }}
        />
      )}
    </div>
  )
}
