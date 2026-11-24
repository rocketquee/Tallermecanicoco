import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoCheckbox } from '../../components/formularios/CampoCheckbox'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { clasesBoton } from '../../components/ui/estilosBoton'
import {
  EtiquetaCategoria,
  EtiquetaConfidencial,
  EtiquetaEstado,
} from '../../components/clientes/EtiquetasCliente'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { EstadoTabla } from '../../components/ui/EstadoTabla'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { listarClientes } from '../../services/clientes'
import { mensajeDeError } from '../../services/errores'
import { obtenerUsuario } from '../../services/sesion'
import type { CategoriaCliente, Cliente } from '../../types/clientes'

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

export function ListaClientes() {
  const usuario = obtenerUsuario()
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcion'
  const esMecanico = usuario?.rol === 'Mecanico'

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [categoria, setCategoria] = useState<'' | CategoriaCliente>('')
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  // La busqueda se envia al backend con un pequeno retraso para no saturarlo.
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setBusquedaAplicada(busqueda.trim())
    }, 350)
    return () => window.clearTimeout(temporizador)
  }, [busqueda])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    listarClientes({
      q: busquedaAplicada || undefined,
      categoria: categoria || undefined,
      incluir_inactivos: incluirInactivos,
      limit: 200,
    })
      .then((datos) => {
        if (vigente) {
          setClientes(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return
        }
        setClientes([])
        setError(
          mensajeDeError(
            fallo,
            'No se pudo cargar el directorio de clientes.',
          ),
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
  }, [busquedaAplicada, categoria, incluirInactivos, recarga])

  const totalVip = useMemo(
    () => clientes.filter((cliente) => cliente.categoria === 'VIP').length,
    [clientes],
  )
  const hayFiltros = Boolean(busqueda.trim() || categoria || incluirInactivos)

  function limpiarFiltros() {
    setBusqueda('')
    setBusquedaAplicada('')
    setCategoria('')
    setIncluirInactivos(false)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Directorio del taller"
        titulo="Clientes"
        descripcion="Consulta fichas, contactos y categorías. La búsqueda cubre nombre, correo y teléfonos."
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
              <Link to="/clientes/nuevo" className={clasesBoton('primario')}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo cliente
              </Link>
            )}
          </>
        }
      />

      {esMecanico && (
        <div className="flex gap-3 rounded-panel border border-sky-400/20 bg-sky-400/5 px-4 py-3.5 text-[12px] leading-6 text-sky-100">
          <span aria-hidden="true" className="text-base">
            👁️
          </span>
          <p>
            <strong className="font-semibold">Modo consulta.</strong> Tu rol no
            puede crear ni editar clientes. Los clientes confidenciales
            aparecen enmascarados y sin datos de pago.
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Resumen
          etiqueta="En esta vista"
          valor={cargando ? '…' : clientes.length}
        />
        <Resumen etiqueta="VIP" valor={cargando ? '…' : totalVip} />
        <Resumen
          etiqueta="Regulares"
          valor={cargando ? '…' : clientes.length - totalVip}
        />
      </section>

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_auto] md:items-end">
          <CampoTexto
            id="buscar-clientes"
            etiqueta="Buscar"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre, correo o teléfono"
            autoComplete="off"
          />

          <CampoSelect
            id="filtrar-categoria"
            etiqueta="Categoría"
            value={categoria}
            onChange={(evento) =>
              setCategoria(evento.target.value as '' | CategoriaCliente)
            }
          >
            <option value="">Todas</option>
            <option value="VIP">VIP</option>
            <option value="Regular">Regular</option>
          </CampoSelect>

          <div className="flex flex-wrap items-end gap-2">
            <CampoCheckbox
              id="incluir-inactivos"
              etiqueta="Incluir inactivos"
              checked={incluirInactivos}
              onChange={(evento) => setIncluirInactivos(evento.target.checked)}
            />

            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!hayFiltros}
              className="min-h-11 rounded-panel border border-line px-4 text-[12px] font-medium text-muted transition hover:border-line-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {busquedaAplicada && !cargando && !error && (
          <p className="mt-3 text-[11px] text-faint">
            Resultados para «{busquedaAplicada}».
          </p>
        )}
      </Panel>

      <Panel>
        <PanelCabecera
          titulo="Directorio"
          descripcion="Clientes vigentes, su contacto y categoría comercial."
          extra={
            <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
              {cargando ? 'Cargando…' : `${clientes.length} registros`}
            </span>
          }
        />

        <EstadoTabla
          cargando={cargando}
          error={error}
          vacio={clientes.length === 0}
          tituloVacio={hayFiltros ? 'Sin resultados' : 'Aún no hay clientes'}
          detalleVacio={
            hayFiltros
              ? 'Prueba con otro término de búsqueda o cambia el filtro de categoría.'
              : 'Da de alta al primer cliente para comenzar a registrar vehículos y órdenes de servicio.'
          }
          onReintentar={() => setRecarga((valor) => valor + 1)}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                    Cliente
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Teléfono
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Categoría
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Estado
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
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className={`transition hover:bg-white/[0.025] ${
                      cliente.activo ? '' : 'opacity-60'
                    }`}
                  >
                    <td className="px-4 py-4 sm:px-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-foreground">
                          {cliente.nombre}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {cliente.correo && (
                            <span className="text-[11px] text-faint">
                              {cliente.correo}
                            </span>
                          )}
                          {cliente.confidencial && <EtiquetaConfidencial />}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-muted">
                      {cliente.telefono1 ?? (
                        <span className="text-[11px] text-faint">
                          Sin teléfono
                        </span>
                      )}
                      {cliente.telefono2 && (
                        <p className="mt-0.5 text-[11px] text-faint">
                          {cliente.telefono2}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <EtiquetaCategoria categoria={cliente.categoria} />
                    </td>

                    <td className="px-4 py-4">
                      <EtiquetaEstado activo={cliente.activo} />
                    </td>

                    <td className="px-4 py-4 text-right sm:px-5">
                      <Link
                        to={`/clientes/${cliente.id}`}
                        className={clasesBoton(
                          'secundario',
                          'px-3 py-1.5 text-[11px]',
                        )}
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EstadoTabla>

        {!cargando && !error && clientes.length > 0 && (
          <p className="border-t border-line px-4 py-3 text-[11px] text-faint sm:px-5">
            Se muestran hasta 200 clientes. Usa la búsqueda para acotar el
            resultado.
          </p>
        )}
      </Panel>
    </div>
  )
}
