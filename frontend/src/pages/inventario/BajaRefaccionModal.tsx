import { useEffect, useState } from 'react'
import { AlertTriangle, LoaderCircle, Trash2, X } from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { mensajeDeError } from '../../services/errores'
import { actualizarRefaccion } from '../../services/refacciones'
import type { RefaccionInventario } from '../../types/inventario'

interface Props {
  refaccion: RefaccionInventario
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

/**
 * Baja lógica de una refacción: se apaga con ``activo = false`` (SEG-07).
 * La pieza y su historial se conservan; solo deja de ofrecerse en el catálogo.
 */
export function BajaRefaccionModal({
  refaccion,
  onCerrar,
  onGuardado,
}: Props) {
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

  async function alConfirmar() {
    setError(null)
    setGuardando(true)
    try {
      const actualizada = await actualizarRefaccion(refaccion.id, {
        activo: false,
      })
      onGuardado(
        `Refacción ${actualizada.nombre} dada de baja. Su historial se conserva.`,
      )
    } catch (fallo) {
      setError(mensajeDeError(fallo, 'No se pudo dar de baja la refacción.'))
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar baja de refacción"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-baja-refaccion"
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Baja de refacción
            </p>
            <h2
              id="titulo-baja-refaccion"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              {refaccion.nombre}
            </h2>
            <p className="mt-1 text-[11px] text-faint">
              {refaccion.marca ?? 'Sin marca'} · Stock actual{' '}
              <span className="tabular-nums">{refaccion.stock_actual}</span>
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

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-2 rounded-panel border border-amber-400/25 bg-amber-400/5 px-3.5 py-3 text-[11px] leading-5 text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              La refacción deja de aparecer en el catálogo y ya no podrá
              seleccionarse en las órdenes. No se borra nada: el historial de
              compras y consumos se conserva para auditoría.
            </p>
          </div>

          {refaccion.stock_actual > 0 && (
            <p className="text-[12px] leading-6 text-muted">
              Aún quedan{' '}
              <strong className="font-semibold text-foreground tabular-nums">
                {refaccion.stock_actual} pieza(s)
              </strong>{' '}
              en existencia. Considera agotarlas antes de darla de baja.
            </p>
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
          <Boton
            variante="peligro"
            onClick={alConfirmar}
            disabled={guardando}
            type="button"
          >
            {guardando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {guardando ? 'Dando de baja…' : 'Dar de baja'}
          </Boton>
        </footer>
      </div>
    </div>
  )
}
