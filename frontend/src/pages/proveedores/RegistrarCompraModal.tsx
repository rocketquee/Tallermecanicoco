import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  LoaderCircle,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { formatearFechaCorta } from '../../lib/formato'
import { mensajeDeError } from '../../services/errores'
import { crearCompra } from '../../services/compras'
import { listarInventario } from '../../services/refacciones'
import type { RefaccionInventario } from '../../types/inventario'
import type { Proveedor } from '../../types/proveedores'

interface Props {
  proveedores: Proveedor[]
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

/** Fecha estimada de llegada: hoy + los días de entrega del proveedor. */
function estimarLlegada(dias: number | null): string {
  if (dias === null) {
    return 'Sin tiempo de entrega definido'
  }
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  return formatearFechaCorta(fecha.toISOString().slice(0, 10))
}

/**
 * "Registrar compra de refacción" (PRV-03, PRV-05, PRV-09).
 *
 * Solo pide proveedor, refacción y cantidad. El backend toma el costo del
 * catálogo, calcula los totales, estima la llegada con el tiempo de entrega y
 * deja la compra en estado Borrador para su aprobación.
 */
export function RegistrarCompraModal({
  proveedores,
  onCerrar,
  onGuardado,
}: Props) {
  const proveedoresActivos = useMemo(
    () => proveedores.filter((proveedor) => proveedor.activo),
    [proveedores],
  )

  const [proveedorId, setProveedorId] = useState(
    proveedoresActivos[0]?.id ? String(proveedoresActivos[0].id) : '',
  )
  const [refaccionId, setRefaccionId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [tipoCambio, setTipoCambio] = useState('')

  const [refacciones, setRefacciones] = useState<RefaccionInventario[]>([])
  const [cargandoRefacciones, setCargandoRefacciones] = useState(true)
  const [errorRefacciones, setErrorRefacciones] = useState<string | null>(null)

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const proveedor = useMemo(
    () =>
      proveedoresActivos.find(
        (item) => String(item.id) === proveedorId,
      ) ?? null,
    [proveedoresActivos, proveedorId],
  )
  const requiereTipoCambio = Boolean(
    proveedor && proveedor.moneda !== 'MXN',
  )

  // Si el catálogo de proveedores termina de cargar con el modal abierto,
  // selecciona el primero para que el formulario quede listo.
  useEffect(() => {
    if (!proveedorId && proveedoresActivos.length > 0) {
      setProveedorId(String(proveedoresActivos[0].id))
    }
  }, [proveedorId, proveedoresActivos])

  useEffect(() => {
    let vigente = true
    setCargandoRefacciones(true)
    setErrorRefacciones(null)

    listarInventario({ limit: 200 })
      .then((datos) => {
        if (vigente) {
          setRefacciones(datos)
          setRefaccionId((actual) => actual || String(datos[0]?.id ?? ''))
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setErrorRefacciones(
            mensajeDeError(fallo, 'No se pudo cargar el catálogo de refacciones.'),
          )
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoRefacciones(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [])

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

  function validar(): string | null {
    if (!proveedorId) {
      return 'Selecciona un proveedor.'
    }
    if (!refaccionId) {
      return 'Selecciona la refacción que se va a comprar.'
    }
    const unidades = Number(cantidad)
    if (!Number.isInteger(unidades) || unidades < 1 || unidades > 9999) {
      return 'La cantidad debe ser un entero entre 1 y 9999.'
    }
    if (requiereTipoCambio) {
      const cambio = Number(tipoCambio)
      if (!Number.isFinite(cambio) || cambio <= 0) {
        return `El proveedor cotiza en ${proveedor?.moneda}; captura un tipo de cambio mayor a 0.`
      }
    }
    return null
  }

  async function alGuardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    const errorValidacion = validar()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setGuardando(true)
    try {
      const compra = await crearCompra({
        proveedor_id: Number(proveedorId),
        refaccion_id: Number(refaccionId),
        cantidad: Number(cantidad),
        tipo_cambio: requiereTipoCambio ? Number(tipoCambio) : undefined,
      })
      onGuardado(
        `Compra #${compra.id} registrada en Borrador para ${compra.proveedor_nombre}.`,
      )
    } catch (fallo) {
      setError(mensajeDeError(fallo, 'No se pudo registrar la compra.'))
      setGuardando(false)
    }
  }

  const sinProveedores = proveedoresActivos.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar registro de compra"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-compra"
        onSubmit={alGuardar}
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Órdenes de compra
            </p>
            <h2
              id="titulo-compra"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              Registrar compra de refacción
            </h2>
            <p className="mt-1 text-[11px] text-faint">
              La compra nace en Borrador y espera la aprobación del
              Administrador.
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {sinProveedores ? (
            <div className="flex items-start gap-2 rounded-panel border border-amber-400/25 bg-amber-400/5 px-3.5 py-3 text-[11px] leading-5 text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                No hay proveedores vigentes. Registra uno con «Nuevo proveedor»
                antes de capturar la compra.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <CampoSelect
                id="compra-proveedor"
                etiqueta="Proveedor *"
                value={proveedorId}
                onChange={(evento) => setProveedorId(evento.target.value)}
                disabled={guardando}
              >
                {proveedoresActivos.map((opcion) => (
                  <option key={opcion.id} value={opcion.id}>
                    {opcion.nombre} · {opcion.moneda}
                  </option>
                ))}
              </CampoSelect>

              {proveedor && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-panel border border-line bg-white/[0.02] px-3.5 py-3 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-faint" />
                    {proveedor.tiempo_entrega_dias === null
                      ? 'Entrega sin definir'
                      : `Entrega en ${proveedor.tiempo_entrega_dias} ${proveedor.tiempo_entrega_dias === 1 ? 'día' : 'días'}`}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-faint" />
                    Llegada estimada:{' '}
                    {estimarLlegada(proveedor.tiempo_entrega_dias)}
                  </span>
                </div>
              )}

              <CampoSelect
                id="compra-refaccion"
                etiqueta="Refacción *"
                value={refaccionId}
                onChange={(evento) => setRefaccionId(evento.target.value)}
                disabled={guardando || cargandoRefacciones}
              >
                {cargandoRefacciones && <option value="">Cargando…</option>}
                {!cargandoRefacciones && refacciones.length === 0 && (
                  <option value="">Sin refacciones en el catálogo</option>
                )}
                {refacciones.map((opcion) => (
                  <option key={opcion.id} value={opcion.id}>
                    {opcion.nombre}
                    {opcion.marca ? ` · ${opcion.marca}` : ''}
                  </option>
                ))}
              </CampoSelect>

              {errorRefacciones && (
                <p className="text-[11px] leading-5 text-negative">
                  {errorRefacciones}
                </p>
              )}

              <CampoTexto
                id="compra-cantidad"
                etiqueta="Cantidad *"
                type="number"
                min={1}
                max={9999}
                step={1}
                value={cantidad}
                onChange={(evento) => setCantidad(evento.target.value)}
                disabled={guardando}
              />

              {requiereTipoCambio && (
                <CampoTexto
                  id="compra-tipo-cambio"
                  etiqueta={`Tipo de cambio ${proveedor?.moneda} → MXN *`}
                  type="number"
                  min={0.0001}
                  step="0.0001"
                  value={tipoCambio}
                  onChange={(evento) => setTipoCambio(evento.target.value)}
                  placeholder="Ej. 17.2500"
                  disabled={guardando}
                />
              )}

              <p className="text-[11px] leading-5 text-faint">
                El importe se calcula en el backend con el costo del catálogo y
                el tipo de cambio. No se capturan precios desde esta pantalla.
              </p>
            </div>
          )}

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
          <Boton type="submit" disabled={guardando || sinProveedores}>
            {guardando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            {guardando ? 'Registrando…' : 'Registrar compra'}
          </Boton>
        </footer>
      </form>
    </div>
  )
}
