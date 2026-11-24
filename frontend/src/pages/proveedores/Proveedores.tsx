import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  PackageSearch,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store,
  Truck,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { EstadoTabla } from '../../components/ui/EstadoTabla'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { useAuth } from '../../context/useAuth'
import { formatearFechaCorta, formatearMoneda } from '../../lib/formato'
import { listarCompras } from '../../services/compras'
import { mensajeDeError } from '../../services/errores'
import { listarProveedores } from '../../services/proveedores'
import type {
  Compra,
  EstadoCompra,
  Moneda,
  Proveedor,
} from '../../types/proveedores'
import { ProveedorModal } from './ProveedorModal'
import { RegistrarCompraModal } from './RegistrarCompraModal'

type Pestana = 'proveedores' | 'compras'

const ESTILOS_COMPRA: Record<EstadoCompra, string> = {
  Borrador: 'border-line-strong bg-white/[0.06] text-muted',
  Aprobada: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  Enviada: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  Recibida: 'border-positive/30 bg-positive/10 text-positive',
  Cancelada: 'border-negative/30 bg-negative/10 text-negative',
}

/** Importe en la moneda original de la compra (PRV-09). */
function formatearImporte(valor: string | null, moneda: Moneda): string {
  if (valor === null) {
    return '—'
  }
  const numero = Number(valor)
  if (!Number.isFinite(numero)) {
    return '—'
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)
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

/** Esqueleto con el mismo ancho de columnas que la tabla de proveedores. */
function EsqueletoProveedores({ filas = 5 }: { filas?: number }) {
  return (
    <div
      className="overflow-x-auto"
      aria-busy="true"
      aria-label="Cargando proveedores"
    >
      <table className="w-full min-w-[880px] text-left">
        <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
          <tr>
            <th className="px-4 py-3 font-medium sm:px-5">Proveedor</th>
            <th className="px-4 py-3 font-medium">País</th>
            <th className="px-4 py-3 font-medium">Contacto</th>
            <th className="px-4 py-3 font-medium">Entrega</th>
            <th className="px-4 py-3 font-medium">Moneda</th>
            <th className="px-4 py-3 text-right font-medium sm:px-5">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {Array.from({ length: filas }, (_, fila) => (
            <tr key={fila} className="animate-pulse">
              <td className="px-4 py-4 sm:px-5">
                <div className="h-3.5 w-44 max-w-full rounded bg-white/[0.07]" />
                <div className="mt-2 h-2.5 w-24 rounded bg-white/[0.05]" />
              </td>
              <td className="px-4 py-4">
                <div className="h-3.5 w-20 rounded bg-white/[0.06]" />
              </td>
              <td className="px-4 py-4">
                <div className="h-3.5 w-32 rounded bg-white/[0.06]" />
                <div className="mt-2 h-2.5 w-24 rounded bg-white/[0.05]" />
              </td>
              <td className="px-4 py-4">
                <div className="h-6 w-16 rounded-full bg-white/[0.06]" />
              </td>
              <td className="px-4 py-4">
                <div className="h-3.5 w-12 rounded bg-white/[0.06]" />
              </td>
              <td className="px-4 py-4 text-right sm:px-5">
                <div className="ml-auto h-7 w-16 rounded bg-white/[0.05]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Proveedores y compras (PRV-01 a PRV-09).
 *
 * Administrador: directorio editable y órdenes de compra con importes.
 * Recepción: consulta el directorio; las escrituras y los importes quedan
 * reservados al Administrador (SEG-02).
 */
export function Proveedores() {
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === 'Administrador'

  const [pestana, setPestana] = useState<Pestana>('proveedores')
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [cargandoProveedores, setCargandoProveedores] = useState(true)
  const [cargandoCompras, setCargandoCompras] = useState(esAdministrador)
  const [errorProveedores, setErrorProveedores] = useState<string | null>(null)
  const [errorCompras, setErrorCompras] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [recargaProveedores, setRecargaProveedores] = useState(0)
  const [recargaCompras, setRecargaCompras] = useState(0)
  const [modalProveedor, setModalProveedor] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(
    null,
  )
  const [modalCompra, setModalCompra] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargandoProveedores(true)
    setErrorProveedores(null)

    listarProveedores({ limit: 200 })
      .then((datos) => {
        if (vigente) {
          setProveedores(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setProveedores([])
          setErrorProveedores(
            mensajeDeError(fallo, 'No se pudo cargar el directorio de proveedores.'),
          )
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoProveedores(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [recargaProveedores])

  useEffect(() => {
    if (!esAdministrador) {
      return
    }

    let vigente = true
    setCargandoCompras(true)
    setErrorCompras(null)

    listarCompras({ limit: 200 })
      .then((datos) => {
        if (vigente) {
          setCompras(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setCompras([])
          setErrorCompras(
            mensajeDeError(fallo, 'No se pudieron cargar las órdenes de compra.'),
          )
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoCompras(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [recargaCompras, esAdministrador])

  // El aviso de éxito desaparece solo para no ocupar espacio permanente.
  useEffect(() => {
    if (!aviso) {
      return
    }
    const temporizador = window.setTimeout(() => setAviso(null), 6000)
    return () => window.clearTimeout(temporizador)
  }, [aviso])

  const proveedoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) {
      return proveedores
    }
    return proveedores.filter((proveedor) =>
      [
        proveedor.nombre,
        proveedor.pais,
        proveedor.contacto ?? '',
        proveedor.correo ?? '',
        proveedor.telefono ?? '',
      ].some((valor) => valor.toLowerCase().includes(texto)),
    )
  }, [proveedores, busqueda])

  const promedioEntrega = useMemo(() => {
    const dias = proveedores
      .map((proveedor) => proveedor.tiempo_entrega_dias)
      .filter((valor): valor is number => valor !== null)
    if (dias.length === 0) {
      return '—'
    }
    const promedio = Math.round(
      dias.reduce((total, valor) => total + valor, 0) / dias.length,
    )
    return `${promedio} días`
  }, [proveedores])

  const comprasEnBorrador = useMemo(
    () => compras.filter((compra) => compra.estado === 'Borrador').length,
    [compras],
  )

  const totalCompradoMxn = useMemo(
    () =>
      compras.reduce(
        (total, compra) =>
          total + (compra.total_mxn ? Number(compra.total_mxn) : 0),
        0,
      ),
    [compras],
  )

  function abrirNuevoProveedor() {
    setProveedorEditando(null)
    setModalProveedor(true)
  }

  function abrirEdicion(proveedor: Proveedor) {
    setProveedorEditando(proveedor)
    setModalProveedor(true)
  }

  function cerrarModalProveedor() {
    setModalProveedor(false)
    setProveedorEditando(null)
  }

  function alGuardarProveedor(mensaje: string) {
    cerrarModalProveedor()
    setAviso(mensaje)
    setRecargaProveedores((valor) => valor + 1)
  }

  function alGuardarCompra(mensaje: string) {
    setModalCompra(false)
    setAviso(mensaje)
    setRecargaCompras((valor) => valor + 1)
    setPestana('compras')
  }

  function recargar() {
    setRecargaProveedores((valor) => valor + 1)
    if (esAdministrador) {
      setRecargaCompras((valor) => valor + 1)
    }
  }

  const actualizando = cargandoProveedores || cargandoCompras

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Abastecimiento"
        titulo="Proveedores y compras"
        descripcion="Directorio de proveedores con su tiempo de entrega y órdenes de compra de refacciones. Cada alta, edición y compra queda en la bitácora."
        acciones={
          <>
            {esAdministrador && (
              <>
                <Boton variante="secundario" onClick={abrirNuevoProveedor}>
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo proveedor
                </Boton>
                <Boton onClick={() => setModalCompra(true)}>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Registrar compra de refacción
                </Boton>
              </>
            )}
            <Boton variante="secundario" onClick={recargar} disabled={actualizando}>
              <RefreshCw
                className={`h-3.5 w-3.5 ${actualizando ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Boton>
          </>
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

      <section className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-panel sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <ResumenCelda
          etiqueta="Proveedores vigentes"
          valor={proveedores.length}
          detalle="Con compras y refacciones asociadas"
        />
        <ResumenCelda
          etiqueta="Entrega promedio"
          valor={promedioEntrega}
          detalle="Calculada con los días de entrega"
        />
        {esAdministrador ? (
          <>
            <ResumenCelda
              etiqueta="Compras en borrador"
              valor={comprasEnBorrador}
              detalle="Esperando aprobación (PRV-07)"
            />
            <ResumenCelda
              etiqueta="Total comprado"
              valor={formatearMoneda(totalCompradoMxn)}
              detalle="Equivalente en MXN de todas las compras"
            />
          </>
        ) : (
          <>
            <ResumenCelda
              etiqueta="Países"
              valor={new Set(proveedores.map((item) => item.pais)).size}
              detalle="Origen de las refacciones"
            />
            <ResumenCelda
              etiqueta="Monedas"
              valor={new Set(proveedores.map((item) => item.moneda)).size}
              detalle="Monedas de cotización registradas"
            />
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-1 rounded-panel border border-line bg-panel p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setPestana('proveedores')}
          aria-pressed={pestana === 'proveedores'}
          className={`inline-flex min-h-9 items-center gap-2 rounded-[6px] px-3 text-[12px] font-medium transition ${
            pestana === 'proveedores'
              ? 'bg-white/[0.07] text-foreground'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Proveedores
          <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] tabular-nums text-faint">
            {proveedores.length}
          </span>
        </button>

        {esAdministrador && (
          <button
            type="button"
            onClick={() => setPestana('compras')}
            aria-pressed={pestana === 'compras'}
            className={`inline-flex min-h-9 items-center gap-2 rounded-[6px] px-3 text-[12px] font-medium transition ${
              pestana === 'compras'
                ? 'bg-white/[0.07] text-foreground'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Órdenes de compra
            <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] tabular-nums text-faint">
              {compras.length}
            </span>
          </button>
        )}
      </div>

      {pestana === 'proveedores' ? (
        <Panel>
          <PanelCabecera
            titulo="Directorio de proveedores"
            descripcion="Nombre, país, contacto y días de entrega. El Administrador puede crear y editar."
            extra={
              <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
                {cargandoProveedores
                  ? 'Cargando…'
                  : `${proveedoresFiltrados.length} proveedores`}
              </span>
            }
          />

          <div className="border-b border-line px-4 py-3.5 sm:px-5">
            <div className="max-w-md">
              <CampoTexto
                id="buscar-proveedores"
                etiqueta="Buscar"
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Nombre, país, contacto o correo"
                autoComplete="off"
              />
            </div>
          </div>

          {cargandoProveedores ? (
            <EsqueletoProveedores filas={5} />
          ) : errorProveedores ? (
            <div
              role="alert"
              className="flex flex-col items-start gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-negative" />
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    No se pudo cargar el directorio
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-muted">
                    {errorProveedores}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecargaProveedores((valor) => valor + 1)}
                className={clasesBoton('secundario', 'px-3 py-2 text-xs')}
              >
                Reintentar
              </button>
            </div>
          ) : proveedores.length === 0 ? (
            <div className="relative">
              <EsqueletoProveedores filas={4} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-panel/85 px-6 text-center backdrop-blur-[1px]">
                <span className="flex h-11 w-11 items-center justify-center rounded-panel border border-line bg-white/[0.03]">
                  <PackageSearch className="h-4 w-4 text-faint" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    Aún no hay proveedores registrados
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-[12px] leading-5 text-muted">
                    {esAdministrador
                      ? 'Da de alta el primer proveedor para poder registrar compras de refacciones.'
                      : 'Cuando el Administrador registre proveedores aparecerán aquí.'}
                  </p>
                </div>
                {esAdministrador && (
                  <Boton onClick={abrirNuevoProveedor}>
                    <Plus className="h-3.5 w-3.5" />
                    Nuevo proveedor
                  </Boton>
                )}
              </div>
            </div>
          ) : proveedoresFiltrados.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <PackageSearch
                className="mx-auto h-5 w-5 text-faint"
                strokeWidth={1.7}
              />
              <p className="mt-3 text-[14px] font-semibold text-foreground">
                Sin coincidencias
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Prueba con otro nombre, país o correo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-[13px]">
                <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                      Proveedor
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      País
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Contacto
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Días de entrega
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Moneda
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
                  {proveedoresFiltrados.map((proveedor) => (
                    <tr
                      key={proveedor.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel border border-line bg-white/[0.03]">
                            <Store
                              className="h-3.5 w-3.5 text-faint"
                              strokeWidth={1.7}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate font-medium text-foreground">
                              {proveedor.nombre}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-faint tabular-nums">
                              PRV-{String(proveedor.id).padStart(3, '0')}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-muted">{proveedor.pais}</td>

                      <td className="px-4 py-4">
                        {proveedor.contacto ? (
                          <p className="max-w-[200px] truncate text-muted">
                            {proveedor.contacto}
                          </p>
                        ) : (
                          <p className="text-[11px] text-faint">Sin contacto</p>
                        )}
                        {proveedor.telefono && (
                          <p className="mt-0.5 text-[10.5px] text-faint">
                            {proveedor.telefono}
                          </p>
                        )}
                        {!proveedor.telefono && proveedor.correo && (
                          <p className="mt-0.5 max-w-[200px] truncate text-[10.5px] text-faint">
                            {proveedor.correo}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-muted">
                          <Truck className="h-3 w-3" strokeWidth={1.8} />
                          {proveedor.tiempo_entrega_dias === null
                            ? 'Sin definir'
                            : `${proveedor.tiempo_entrega_dias} ${
                                proveedor.tiempo_entrega_dias === 1
                                  ? 'día'
                                  : 'días'
                              }`}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-muted tabular-nums">
                        {proveedor.moneda}
                      </td>

                      <td className="px-4 py-4 text-right sm:px-5">
                        {esAdministrador ? (
                          <button
                            type="button"
                            onClick={() => abrirEdicion(proveedor)}
                            className="inline-flex items-center gap-1.5 rounded-panel border border-line bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-muted transition hover:border-line-strong hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </button>
                        ) : (
                          <span className="text-[11px] text-faint">
                            Solo lectura
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : (
        <Panel>
          <PanelCabecera
            titulo="Órdenes de compra"
            descripcion="Compras registradas a proveedores, de la más reciente a la más antigua."
            extra={
              <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
                {cargandoCompras ? 'Cargando…' : `${compras.length} compras`}
              </span>
            }
          />

          <EstadoTabla
            cargando={cargandoCompras}
            error={errorCompras}
            vacio={compras.length === 0}
            tituloVacio="Aún no hay órdenes de compra"
            detalleVacio="Registra la primera compra con el botón «Registrar compra». Nace en Borrador para su aprobación."
            onReintentar={() => setRecargaCompras((valor) => valor + 1)}
            filasEsqueleto={4}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-[13px]">
                <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                      Folio
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Proveedor
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Fecha
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Estado
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Llegada estimada
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-medium sm:px-5"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {compras.map((compra) => (
                    <tr
                      key={compra.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <p className="font-medium text-foreground tabular-nums">
                          CMP-{String(compra.id).padStart(4, '0')}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-faint">
                          {compra.detalles.length}{' '}
                          {compra.detalles.length === 1 ? 'línea' : 'líneas'}
                          {compra.orden_id
                            ? ` · ORD-${String(compra.orden_id).padStart(4, '0')}`
                            : ''}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[220px] truncate text-muted">
                          {compra.proveedor_nombre}
                        </p>
                        {compra.solicitado_por && (
                          <p className="mt-0.5 max-w-[220px] truncate text-[10.5px] text-faint">
                            Solicitó {compra.solicitado_por}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-muted">
                        {formatearFechaCorta(compra.fecha_pedido.slice(0, 10))}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${ESTILOS_COMPRA[compra.estado]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {compra.estado}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-muted">
                        {compra.fecha_estimada_llegada
                          ? formatearFechaCorta(compra.fecha_estimada_llegada)
                          : 'Sin fecha'}
                      </td>

                      <td className="px-4 py-4 text-right sm:px-5">
                        <p className="font-medium text-foreground tabular-nums">
                          {formatearImporte(
                            compra.total_moneda_original,
                            compra.moneda_original,
                          )}
                        </p>
                        {compra.moneda_original !== 'MXN' &&
                          compra.total_mxn && (
                            <p className="mt-0.5 text-[10.5px] text-faint tabular-nums">
                              {formatearMoneda(Number(compra.total_mxn))}
                            </p>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </EstadoTabla>
        </Panel>
      )}

      {modalProveedor && (
        <ProveedorModal
          proveedor={proveedorEditando ?? undefined}
          onCerrar={cerrarModalProveedor}
          onGuardado={alGuardarProveedor}
        />
      )}

      {modalCompra && (
        <RegistrarCompraModal
          proveedores={proveedores}
          onCerrar={() => setModalCompra(false)}
          onGuardado={alGuardarCompra}
        />
      )}
    </div>
  )
}
