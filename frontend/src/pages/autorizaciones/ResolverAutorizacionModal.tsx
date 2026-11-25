import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { formatearFechaCorta, formatearMoneda } from '../../lib/formato'
import { resolverAutorizacion } from '../../services/autorizaciones'
import { mensajeDeError } from '../../services/errores'
import type {
  AutorizacionOrden,
  EstadoAutorizacion,
} from '../../types/autorizaciones'

interface Props {
  item: AutorizacionOrden
  montoUmbral: string
  /** Recepción y las solicitudes ya resueltas se abren en modo consulta. */
  soloLectura: boolean
  onCerrar: () => void
  onResuelto: (mensaje: string) => void
}

const ESTILOS_AUTORIZACION: Record<EstadoAutorizacion, string> = {
  Pendiente: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Aprobada: 'border-positive/30 bg-positive/10 text-positive',
  Rechazada: 'border-negative/30 bg-negative/10 text-negative',
}

const ETIQUETAS_TIPO: Record<string, string> = {
  Monto_Alto: 'Monto alto',
  Saldo_Pendiente: 'Saldo pendiente',
  Reautorizacion: 'Reautorización',
}

function aNumero(valor: string): number {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

/**
 * Revisión de una autorización (AUT-03, AUT-05).
 *
 * El Administrador aprueba o rechaza; el motivo del rechazo es obligatorio
 * aquí porque el backend lo guarda en la bitácora. Recepción ve el mismo
 * detalle en modo consulta.
 */
export function ResolverAutorizacionModal({
  item,
  montoUmbral,
  soloLectura,
  onCerrar,
  onResuelto,
}: Props) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState<'aprobar' | 'rechazar' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const total = aNumero(item.total)
  const umbral = aNumero(montoUmbral)
  const excedente = total - umbral

  // Bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !enviando) {
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
  }, [enviando, onCerrar])

  async function resolver(aprobado: boolean) {
    setError(null)

    if (!aprobado && !motivo.trim()) {
      setError('Escribe el motivo del rechazo antes de continuar.')
      return
    }

    setEnviando(aprobado ? 'aprobar' : 'rechazar')
    try {
      const resuelta = await resolverAutorizacion(item.orden_id, {
        aprobado,
        motivo: motivo.trim() || null,
      })
      const folio = `ORD-${String(item.orden_id).padStart(4, '0')}`
      onResuelto(
        aprobado
          ? `${folio} aprobada por ${resuelta.aprobado_por ?? 'el Administrador'}.`
          : `${folio} rechazada. La orden sigue bloqueada y el motivo quedó en la bitácora.`,
      )
    } catch (fallo) {
      setError(
        mensajeDeError(
          fallo,
          'No se pudo guardar la decisión de la autorización.',
        ),
      )
      setEnviando(null)
    }
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    void resolver(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar revisión de autorización"
        onClick={onCerrar}
        disabled={Boolean(enviando)}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-autorizacion"
        onSubmit={alEnviar}
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Autorización por monto
            </p>
            <h2
              id="titulo-autorizacion"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              ORD-{String(item.orden_id).padStart(4, '0')} ·{' '}
              {item.cliente_nombre}
            </h2>
            <p className="mt-1 max-w-md truncate text-[11px] text-faint">
              {item.vehiculo_descripcion} · {item.vehiculo_placas}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={Boolean(enviando)}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel text-faint transition hover:bg-white/[0.04] hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-panel border border-line bg-white/[0.02]">
            <div className="px-3.5 py-3">
              <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                Total de la orden
              </p>
              <p className="mt-1 text-[15px] font-semibold text-foreground tabular-nums">
                {formatearMoneda(total)}
              </p>
            </div>
            <div className="px-3.5 py-3">
              <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                Saldo
              </p>
              <p className="mt-1 text-[15px] font-semibold text-muted tabular-nums">
                {formatearMoneda(aNumero(item.saldo))}
              </p>
            </div>
            <div className="px-3.5 py-3">
              <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                Umbral
              </p>
              <p className="mt-1 text-[15px] font-semibold text-muted tabular-nums">
                {formatearMoneda(umbral)}
              </p>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${ESTILOS_AUTORIZACION[item.estado]}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.estado}
            </span>
            <span>
              {item.tipo
                ? ETIQUETAS_TIPO[item.tipo] ?? item.tipo
                : 'Sin solicitud registrada'}
            </span>
            {excedente > 0 && (
              <span className="text-faint">
                Excede el umbral por {formatearMoneda(excedente)}
              </span>
            )}
          </div>

          {soloLectura ? (
            item.estado === 'Pendiente' ? (
              <div className="flex items-start gap-2 rounded-panel border border-amber-400/25 bg-amber-400/5 px-3.5 py-3 text-[12px] leading-5 text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Solo el Administrador puede aprobar o rechazar esta
                  solicitud. Puedes consultar el detalle, pero la orden seguirá
                  bloqueada hasta que se resuelva.
                </p>
              </div>
            ) : (
              <div className="rounded-panel border border-line bg-white/[0.02] px-3.5 py-3 text-[12px] leading-5">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  {item.estado === 'Aprobada' ? (
                    <CheckCircle2 className="h-4 w-4 text-positive" />
                  ) : (
                    <ShieldX className="h-4 w-4 text-negative" />
                  )}
                  {item.estado === 'Aprobada'
                    ? 'Orden autorizada'
                    : 'Solicitud rechazada'}
                </p>
                <p className="mt-1 text-muted">
                  Resolvió {item.aprobado_por ?? 'el Administrador'}
                  {item.fecha_resolucion
                    ? ` el ${formatearFechaCorta(
                        item.fecha_resolucion.slice(0, 10),
                      )}`
                    : ''}
                  .
                </p>
                <p className="mt-1 text-faint">
                  El detalle de la decisión quedó asentado en la bitácora.
                </p>
              </div>
            )
          ) : (
            <div>
              <label htmlFor="autorizacion-motivo" className="block">
                <span className="mb-1.5 block text-[11px] font-medium text-muted">
                  Motivo {item.estado === 'Pendiente' ? '(obligatorio al rechazar)' : ''}
                </span>
                <textarea
                  id="autorizacion-motivo"
                  rows={3}
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  maxLength={500}
                  disabled={Boolean(enviando)}
                  placeholder="Ej. El cliente autorizó el diagnóstico ampliado; se aprueba el monto."
                  className="w-full resize-none rounded-panel border border-line bg-white/[0.02] px-3 py-2.5 text-[13px] text-foreground outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
              <p className="mt-1.5 text-[11px] leading-5 text-faint">
                El comentario se guarda en la bitácora junto con tu nombre y la
                fecha de la decisión (AUT-05).
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
          {soloLectura ? (
            <Boton variante="secundario" type="button" onClick={onCerrar}>
              Cerrar
            </Boton>
          ) : (
            <>
              <Boton
                variante="secundario"
                type="button"
                onClick={onCerrar}
                disabled={Boolean(enviando)}
              >
                Cancelar
              </Boton>
              <Boton
                variante="peligro"
                type="button"
                onClick={() => void resolver(false)}
                disabled={Boolean(enviando)}
              >
                {enviando === 'rechazar' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldX className="h-4 w-4" />
                )}
                Rechazar
              </Boton>
              <Boton type="submit" disabled={Boolean(enviando)}>
                {enviando === 'aprobar' ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Aprobar
              </Boton>
            </>
          )}
        </footer>
      </form>
    </div>
  )
}
