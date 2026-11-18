import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  LoaderCircle,
  Package,
  Plus,
  Save,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { Boton } from '../../components/Boton'
import { CampoAreaTexto } from '../../components/CampoAreaTexto'
import { CampoSelect } from '../../components/CampoSelect'
import { CampoTexto } from '../../components/CampoTexto'
import { EtiquetaOrden } from '../../components/panel/EtiquetaOrden'
import { etiquetaEtapa, etapasSiguientes } from '../../lib/ordenes-taller'
import { mensajeDeError } from '../../services/errores'
import { registrarAvance } from '../../services/ordenes'
import { listarRefacciones } from '../../services/refacciones'
import type { RefaccionDisponible } from '../../types/inventario'
import type { EstadoOrden, Orden } from '../../types/ordenes'

const numeroOrden = (id: number) => `ORD-${String(id).padStart(4, '0')}`

interface LineaRefaccion {
  refaccion: RefaccionDisponible
  cantidad: number
}

interface Props {
  orden: Orden
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

/**
 * Modal donde el mecánico registra su avance: diagnóstico/notas, refacciones
 * usadas y, opcionalmente, la siguiente etapa de la orden.
 */
export function RegistrarAvanceModal({ orden, onCerrar, onGuardado }: Props) {
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico ?? '')
  const [etapaNueva, setEtapaNueva] = useState<'' | EstadoOrden>('')

