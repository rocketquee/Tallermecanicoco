import api from './api'
import type { EstadoOrden } from '../types/ordenes'
import type {
  CobranzaFila,
  MetodoPago,
  PagoOrden,
  PagoRegistrado,
  SaldoOrden,
  TipoPago,
} from '../types/pagos'

export interface FiltrosCobranza {
  estado?: EstadoOrden
  soloConSaldo?: boolean
  limit?: number
}

/** Cuerpo de POST /api/v1/pagos. Solo Administrador. */
export interface PagoPayload {
  orden_id: number
  tipo: TipoPago
  monto: number
  metodo_pago: MetodoPago
  referencia?: string | null
}

/**
 * Cuentas por cobrar: una fila por orden con total, cobrado y saldo.
 * Solo Administrador (SEG-02).
 */
export async function listarCobranza(
  filtros: FiltrosCobranza = {},
): Promise<CobranzaFila[]> {
  const { data } = await api.get<CobranzaFila[]>('/pagos/cobranza', {
    params: {
      estado: filtros.estado || undefined,
      solo_con_saldo: filtros.soloConSaldo || undefined,
      limit: filtros.limit ?? 200,
    },
  })
  return data
}

/** Registra un anticipo, una parcialidad o la liquidación de una orden. */
export async function registrarPago(
  payload: PagoPayload,
): Promise<PagoRegistrado> {
  const { data } = await api.post<PagoRegistrado>('/pagos', payload)
  return data
}

/** Historial de pagos de una orden con su resumen de saldo. */
export async function obtenerPagosOrden(
  ordenId: number,
): Promise<PagoOrden> {
  const { data } = await api.get<PagoOrden>(`/pagos/orden/${ordenId}`)
  return data
}

/** Saldo pendiente de una orden (PAG-05). */
export async function obtenerSaldo(ordenId: number): Promise<SaldoOrden> {
  const { data } = await api.get<SaldoOrden>(`/pagos/orden/${ordenId}/saldo`)
  return data
}
