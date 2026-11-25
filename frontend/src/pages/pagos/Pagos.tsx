import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Filter,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { Boton } from '../../components/ui/Boton'
import { CampoTexto } from '../../components/formularios/CampoTexto'
import { clasesBoton } from '../../components/ui/estilosBoton'
import { EncabezadoPagina } from '../../components/ui/EncabezadoPagina'
import { EstadoTabla } from '../../components/ui/EstadoTabla'
import { EtiquetaOrden } from '../../components/ui/EtiquetaOrden'
import { Panel, PanelCabecera } from '../../components/ui/Panel'
import { formatearMoneda } from '../../lib/formato'
import { mensajeDeError } from '../../services/errores'
import { listarCobranza } from '../../services/pagos'
import type { CobranzaFila } from '../../types/pagos'
import { RegistrarPagoModal } from './RegistrarPagoModal'

/** Convierte un texto decimal de la API a número para sumar o comparar. */
function aNumero(valor: string): number {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
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

/**
 * Pagos y cobranza (PAG-01 a PAG-07).
 *
 * Solo el Administrador entra a esta pantalla: muestra los importes de cada
 * orden y permite registrar anticipos, parcialidades y liquidaciones. El saldo
 * lo calcula el backend, nunca el navegador (SEG-18).
 */
export function Pagos() {
  const [filas, setFilas] = useState<CobranzaFila[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [soloConSaldo, setSoloConSaldo] = useState(false)
  const [cobrando, setCobrando] = useState<CobranzaFila | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    listarCobranza({ limit: 200 })
      .then((datos) => {
        if (vigente) {
          setFilas(datos)
        }
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setFilas([])
          setError(
            mensajeDeError(
              fallo,
              'No se pudieron cargar las cuentas por cobrar.',
            ),
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
  }, [recarga])

  // El aviso de éxito desaparece solo para no ocupar espacio permanente.
  useEffect(() => {
    if (!aviso) {
      return
    }
    const temporizador = window.setTimeout(() => setAviso(null), 7000)
    return () => window.clearTimeout(temporizador)
  }, [aviso])

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return filas.filter((fila) => {
      if (soloConSaldo && aNumero(fila.saldo) <= 0) {
        return false
      }
      if (!texto) {
        return true
      }
      return [
        `ord-${String(fila.orden_id).padStart(4, '0')}`,
        fila.cliente_nombre,
        fila.vehiculo_placas,
        fila.vehiculo_descripcion,
      ].some((valor) => valor.toLowerCase().includes(texto))
    })
  }, [filas, busqueda, soloConSaldo])

  const resumen = useMemo(() => {
    const total = filas.reduce((suma, fila) => suma + aNumero(fila.total), 0)
    const cobrado = filas.reduce((suma, fila) => suma + aNumero(fila.pagado), 0)
    const pendiente = filas.reduce((suma, fila) => suma + aNumero(fila.saldo), 0)
    const conImporte = filas.filter((fila) => aNumero(fila.total) > 0).length
    const liquidadas = filas.filter(
      (fila) => aNumero(fila.total) > 0 && aNumero(fila.saldo) <= 0,
    ).length
    return { total, cobrado, pendiente, conImporte, liquidadas }
  }, [filas])

  function alGuardarPago(mensaje: string) {
    setCobrando(null)
    setAviso(mensaje)
    setRecarga((valor) => valor + 1)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <EncabezadoPagina
        etiqueta="Finanzas"
        titulo="Pagos y cobranza"
        descripcion="Saldo de cada orden de servicio. Registra anticipos, parcialidades y liquidaciones; el saldo se calcula en el backend y cada cobro queda en la bitácora."
        acciones={
          <Boton
            variante="secundario"
            onClick={() => setRecarga((valor) => valor + 1)}
            disabled={cargando}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Boton>
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
          etiqueta="Total facturado"
          valor={formatearMoneda(resumen.total)}
          detalle="Suma de las órdenes vigentes"
        />
        <ResumenCelda
          etiqueta="Cobrado"
          valor={formatearMoneda(resumen.cobrado)}
          detalle="Pagos vigentes registrados"
        />
        <ResumenCelda
          etiqueta="Por cobrar"
          valor={formatearMoneda(resumen.pendiente)}
          detalle="Saldo pendiente de las órdenes"
        />
        <ResumenCelda
          etiqueta="Órdenes liquidadas"
          valor={resumen.liquidadas}
          detalle={`De ${resumen.conImporte} órdenes con importe`}
        />
      </section>

      <Panel>
        <PanelCabecera
          titulo="Cuentas por cobrar"
          descripcion="Una fila por orden de servicio, de la más reciente a la más antigua."
          extra={
            <span className="self-start rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted tabular-nums sm:self-auto">
              {cargando ? 'Cargando…' : `${filasFiltradas.length} órdenes`}
            </span>
          }
        />

        <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <div className="w-full max-w-md">
            <CampoTexto
              id="buscar-cobranza"
              etiqueta="Buscar"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Folio, cliente, placas o vehículo"
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            onClick={() => setSoloConSaldo((valor) => !valor)}
            aria-pressed={soloConSaldo}
            className={`inline-flex min-h-9 items-center gap-2 self-start rounded-panel border px-3 text-[12px] font-medium transition sm:self-auto ${
              soloConSaldo
                ? 'border-line-strong bg-white/[0.07] text-foreground'
                : 'border-line bg-white/[0.02] text-muted hover:text-foreground'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Solo con saldo
          </button>
        </div>

        <EstadoTabla
          cargando={cargando}
          error={error}
          vacio={filas.length === 0}
          tituloVacio="No hay órdenes por cobrar"
          detalleVacio="Cuando una orden tenga importe aparecerá aquí con su saldo pendiente."
          onReintentar={() => setRecarga((valor) => valor + 1)}
          filasEsqueleto={5}
        >
          {filasFiltradas.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Wallet className="mx-auto h-5 w-5 text-faint" strokeWidth={1.7} />
              <p className="mt-3 text-[14px] font-semibold text-foreground">
                Sin coincidencias
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Prueba con otro folio, cliente o placas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-[13px]">
                <thead className="bg-white/[0.02] text-[10px] tracking-[0.14em] text-faint uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                      Orden
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Cliente
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Vehículo
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Total
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Pagado
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Saldo
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
                  {filasFiltradas.map((fila) => {
                    const saldo = aNumero(fila.saldo)
                    const total = aNumero(fila.total)
                    const sinImporte = total <= 0
                    const liquidada = !sinImporte && saldo <= 0

                    return (
                      <tr
                        key={fila.orden_id}
                        className="transition hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4 sm:px-5">
                          <p className="font-medium text-foreground tabular-nums">
                            ORD-{String(fila.orden_id).padStart(4, '0')}
                          </p>
                          <div className="mt-1.5">
                            <EtiquetaOrden estado={fila.estado} />
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[200px] truncate text-muted">
                            {fila.cliente_nombre}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-faint">
                            {fila.numero_pagos === 0
                              ? 'Sin pagos'
                              : `${fila.numero_pagos} ${
                                  fila.numero_pagos === 1 ? 'pago' : 'pagos'
                                }`}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[200px] truncate text-muted">
                            {fila.vehiculo_descripcion}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-faint tabular-nums">
                            {fila.vehiculo_placas}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right text-muted tabular-nums">
                          {formatearMoneda(total)}
                        </td>

                        <td className="px-4 py-4 text-right text-muted tabular-nums">
                          {formatearMoneda(aNumero(fila.pagado))}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {sinImporte ? (
                            <span className="text-[11px] text-faint">
                              Sin importe
                            </span>
                          ) : liquidada ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-positive/30 bg-positive/10 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-positive">
                              <CheckCircle2 className="h-3 w-3" />
                              Liquidada
                            </span>
                          ) : (
                            <p className="font-semibold text-foreground tabular-nums">
                              {formatearMoneda(saldo)}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right sm:px-5">
                          <button
                            type="button"
                            onClick={() => setCobrando(fila)}
                            disabled={sinImporte || liquidada}
                            title={
                              sinImporte
                                ? 'La orden aún no tiene importe'
                                : liquidada
                                  ? 'La orden ya está liquidada'
                                  : 'Registrar un pago'
                            }
                            className={clasesBoton(
                              'secundario',
                              'px-3 py-1.5 text-[11px]',
                            )}
                          >
                            <CreditCard className="h-3 w-3" />
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </EstadoTabla>
      </Panel>

      <p className="flex items-start gap-2 px-1 text-[11px] leading-5 text-faint">
        <CircleDollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Los importes se cobran siempre en pesos mexicanos. El backend rechaza
        montos mayores al saldo y liquidaciones que no cubran el total
        pendiente.
      </p>

      {cobrando && (
        <RegistrarPagoModal
          fila={cobrando}
          onCerrar={() => setCobrando(null)}
          onGuardado={alGuardarPago}
        />
      )}
    </div>
  )
}