  const [catalogo, setCatalogo] = useState<RefaccionDisponible[]>([])
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true)
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null)
  const [recargaCatalogo, setRecargaCatalogo] = useState(0)

  const [refaccionId, setRefaccionId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [lineas, setLineas] = useState<LineaRefaccion[]>([])

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const siguientes = etapasSiguientes(orden.estado)
  const refaccionSeleccionada =
    catalogo.find((item) => item.id === Number(refaccionId)) ?? null

  useEffect(() => {
    let vigente = true
    setCargandoCatalogo(true)
    setErrorCatalogo(null)

    listarRefacciones({ disponibles: true, limit: 200 })
      .then((datos) => {
        if (vigente) {
          setCatalogo(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setCatalogo([])
          setErrorCatalogo(
            mensajeDeError(fallo, 'No se pudo cargar el catálogo de refacciones.'),
          )
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoCatalogo(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [recargaCatalogo])

  // Bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !guardando) {
        onCerrar()
      }
    }

    document.addEventListener('keydown', alPresionarTecla)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = overflowPrevio
    }
  }, [guardando, onCerrar])

  function agregarRefaccion() {
    setError(null)
    if (!refaccionSeleccionada) {
      setError('Selecciona una refacción para agregarla.')
      return
    }

    const cantidadNumero = Number(cantidad)
    if (!Number.isInteger(cantidadNumero) || cantidadNumero < 1) {
      setError('La cantidad debe ser un número entero mayor a cero.')
      return
    }
    if (lineas.some((linea) => linea.refaccion.id === refaccionSeleccionada.id)) {
      setError('Esa refacción ya está en la lista.')
      return
    }
    if (cantidadNumero > refaccionSeleccionada.stock_actual) {
      setError(
        `Solo hay ${refaccionSeleccionada.stock_actual} pieza(s) disponibles de ${refaccionSeleccionada.nombre}.`,
      )
      return
    }

    setLineas((actuales) => [
      ...actuales,
      { refaccion: refaccionSeleccionada, cantidad: cantidadNumero },
    ])
    setRefaccionId('')
    setCantidad('1')
  }

  function quitarRefaccion(refaccionIdQuitar: number) {
    setLineas((actuales) =>
      actuales.filter((linea) => linea.refaccion.id !== refaccionIdQuitar),
    )
  }

  async function alGuardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const textoDiagnostico = diagnostico.trim()
    const cambioDiagnostico = textoDiagnostico !== (orden.diagnostico ?? '').trim()

    if (!cambioDiagnostico && !etapaNueva && lineas.length === 0) {
      setError(
        'Escribe un diagnóstico, cambia la etapa o agrega al menos una refacción.',
      )
      return
    }

    setGuardando(true)
    try {
      const actualizada = await registrarAvance(orden.id, {
        ...(cambioDiagnostico
          ? { diagnostico: textoDiagnostico || null }
          : {}),
        ...(etapaNueva ? { etapa_nueva: etapaNueva } : {}),
        refacciones: lineas.map((linea) => ({
          refaccion_id: linea.refaccion.id,
          cantidad: linea.cantidad,
        })),
      })

      onGuardado(
        `Orden ${numeroOrden(orden.id)} actualizada. Etapa actual: ${etiquetaEtapa(
          actualizada.estado,
        )}.`,
      )
    } catch (fallo) {
      setError(
        mensajeDeError(fallo, 'No se pudo registrar el avance de la orden.'),
      )
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar registro de avance"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-registrar-avance"
        onSubmit={alGuardar}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Registrar avance
            </p>
            <h2
              id="titulo-registrar-avance"
              className="mt-1 flex flex-wrap items-center gap-2 text-[18px] font-semibold tracking-tight text-foreground"
            >
              <span className="tabular-nums">{numeroOrden(orden.id)}</span>
              <EtiquetaOrden estado={orden.estado} />
            </h2>
            <p className="mt-1 text-[11px] text-faint">
              {orden.vehiculo_placas} · {orden.vehiculo_marca}{' '}
              {orden.vehiculo_modelo}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex items-start gap-2 rounded-panel border border-sky-400/20 bg-sky-400/5 px-3.5 py-3 text-[11px] leading-5 text-sky-100">
            <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            <p>
              Lo que guardes aquí queda en el historial de la orden. Los
              importes siguen ocultos para tu rol.
            </p>
          </div>

          <CampoAreaTexto
            id="avance-diagnostico"
            etiqueta="Diagnóstico y notas del trabajo"
            value={diagnostico}
            onChange={(evento) => setDiagnostico(evento.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Describe el hallazgo, el trabajo realizado, pruebas pendientes o cualquier nota para recepción…"
            disabled={guardando}
            autoFocus
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <CampoSelect
              id="avance-etapa"
              etiqueta="Cambiar etapa"
              value={etapaNueva}
              onChange={(evento) =>
                setEtapaNueva(evento.target.value as '' | EstadoOrden)
              }
              disabled={guardando || siguientes.length === 0}
            >
              <option value="">
                Mantener {etiquetaEtapa(orden.estado)}
              </option>
              {siguientes.map((etapa) => (
                <option key={etapa} value={etapa}>
                  Avanzar a {etiquetaEtapa(etapa)}
                </option>
              ))}
            </CampoSelect>

            <div className="flex items-end">
              <p className="w-full rounded-panel border border-line bg-white/[0.02] px-3 py-2.5 text-[11px] leading-5 text-faint">
                {siguientes.length === 0
                  ? 'La orden ya está en la última etapa del flujo de taller.'
                  : `Etapas disponibles: ${siguientes
                      .map((etapa) => etiquetaEtapa(etapa))
                      .join(', ')}.`}
              </p>
            </div>
          </div>

          <section className="rounded-panel border border-line bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-faint" strokeWidth={1.8} />
              <h3 className="text-[12px] font-semibold text-foreground">
                Refacciones usadas
              </h3>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-faint">
              Al guardar se descuenta el inventario y se registra la salida.
            </p>

            {cargandoCatalogo ? (
              <p className="mt-4 flex items-center gap-2 text-[12px] text-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando catálogo…
              </p>
            ) : errorCatalogo ? (
              <div className="mt-4 flex flex-col items-start gap-2 rounded-panel border border-negative/30 bg-negative/10 px-3 py-2.5 text-[11px] text-negative sm:flex-row sm:items-center sm:justify-between">
                <p>{errorCatalogo}</p>
                <button
                  type="button"
                  onClick={() => setRecargaCatalogo((valor) => valor + 1)}
                  className="rounded-panel border border-negative/30 px-2.5 py-1.5 font-medium transition hover:border-negative/60"
                >
                  Reintentar
                </button>
              </div>
            ) : catalogo.length === 0 ? (
              <p className="mt-4 rounded-panel border border-line bg-panel px-3 py-2.5 text-[11px] text-faint">
                No hay refacciones con existencia en este momento.
              </p>
            ) : (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_110px_auto] sm:items-end">
                  <CampoSelect
                    id="avance-refaccion"
                    etiqueta="Refacción"
                    value={refaccionId}
                    onChange={(evento) => setRefaccionId(evento.target.value)}
                    disabled={guardando}
                  >
                    <option value="">Selecciona una refacción</option>
                    {catalogo.map((refaccion) => (
                      <option key={refaccion.id} value={refaccion.id}>
                        {refaccion.nombre}
                        {refaccion.marca ? ` · ${refaccion.marca}` : ''} (stock{' '}
                        {refaccion.stock_actual})
                      </option>
                    ))}
                  </CampoSelect>

                  <CampoTexto
                    id="avance-cantidad"
                    etiqueta="Cantidad"
                    type="number"
                    min={1}
                    max={refaccionSeleccionada?.stock_actual ?? undefined}
                    value={cantidad}
                    onChange={(evento) => setCantidad(evento.target.value)}
                    disabled={guardando}
                  />

                  <Boton
                    variante="secundario"
                    onClick={agregarRefaccion}
                    disabled={guardando || !refaccionSeleccionada}
                    className="min-h-11"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Boton>
                </div>

                {lineas.length > 0 && (
                  <ul className="mt-4 divide-y divide-line rounded-panel border border-line bg-panel">
                    {lineas.map((linea) => (
                      <li
                        key={linea.refaccion.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-foreground">
                            {linea.refaccion.nombre}
                          </p>
                          <p className="text-[11px] text-faint">
                            {linea.refaccion.marca ?? 'Sin marca'} · {linea.cantidad}{' '}
                            pieza(s)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarRefaccion(linea.refaccion.id)}
                          disabled={guardando}
                          aria-label={`Quitar ${linea.refaccion.nombre}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-negative/10 hover:text-negative disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-panel border border-negative/30 bg-negative/10 px-3.5 py-3 text-[12px] leading-5 text-negative"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
          <Boton
            variante="secundario"
            onClick={onCerrar}
            disabled={guardando}
            type="button"
          >
            Cancelar
          </Boton>
          <Boton type="submit" disabled={guardando}>
            {guardando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {guardando ? 'Guardando…' : 'Guardar avance'}
          </Boton>
        </footer>
      </form>
    </div>
  )
}
