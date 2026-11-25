/** Tipos del módulo de pagos y cobranza (PAG-01 a PAG-07). */

import type { EstadoOrden } from './ordenes'

export type TipoPago = 'Anticipo' | 'Parcialidad' | 'Liquidacion'
export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Tarjeta'

/** Pago registrado sobre una orden. */
export interface Pago {
  id: number
  orden_id: number
  tipo: TipoPago
  /** Texto decimal: Pydantic serializa Decimal como cadena. */
  monto: string
  metodo_pago: MetodoPago
  referencia: string | null
  created_at: string
}

/** Total, cobrado y pendiente de una orden (PAG-05). */
export interface SaldoOrden {
  orden_id: number
  total: string
  pagado: string
  saldo: string
  liquidado: boolean
  numero_pagos: number
  ultimo_pago: string | null
}

/** Respuesta de POST /api/v1/pagos. */
export interface PagoRegistrado {
  pago: Pago
  resumen: SaldoOrden
}

/** Historial de pagos de una orden con su saldo vigente. */
export interface PagoOrden {
  orden_id: number
  estado: EstadoOrden
  cliente_nombre: string
  vehiculo_placas: string
  pagos: Pago[]
  resumen: SaldoOrden
}

/** Fila del tablero de cuentas por cobrar (una orden por renglón). */
export interface CobranzaFila {
  orden_id: number
  estado: EstadoOrden
  cliente_id: number
  cliente_nombre: string
  vehiculo_placas: string
  vehiculo_descripcion: string
  total: string
  pagado: string
  saldo: string
  numero_pagos: number
  ultimo_pago: string | null
  created_at: string
}

/** Catálogo de tipos de pago con la explicación que se muestra al capturar. */
export const TIPOS_PAGO: ReadonlyArray<{
  valor: TipoPago
  etiqueta: string
}> = [
  { valor: 'Anticipo', etiqueta: 'Anticipo · primer cobro' },
  { valor: 'Parcialidad', etiqueta: 'Parcialidad · abono parcial' },
  { valor: 'Liquidacion', etiqueta: 'Liquidación · saldo completo' },
]

/** Formas de pago aceptadas por la API (PAG-03). */
export const METODOS_PAGO: ReadonlyArray<{
  valor: MetodoPago
  etiqueta: string
}> = [
  { valor: 'Transferencia', etiqueta: 'Transferencia' },
  { valor: 'Efectivo', etiqueta: 'Efectivo' },
  { valor: 'Tarjeta', etiqueta: 'Tarjeta' },
]
