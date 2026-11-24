import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  Boxes,
  LoaderCircle,
  PackagePlus,
  Save,
  X,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoCheckbox } from '../../components/formularios/CampoCheckbox'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { mensajeDeError } from '../../services/errores'
import { crearRefaccion } from '../../services/refacciones'
import type { RefaccionPayload } from '../../types/inventario'

interface Props {
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

/**
 * Alta de una refacción del catálogo. El stock puede nacer en cero: la pieza
 * queda registrada y se surte después con «Surtir inventario».
 *
 * Las piezas especiales (sobre pedido) no se manejan por stock, así que sus
 * existencias se envían en cero.
 */
export function NuevaRefaccionModal({ onCerrar, onGuardado }: Props) {
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [esEspecial, setEsEspecial] = useState(false)
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('2')
  const [precioCosto, setPrecioCosto] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!nombre.trim()) {
      return 'El nombre de la refacción es obligatorio.'
    }

    if (!esEspecial) {
      const actual = Number(stockActual)
      if (!Number.isInteger(actual) || actual < 0) {
        return 'El stock actual debe ser un entero mayor o igual a 0.'
      }
      const minimo = Number(stockMinimo)
      if (!Number.isInteger(minimo) || minimo < 0) {
        return 'El stock mínimo debe ser un entero mayor o igual a 0.'
      }
    }

    if (!precioCosto.trim()) {
      return 'Captura el precio de costo.'
    }
    const costo = Number(precioCosto)
    if (!Number.isFinite(costo) || costo < 0) {
      return 'El precio de costo debe ser un número mayor o igual a 0.'
    }

    if (!precioVenta.trim()) {
      return 'Captura el precio de venta.'
    }
    const venta = Number(precioVenta)
    if (!Number.isFinite(venta) || venta < 0) {
      return 'El precio de venta debe ser un número mayor o igual a 0.'
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

    const payload: RefaccionPayload = {
      nombre: nombre.trim(),
      marca: marca.trim() || null,
      es_especial: esEspecial,
      stock_actual: esEspecial ? 0 : Number(stockActual),
      stock_minimo: esEspecial ? 0 : Number(stockMinimo),
      precio_costo: Number(precioCosto),
      precio_venta: Number(precioVenta),
      // El catálogo de proveedores todavía no tiene pantalla propia; la pieza
      // se puede vincular después sin perder el alta.
      proveedor_id: null,
    }

    setGuardando(true)
    try {
      const creada = await crearRefaccion(payload)
      onGuardado(
        `Refacción ${creada.nombre} registrada con stock ${creada.stock_actual}.`,
      )
    } catch (fallo) {
      setError(mensajeDeError(fallo, 'No se pudo registrar la refacción.'))
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar alta de refacción"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nueva-refaccion"
        onSubmit={alGuardar}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Catálogo de inventario
            </p>
            <h2
              id="titulo-nueva-refaccion"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              Nueva refacción
            </h2>
            <p className="mt-1 text-[11px] text-faint">
              Los campos marcados con * son obligatorios.
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
          <div className="flex items-start gap-2 rounded-panel border border-sky-400/20 bg-sky-400/5 px-3.5 py-3 text-[11px] leading-5 text-sky-100">
            <PackagePlus
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              strokeWidth={1.8}
            />
            <p>
              El alta queda en la bitácora. Si capturas existencias iniciales,
              el sistema registra una entrada de inventario.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <CampoTexto
                id="refaccion-nombre"
                etiqueta="Nombre *"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                maxLength={150}
                placeholder="Ej. Filtro de aceite"
                autoComplete="off"
                disabled={guardando}
                autoFocus
              />
            </div>

            <CampoTexto
              id="refaccion-marca"
              etiqueta="Marca"
              value={marca}
              onChange={(evento) => setMarca(evento.target.value)}
              maxLength={50}
              placeholder="Ej. Bosch"
              disabled={guardando}
            />

            <div className="flex items-end">
              <CampoCheckbox
                id="refaccion-especial"
                etiqueta="Pieza especial (sobre pedido)"
                descripcion="No se maneja por stock; se compra para cada orden."
                checked={esEspecial}
                onChange={(evento) => setEsEspecial(evento.target.checked)}
                disabled={guardando}
                className="w-full"
              />
            </div>

            <CampoTexto
              id="refaccion-stock-actual"
              etiqueta="Stock actual"
              type="number"
              min={0}
              step={1}
              value={esEspecial ? '0' : stockActual}
              onChange={(evento) => setStockActual(evento.target.value)}
              disabled={guardando || esEspecial}
            />

            <CampoTexto
              id="refaccion-stock-minimo"
              etiqueta="Stock mínimo"
              type="number"
              min={0}
              step={1}
              value={esEspecial ? '0' : stockMinimo}
              onChange={(evento) => setStockMinimo(evento.target.value)}
              disabled={guardando || esEspecial}
            />

            <CampoTexto
              id="refaccion-precio-costo"
              etiqueta="Precio de costo (MXN) *"
              type="number"
              min={0}
              step="0.01"
              value={precioCosto}
              onChange={(evento) => setPrecioCosto(evento.target.value)}
              placeholder="Ej. 450.00"
              disabled={guardando}
            />

            <CampoTexto
              id="refaccion-precio-venta"
              etiqueta="Precio de venta (MXN) *"
              type="number"
              min={0}
              step="0.01"
              value={precioVenta}
              onChange={(evento) => setPrecioVenta(evento.target.value)}
              placeholder="Ej. 780.00"
              disabled={guardando}
            />
          </div>

          {esEspecial && (
            <div className="flex items-start gap-2 rounded-panel border border-violet-400/25 bg-violet-400/5 px-3.5 py-3 text-[11px] leading-5 text-violet-100">
              <Boxes className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Al marcarla como especial, el stock se guarda en cero y la pieza
                no aparecerá como disponible en el modal del mecánico.
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
          <Boton type="submit" disabled={guardando}>
            {guardando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {guardando ? 'Guardando…' : 'Registrar refacción'}
          </Boton>
        </footer>
      </form>
    </div>
  )
}
