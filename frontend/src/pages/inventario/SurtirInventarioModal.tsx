import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  LoaderCircle,
  PackagePlus,
  Save,
  X,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoAreaTexto } from '../../components/formularios/CampoAreaTexto'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { mensajeDeError } from '../../services/errores'
import { surtirInventario } from '../../services/refacciones'
import type { RefaccionInventario } from '../../types/inventario'

interface Props {
  refaccion: RefaccionInventario
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

/**
 * Modal para que Administrador o Recepción aumenten las existencias de una
 * refacción. La cantidad sugerida cubre el faltante hasta el stock mínimo.
 */
export function SurtirInventarioModal({
  refaccion,
  onCerrar,
  onGuardado,
}: Props) {
  const sugerida = Math.max(
    refaccion.stock_minimo - refaccion.stock_actual,
    1,
  )

  const [cantidad, setCantidad] = useState(String(sugerida))
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cantidadNumero = Number(cantidad)
  const cantidadValida =
    Number.isInteger(cantidadNumero) &&
    cantidadNumero >= 1 &&
    cantidadNumero <= 9999
  const nuevoStock =
    refaccion.stock_actual + (cantidadValida ? cantidadNumero : 0)

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

  async function alGuardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)

    if (!cantidadValida) {
      setError('La cantidad debe ser un número entero entre 1 y 9999.')
      return
    }

    setGuardando(true)
    try {
      const actualizada = await surtirInventario(refaccion.id, {
        cantidad: cantidadNumero,
        motivo: motivo.trim() || null,
      })
      onGuardado(
        `Se agregaron ${cantidadNumero} pieza(s) de ${actualizada.nombre}. Stock actual: ${actualizada.stock_actual}.`,
      )
    } catch (fallo) {
      setError(
        mensajeDeError(fallo, 'No se pudo surtir el inventario.'),
      )
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar surtir inventario"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-surtir-inventario"
        onSubmit={alGuardar}
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Surtir inventario
            </p>
            <h2
              id="titulo-surtir-inventario"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              {refaccion.nombre}
            </h2>
            <p className="mt-1 text-[11px] text-faint">
              {refaccion.marca ?? 'Sin marca'} · Stock actual{' '}
              <span className="tabular-nums">{refaccion.stock_actual}</span> ·
              Mínimo{' '}
              <span className="tabular-nums">{refaccion.stock_minimo}</span>
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
              Las piezas que agregues se suman al stock actual y quedan
              registradas como una entrada de inventario en la bitácora.
            </p>
          </div>

          <CampoTexto
            id="surtir-cantidad"
            etiqueta="Piezas a agregar *"
            type="number"
            min={1}
            max={9999}
            step={1}
            value={cantidad}
            onChange={(evento) => setCantidad(evento.target.value)}
            disabled={guardando}
            autoFocus
          />

          <CampoAreaTexto
            id="surtir-motivo"
            etiqueta="Motivo (opcional)"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            rows={3}
            maxLength={255}
            placeholder="Ej. Compra a proveedor, devolución de una orden, ajuste de conteo…"
            disabled={guardando}
          />

          <div className="flex items-center justify-between rounded-panel border border-line bg-white/[0.02] px-3.5 py-3 text-[12px]">
            <span className="text-faint">Stock después de surtir</span>
            <span className="font-semibold text-foreground tabular-nums">
              {nuevoStock} pieza(s)
            </span>
          </div>

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
          <Boton type="submit" disabled={guardando || !cantidadValida}>
            {guardando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {guardando ? 'Guardando…' : 'Surtir inventario'}
          </Boton>
        </footer>
      </form>
    </div>
  )
}
