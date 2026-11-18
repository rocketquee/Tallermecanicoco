import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { Boton } from '../../components/Boton'
import { CampoSelect } from '../../components/CampoSelect'
import { CampoTexto } from '../../components/CampoTexto'
import { clasesBoton } from '../../components/estilosBoton'
import { EncabezadoPagina } from '../../components/panel/EncabezadoPagina'
import { EstadoTabla } from '../../components/panel/EstadoTabla'
import { Panel, PanelCabecera } from '../../components/panel/Panel'
import { useAuth } from '../../context/useAuth'
import { mensajeDeError } from '../../services/errores'
import { listarInventario } from '../../services/refacciones'
import type { RefaccionInventario } from '../../types/inventario'
import { SurtirInventarioModal } from './SurtirInventarioModal'

type FiltroEstado = 'todas' | 'bajo' | 'agotadas' | 'sanas'

const FILTROS_ESTADO: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas las refacciones' },
  { valor: 'bajo', etiqueta: 'Bajo stock o agotadas' },
  { valor: 'agotadas', etiqueta: 'Agotadas' },
  { valor: 'sanas', etiqueta: 'Con existencia suficiente' },
]

interface EstadoRefaccion {
  etiqueta: string
  clase: string
}

function estadoDe(refaccion: RefaccionInventario): EstadoRefaccion {
  if (refaccion.stock_actual === 0) {
    return {
      etiqueta: 'Agotada',
      clase: 'border-negative/30 bg-negative/10 text-negative',
    }
  }
  if (refaccion.stock_actual <= refaccion.stock_minimo) {
    return {
      etiqueta: 'Bajo stock',
      clase: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    }
  }
  return {
    etiqueta: 'Disponible',
    clase: 'border-positive/30 bg-positive/10 text-positive',
  }
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
 * Inventario del taller. Solo Administrador y Recepción: tabla de refacciones
 * con existencias y el modal para surtir piezas. El Mecánico no entra aquí.
 */
export function Inventario() {
  const { usuario } = useAuth()
  const puedeGestionar =
    usuario?.rol === 'Administrador' || usuario?.rol === 'Recepcion'

  const [refacciones, setRefacciones] = useState<RefaccionInventario[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [seleccionada, setSeleccionada] =
    useState<RefaccionInventario | null>(null)

  useEffect(() => {
    if (!puedeGestionar) {
      return
    }

    let vigente = true
    setCargando(true)
    setError(null)

    listarInventario({ limit: 200 })
      .then((datos) => {
        if (vigente) {
          setRefacciones(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (!vigente) {
          return
        }
        setRefacciones([])
        setError(
          mensajeDeError(fallo, 'No se pudo cargar el inventario.'),
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
  }, [puedeGestionar, recarga])

  const agotadas = useMemo(
    () => refacciones.filter((item) => item.stock_actual === 0).length,
    [refacciones],
  )
  const bajoStock = useMemo(
    () =>
      refacciones.filter(
        (item) => item.stock_actual > 0 && item.stock_actual <= item.stock_minimo,
      ).length,
    [refacciones],
  )

  const refaccionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return refacciones.filter((item) => {
      const coincideTexto =
        !texto ||
        item.nombre.toLowerCase().includes(texto) ||
        (item.marca ?? '').toLowerCase().includes(texto)

      const coincideEstado =
        filtro === 'todas' ||
        (filtro === 'agotadas' && item.stock_actual === 0) ||
        (filtro === 'bajo' && item.stock_actual <= item.stock_minimo) ||
        (filtro === 'sanas' && item.stock_actual > item.stock_minimo)

      return coincideTexto && coincideEstado
    })
  }, [refacciones, busqueda, filtro])

  const hayFiltros = Boolean(busqueda.trim() || filtro !== 'todas')

  if (!puedeGestionar) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Almacén del taller"
        titulo="Inventario"
        descripcion="Existencias de refacciones y consumibles. Revisa el stock mínimo y surte las piezas que hagan falta sin salir de esta vista."
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

      <div className="flex gap-3 rounded-panel border border-line bg-white/[0.02] px-4 py-3.5 text-[12px] leading-6 text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
        <p>
          <strong className="font-semibold text-foreground">
            Administrador y Recepción.
          </strong>{' '}
          El mecánico no puede surtir inventario; su modal de avance solo
          descuenta las piezas que usa en cada orden.
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

      <section className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-panel border border-line bg-panel sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Resumen
          etiqueta="Refacciones activas"
          valor={cargando ? '…' : refacciones.length}
        />
        <Resumen etiqueta="Bajo stock" valor={cargando ? '…' : bajoStock} />
        <Resumen etiqueta="Agotadas" valor={cargando ? '…' : agotadas} />
      </section>

      {(bajoStock > 0 || agotadas > 0) && !cargando && (
        <div className="flex items-start gap-2 rounded-panel border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-[11px] leading-5 text-amber-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            {agotadas > 0
              ? `Hay ${agotadas} refacción(es) agotada(s)`
              : 'Hay refacciones por debajo del stock mínimo'}
            {bajoStock > 0
              ? ` y ${bajoStock} en el umbral mínimo. Usa «Surtir» para reponerlas.`
              : '. Usa «Surtir» para reponerlas.'}
          </p>
        </div>
      )}

      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto] md:items-end">
          <CampoTexto
            id="buscar-inventario"
            etiqueta="Buscar"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre o marca de la refacción"
            autoComplete="off"
          />

          <CampoSelect
            id="filtrar-inventario"
            etiqueta="Estado"
            value={filtro}
            onChange={(evento) =>
              setFiltro(evento.target.value as FiltroEstado)
            }
          >
            {FILTROS_ESTADO.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </CampoSelect>

          <button
            type="button"
            onClick={() => {
              setBusqueda('')
              setFiltro('todas')
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
          titulo="Existencias"
          descripcion="Stock actual contra el mínimo definido para cada refacción."
          extra={
            <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
              {cargando
                ? 'Cargando…'
                : `${refaccionesFiltradas.length} refacciones`}
            </span>
          }
        />

        <EstadoTabla
          cargando={cargando}
          error={error}
          vacio={refaccionesFiltradas.length === 0}
          tituloVacio={
            hayFiltros ? 'Sin resultados' : 'Aún no hay refacciones'
          }
          detalleVacio={
            hayFiltros
              ? 'Prueba con otro nombre, marca o cambia el filtro de estado.'
              : 'Cuando el catálogo tenga piezas registradas aparecerán aquí con su stock.'
          }
          onReintentar={() => setRecarga((valor) => valor + 1)}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-[13px]">
              <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                    Refacción
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Marca
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium"
                  >
                    Stock actual
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium"
                  >
                    Stock mínimo
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-medium sm:px-5"
                  >
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {refaccionesFiltradas.map((refaccion) => {
                  const estado = estadoDe(refaccion)
                  const critica =
                    refaccion.stock_actual <= refaccion.stock_minimo

                  return (
                    <tr
                      key={refaccion.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-foreground">
                            {refaccion.nombre}
                          </span>
                          {refaccion.es_especial && (
                            <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                              Especial
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-muted">
                        {refaccion.marca ?? (
                          <span className="text-[11px] text-faint">
                            Sin marca
                          </span>
                        )}
                      </td>

                      <td
                        className={`px-4 py-4 text-right tabular-nums ${
                          critica
                            ? 'font-semibold text-foreground'
                            : 'text-muted'
                        }`}
                      >
                        {refaccion.stock_actual}
                      </td>

                      <td className="px-4 py-4 text-right text-muted tabular-nums">
                        {refaccion.stock_minimo}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${estado.clase}`}
                        >
                          {estado.etiqueta}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right sm:px-5">
                        <Boton
                          variante="secundario"
                          onClick={() => setSeleccionada(refaccion)}
                          className="min-h-9 px-3 py-1.5 text-[11px]"
                          title="Surtir inventario"
                          aria-label={`Surtir inventario de ${refaccion.nombre}`}
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                          Surtir
                        </Boton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </EstadoTabla>

        {!cargando && !error && refaccionesFiltradas.length > 0 && (
          <p className="flex items-center gap-2 border-t border-line px-4 py-3 text-[11px] text-faint sm:px-5">
            <Boxes className="h-3.5 w-3.5 shrink-0" />
            Se muestran hasta 200 refacciones activas del catálogo.
          </p>
        )}
      </Panel>

      {seleccionada && (
        <SurtirInventarioModal
          refaccion={seleccionada}
          onCerrar={() => setSeleccionada(null)}
          onGuardado={(texto) => {
            setRecarga((valor) => valor + 1)
            setSeleccionada(null)
            setMensaje(texto)
          }}
        />
      )}
    </div>
  )
}
