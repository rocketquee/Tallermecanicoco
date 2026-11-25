import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertTriangle,
  CreditCard,
  LoaderCircle,
  Receipt,
  X,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CargadorTaller } from '../../components/ui/CargadorTaller'
import { CampoSelect } from '../../components/formularios/CampoSelect'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { formatearFechaCorta, formatearMoneda } from '../../lib/formato'
import { mensajeDeError } from '../../services/errores'
import { obtenerPagosOrden, registrarPago } from '../../services/pagos'
import {
  METODOS_PAGO,
  TIPOS_PAGO,
} from '../../types/pagos'
import type {
  CobranzaFila,
  MetodoPago,
  PagoOrden,
  TipoPago,
} from '../../types/pagos'

interface Props {
  fila: CobranzaFila
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

function aNumero(valor: string): number {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

/**
 * "Registrar pago" (PAG-03, PAG-04).
 *
 * Muestra el resumen de la orden y su historial, y captura el nuevo cobro.
 * El backend vuelve a validar el saldo, el tipo y el monto antes de guardar:
 * aquí solo se da una validación temprana para evitar viajes innecesarios.
 */
export function RegistrarPagoModal({ fila, onCerrar, onGuardado }: Props) {
  const [detalle, setDetalle] = useState<PagoOrden | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  const [tipo, setTipo] = useState<TipoPago>(
    fila.numero_pagos === 0 ? 'Anticipo' : 'Parcialidad',
  )
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('Transferencia')
  const [referencia, setReferencia] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resumen = detalle?.resumen ?? null

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setErrorCarga(null)

    obtenerPagosOrden(fila.orden_id)
      .then((datos) => {
        if (vigente) {
          setDetalle(datos)
          setTipo(datos.resumen.numero_pagos === 0 ? 'Anticipo' : 'Parcialidad')
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setErrorCarga(
            mensajeDeError(fallo, 'No se pudo cargar el historial de pagos.'),
          )
        }
      })
      .finally(() => {
        if (vigente) {
          setCargando(false)
        }
      })

    return () => {
      vigente = false
    }
  }, [fila.orden_id, recarga])

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

  function cambiarTipo(nuevo: TipoPago) {
    setTipo(nuevo)
    if (nuevo === 'Liquidacion' && resumen) {
      setMonto(aNumero(resumen.saldo).toFixed(2))
    }
  }

  function validar(): string | null {
    if (!resumen) {
      return 'Espera a que cargue el saldo de la orden.'
    }
    const saldo = aNumero(resumen.saldo)
    const cantidad = Number(monto)

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return 'Captura un monto mayor a 0.'
    }
    if (cantidad > saldo) {
      return `El monto no puede superar el saldo pendiente (${formatearMoneda(saldo)}).`
    }
    if (tipo === 'Anticipo' && resumen.numero_pagos > 0) {
      return 'El anticipo solo aplica al primer cobro; usa el tipo Parcialidad.'
    }
    if (tipo === 'Liquidacion' && Math.abs(cantidad - saldo) > 0.005) {
      return `La liquidación debe cubrir el saldo completo (${formatearMoneda(saldo)}).`
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
      const resultado = await registrarPago({
        orden_id: fila.orden_id,
        tipo,
        monto: Number(Number(monto).toFixed(2)),
        metodo_pago: metodo,
        referencia: referencia.trim() || null,
      })
      const restante = aNumero(resultado.resumen.saldo)
      onGuardado(
        `Pago de ${formatearMoneda(
          aNumero(resultado.pago.monto),
        )} registrado en ORD-${String(fila.orden_id).padStart(4, '0')}. ${
          restante > 0
            ? `Saldo restante: ${formatearMoneda(restante)}.`
            : 'La orden quedó liquidada.'
        }`,
      )
    } catch (fallo) {
      setError(mensajeDeError(fallo, 'No se pudo registrar el pago.'))
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cerrar registro de pago"
        onClick={onCerrar}
        disabled={guardando}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-[2px] animate-[fundido-entrada_160ms_ease-out] disabled:cursor-not-allowed"
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-pago"
        onSubmit={alGuardar}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-panel border border-line bg-panel shadow-2xl animate-[panel-entrada_180ms_ease-out] sm:rounded-panel"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-[0.16em] text-faint uppercase">
              Cobranza
            </p>
            <h2
              id="titulo-pago"
              className="mt-1 text-[18px] font-semibold tracking-tight text-foreground"
            >
              Registrar pago · ORD-{String(fila.orden_id).padStart(4, '0')}
            </h2>
            <p className="mt-1 max-w-md truncate text-[11px] text-faint">
              {fila.cliente_nombre} · {fila.vehiculo_descripcion} ·{' '}
              {fila.vehiculo_placas}
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
          {cargando ? (
            <CargadorTaller etiqueta="Cargando saldo e historial…" />
          ) : errorCarga ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-panel border border-negative/30 bg-negative/10 px-3.5 py-3 text-[12px] leading-5 text-negative"
            >
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorCarga}</span>
              </span>
              <button
                type="button"
                onClick={() => setRecarga((valor) => valor + 1)}
                className="self-start rounded-panel border border-negative/40 px-3 py-1.5 text-[11px] font-medium"
              >
                Reintentar
              </button>
            </div>
          ) : (
            detalle &&
            resumen && (
              <>
                <section className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-panel border border-line bg-white/[0.02]">
                  <div className="px-3.5 py-3">
                    <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                      Total
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-foreground tabular-nums">
                      {formatearMoneda(aNumero(resumen.total))}
                    </p>
                  </div>
                  <div className="px-3.5 py-3">
                    <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                      Pagado
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-muted tabular-nums">
                      {formatearMoneda(aNumero(resumen.pagado))}
                    </p>
                  </div>
                  <div className="px-3.5 py-3">
                    <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
                      Saldo
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-foreground tabular-nums">
                      {formatearMoneda(aNumero(resumen.saldo))}
                    </p>
                  </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                  <CampoSelect
                    id="pago-tipo"
                    etiqueta="Tipo de pago *"
                    value={tipo}
                    onChange={(evento) =>
                      cambiarTipo(evento.target.value as TipoPago)
                    }
                    disabled={guardando}
                  >
                    {TIPOS_PAGO.map((opcion) => {
                      const bloqueado =
                        opcion.valor === 'Anticipo' && resumen.numero_pagos > 0
                      return (
                        <option
                          key={opcion.valor}
                          value={opcion.valor}
                          disabled={bloqueado}
                        >
                          {opcion.etiqueta}
                        </option>
                      )
                    })}
                  </CampoSelect>

                  <CampoTexto
                    id="pago-monto"
                    etiqueta="Monto en MXN *"
                    type="number"
                    min={0.01}
                    max={aNumero(resumen.saldo)}
                    step="0.01"
                    value={monto}
                    onChange={(evento) => setMonto(evento.target.value)}
                    placeholder={aNumero(resumen.saldo).toFixed(2)}
                    disabled={guardando}
                  />

                  <CampoSelect
                    id="pago-metodo"
                    etiqueta="Forma de pago *"
                    value={metodo}
                    onChange={(evento) =>
                      setMetodo(evento.target.value as MetodoPago)
                    }
                    disabled={guardando}
                  >
                    {METODOS_PAGO.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </option>
                    ))}
                  </CampoSelect>

                  <CampoTexto
                    id="pago-referencia"
                    etiqueta="Referencia"
                    value={referencia}
                    onChange={(evento) => setReferencia(evento.target.value)}
                    placeholder="Folio o número de transferencia"
                    maxLength={100}
                    disabled={guardando}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMonto(aNumero(resumen.saldo).toFixed(2))
                      cambiarTipo('Liquidacion')
                    }}
                    disabled={guardando || aNumero(resumen.saldo) <= 0}
                    className="rounded-panel border border-line bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium text-muted transition hover:border-line-strong hover:text-foreground disabled:opacity-40"
                  >
                    Cubrir saldo completo
                  </button>
                  <span className="text-[11px] text-faint">
                    La liquidación debe cubrir exactamente el saldo pendiente.
                  </span>
                </div>

                <section>
                  <h3 className="flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-faint uppercase">
                    <Receipt className="h-3.5 w-3.5" />
                    Historial de pagos
                  </h3>

                  {detalle.pagos.length === 0 ? (
                    <p className="mt-2 rounded-panel border border-dashed border-line px-3.5 py-4 text-[12px] text-faint">
                      Aún no hay pagos registrados en esta orden.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-line overflow-hidden rounded-panel border border-line">
                      {detalle.pagos.map((pago) => (
                        <li
                          key={pago.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-foreground">
                              {pago.tipo} · {pago.metodo_pago}
                            </p>
                            <p className="mt-0.5 truncate text-[10.5px] text-faint">
                              {formatearFechaCorta(pago.created_at.slice(0, 10))}
                              {pago.referencia ? ` · ${pago.referencia}` : ''}
                            </p>
                          </div>
                          <p className="shrink-0 text-[12px] font-semibold text-foreground tabular-nums">
                            {formatearMoneda(aNumero(pago.monto))}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )
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
            type="submit"
            disabled={guardando || cargando || !resumen || Boolean(errorCarga)}
          >
            {guardando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {guardando ? 'Registrando…' : 'Registrar pago'}
          </Boton>
        </footer>
      </form>
    </div>
  )
}
